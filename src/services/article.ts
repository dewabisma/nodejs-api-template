import { Inject, Service } from 'typedi';
import type { Logger } from 'winston';
import {
  and,
  arrayOverlaps,
  count,
  eq,
  getTableColumns,
  inArray,
  sql,
} from 'drizzle-orm';
import type { CreateArticle, UpdateArticle } from '../interfaces/Article.js';

@Service()
export default class ArticleService {
  constructor(
    @Inject('articles') private articleModel: Models.ArticleModel,
    @Inject('tags') private tagModel: Models.TagModel,
    @Inject('psql')
    private psql: DB.Driver,
    @Inject('idGenerator') private generateUniqueID: () => bigint,
    @Inject('sqlBuilders')
    private sqlBuilders: DB.SqlBuilders,
    @Inject('webhookHandlers') private webhookHandlers: Webhook.Handlers,
    @Inject('logger') private logger: Logger,
    @Inject('errors') private CustomError: CustomError.Handlers,
    @Inject('slugifier') private slugify: (title: string) => string,
    @Inject('purifier') private purify: Sanitizer.DOMSanitizer,
    @Inject('fileCleaner')
    private deleteUnusedAssets: (
      paths: { oldFilePath?: string | null; newFilePath?: string | null }[],
    ) => Promise<void>,
  ) {}

  private getRowOffset(
    options: Necessary<
      Pick<DB.QueryOptions, 'limit' | 'offset' | 'page'>,
      'limit'
    >,
  ) {
    if (options.limit === 'null') return 0;
    if (options.offset) return options.offset;
    if (options.page) {
      return (options.page - 1) * options.limit;
    }

    return 0;
  }

  public async query(options: DB.QueryOptions) {
    const { tags, ...articleCols } = getTableColumns(this.articleModel);

    const countDriver = this.psql
      .select({ count: count() })
      .from(this.articleModel);
    const selectDriver = this.psql
      .select({
        ...articleCols,
        tags: sql<
          { id: bigint; name: string }[]
        >`jsonb_agg(jsonb_build_object('id', ${this.tagModel.id}, 'name', ${this.tagModel.name}))`,
      })
      .from(this.articleModel)
      .leftJoin(
        this.tagModel,
        sql`${this.tagModel.id} = ANY(${this.articleModel.tags})`,
      )
      .groupBy(this.articleModel.id);

    const pageSize = options.limit ?? 100;
    const isUnlimitedSize = options.limit === 'null';
    const rowOffset = this.getRowOffset({ ...options, limit: pageSize });

    if (options.filter) {
      const filterArgs = this.sqlBuilders.buildFilters(
        this.articleModel,
        options.filter,
      );
      selectDriver.where(filterArgs);
      countDriver.where(filterArgs);
    }
    selectDriver.offset(rowOffset);
    if (!isUnlimitedSize) selectDriver.limit(pageSize as number);
    if (options.order) {
      const orderArgs = this.sqlBuilders.buildSorts(
        this.articleModel,
        options.order,
      );

      selectDriver.orderBy(...orderArgs);
    }

    const articles = await selectDriver;
    const [total] = await countDriver;

    const pageTotal = isUnlimitedSize
      ? 1
      : Math.ceil((total?.count ?? 0) / (pageSize as number));
    const currentPage = isUnlimitedSize
      ? 1
      : options.page ?? Math.floor(rowOffset / (pageSize as number)) + 1;

    return {
      data: articles,
      meta: {
        pageTotal,
        currentPage: currentPage > pageTotal ? pageTotal : currentPage,
        itemTotal: total?.count ?? 0,
      },
    };
  }

  public async querySimilaryArticles(id: bigint, options: DB.QueryOptions) {
    this.logger.info('Finding existing article by given id');
    const [article] = await this.psql
      .select()
      .from(this.articleModel)
      .where(eq(this.articleModel.id, id));

    if (!article)
      throw new this.CustomError.NotFoundError(
        'Article with given id is not found.',
      );

    this.logger.info('Finding similar articles by comparing tags');
    let filterQuery: any = arrayOverlaps(
      this.articleModel.tags,
      article.tags ?? [],
    );

    const { tags, ...articleCols } = getTableColumns(this.articleModel);

    const countDriver = this.psql
      .select({ count: count() })
      .from(this.articleModel);
    const selectDriver = this.psql
      .select({
        ...articleCols,
        tags: sql<
          { id: bigint; name: string }[]
        >`jsonb_agg(jsonb_build_object('id', ${this.tagModel.id}, 'name', ${this.tagModel.name}))`,
      })
      .from(this.articleModel)
      .leftJoin(
        this.tagModel,
        sql`${this.tagModel.id} = ANY(${this.articleModel.tags})`,
      )
      .groupBy(this.articleModel.id);

    const pageSize = options.limit ?? 100;
    const isUnlimitedSize = options.limit === 'null';
    const rowOffset = this.getRowOffset({ ...options, limit: pageSize });

    if (options.filter) {
      const filterArgs = this.sqlBuilders.buildFilters(
        this.articleModel,
        options.filter,
      );

      filterQuery = and(filterQuery, filterArgs);
    }
    selectDriver.offset(rowOffset);
    if (!isUnlimitedSize) selectDriver.limit(pageSize as number);
    if (options.order) {
      const orderArgs = this.sqlBuilders.buildSorts(
        this.articleModel,
        options.order,
      );

      selectDriver.orderBy(...orderArgs);
    }

    const similarArticles = await selectDriver.where(filterQuery);
    const [total] = await countDriver.where(filterQuery);

    const pageTotal = isUnlimitedSize
      ? 1
      : Math.ceil((total?.count ?? 0) / (pageSize as number));
    const currentPage = isUnlimitedSize
      ? 1
      : options.page ?? Math.floor(rowOffset / (pageSize as number)) + 1;

    return {
      data: similarArticles,
      meta: {
        pageTotal,
        currentPage: currentPage > pageTotal ? pageTotal : currentPage,
        itemTotal: total?.count ?? 0,
      },
    };
  }

