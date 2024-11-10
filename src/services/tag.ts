import { Inject, Service } from 'typedi';
import type { Logger } from 'winston';
import { count, eq, inArray } from 'drizzle-orm';
import type { CreateTag, UpdateTag } from '../interfaces/Tag.js';

@Service()
export default class TagService {
  constructor(
    @Inject('tags') private tagModel: Models.TagModel,
    @Inject('psql')
    private psql: DB.Driver,
    @Inject('idGenerator') private generateUniqueID: () => bigint,
    @Inject('sqlBuilders')
    private sqlBuilders: DB.SqlBuilders,
    @Inject('logger') private logger: Logger,
    @Inject('errors') private CustomError: CustomError.Handlers,
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
    const countDriver = this.psql
      .select({ count: count() })
      .from(this.tagModel);
    const selectDriver = this.psql.select().from(this.tagModel);

    const pageSize = options.limit ?? 100;
    const isUnlimitedSize = options.limit === 'null';
    const rowOffset = this.getRowOffset({ ...options, limit: pageSize });

    if (options.filter) {
      const filterArgs = this.sqlBuilders.buildFilters(
        this.tagModel,
        options.filter,
      );
      selectDriver.where(filterArgs);
      countDriver.where(filterArgs);
    }
    selectDriver.offset(rowOffset);
    if (!isUnlimitedSize) selectDriver.limit(pageSize as number);
    if (options.order) {
      const orderArgs = this.sqlBuilders.buildSorts(
        this.tagModel,
        options.order,
      );

      selectDriver.orderBy(...orderArgs);
    }

    const tags = await selectDriver;
    const [total] = await countDriver;

    const pageTotal = isUnlimitedSize
      ? 1
      : Math.ceil((total?.count ?? 0) / (pageSize as number));
    const currentPage = isUnlimitedSize
      ? 1
      : options.page ?? Math.floor(rowOffset / (pageSize as number)) + 1;

    return {
      data: tags,
      meta: {
        pageTotal,
        currentPage: currentPage > pageTotal ? pageTotal : currentPage,
        itemTotal: total?.count ?? 0,
      },
    };
  }

  public async getById(id: bigint) {
    const [tag] = await this.psql
      .select()
      .from(this.tagModel)
      .where(eq(this.tagModel.id, id));

    if (!tag)
      throw new this.CustomError.NotFoundError(
        'Tag with given id is not found.',
      );

    return tag;
  }

  public async update(tag: UpdateTag, id: bigint) {
    const isExist = await this.getById(id);
    if (!isExist)
      throw new this.CustomError.NotFoundError(
        'Tag with given id is not found.',
      );

    await this.psql
      .update(this.tagModel)
      .set({ ...tag, updatedAt: new Date() })
      .where(eq(this.tagModel.id, id));
  }

  public async create(newTag: CreateTag) {
    const createdTag = await this.psql
      .insert(this.tagModel)
      .values({ ...newTag, id: newTag.id ?? this.generateUniqueID() })
      .returning({ id: this.tagModel.id });

    return createdTag[0]!.id;
  }

  public async deleteByIds(ids: bigint[]) {
    const deletedIds = await this.psql
      .delete(this.tagModel)
      .where(inArray(this.tagModel.id, ids))
      .returning({ id: this.tagModel.id });

    const mappedIds = deletedIds.map((val) => val.id);

    if (mappedIds.length === 0)
      throw new this.CustomError.NotFoundError(
        'Tags with given ids are not found.',
      );

    return mappedIds;
  }
}