  public async getById(id: bigint) {
    const { tags, ...articleCols } = getTableColumns(this.articleModel);

    const [article] = await this.psql
      .select({
        ...articleCols,
        tags: sql<
          { id: bigint; name: string }[]
        >`jsonb_agg(jsonb_build_object('id', ${this.tagModel.id}, 'name', ${this.tagModel.name}))`,
      })
      .from(this.articleModel)
      .leftJoin(
        this.tagModel,
        sql`${this.tagModel.id} = ANY(${this.articleModel.tags})`,
      )
      .where(eq(this.articleModel.id, id))
      .groupBy(this.articleModel.id);

    if (!article)
      throw new this.CustomError.NotFoundError(
        'Article with given id is not found.',
      );

    return article;
  }

  public async update(article: UpdateArticle, id: bigint) {
    const [isExist] = await this.psql
      .select({
        tags: this.articleModel.tags,
        banner: this.articleModel.banner,
        cover: this.articleModel.cover,
      })
      .from(this.articleModel)
      .where(eq(this.articleModel.id, id));
    if (!isExist)
      throw new this.CustomError.NotFoundError(
        'Article with given id is not found.',
      );

    this.logger.info('Processing article tags mutation.');
    let updatedTags: bigint[] | null = isExist.tags;

    if (article.addedTags) {
      updatedTags = [...(updatedTags ?? []), ...article.addedTags];
    }

    if (updatedTags && article.removedTags) {
      updatedTags = updatedTags.filter(
        (tag) => !article.removedTags?.includes(tag),
      );
    }

    const updateSlug = article.title ? this.slugify(article.title) : null;
    const updateContent = article.content
      ? this.purify.sanitize(article.content)
      : null;

    await this.psql
      .update(this.articleModel)
      .set({
        ...article,
        updatedAt: new Date(),
        ...(updateContent && { content: updateContent }),
        ...(updateSlug && { slug: updateSlug }),
        tags: updatedTags,
      })
      .where(eq(this.articleModel.id, id));

    await this.deleteUnusedAssets([
      { oldFilePath: isExist.banner, newFilePath: article.banner },
      { oldFilePath: isExist.cover, newFilePath: article.cover },
    ]);

    await this.webhookHandlers.update({
      serviceName: 'article',
      methodName: 'update',
    });
  }

  public async create(newArticle: CreateArticle) {
    const sanitizedContent = this.purify.sanitize(newArticle.content);

    const createdArticle = await this.psql
      .insert(this.articleModel)
      .values({
        ...newArticle,
        content: sanitizedContent,
        id: newArticle.id ?? this.generateUniqueID(),
        slug: this.slugify(newArticle.title),
      })
      .returning({ id: this.articleModel.id });

    await this.webhookHandlers.create({
      serviceName: 'article',
      methodName: 'create',
    });

    return createdArticle[0]!.id;
  }

  public async deleteByIds(ids: bigint[]) {
    const deletedIds = await this.psql
      .delete(this.articleModel)
      .where(inArray(this.articleModel.id, ids))
      .returning({
        id: this.articleModel.id,
        banner: this.articleModel.banner,
        cover: this.articleModel.cover,
      });

    const mappedIds = deletedIds.map((val) => val.id);

    if (mappedIds.length === 0)
      throw new this.CustomError.NotFoundError(
        'Articles with given ids are not found.',
      );

    const deletedAssets: {
      oldFilePath?: string | null;
      newFilePath?: string | null;
    }[] = [];

    deletedIds.forEach((article) => {
      deletedAssets.push({
        oldFilePath: article.banner,
        newFilePath: '-deleted-',
      });

      deletedAssets.push({
        oldFilePath: article.cover,
        newFilePath: '-deleted-',
      });
    });

    await this.deleteUnusedAssets(deletedAssets);

    await this.webhookHandlers.delete({
      serviceName: 'article',
      methodName: 'deleteByIds',
    });

    return mappedIds;
  }
}
