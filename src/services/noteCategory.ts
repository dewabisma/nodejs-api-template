import { Inject, Service } from 'typedi';
import type { Logger } from 'winston';
import { count, eq, inArray, sql } from 'drizzle-orm';
import type {
  CreateNoteCategory,
  UpdateNoteCategory,
} from '../interfaces/NoteCategory.js';

@Service()
export default class NoteCategoryService {
  constructor(
    @Inject('noteCategories')
    private noteCategoryModel: Models.NoteCategoryModel,
    @Inject('psql')
    private psql: DB.Driver,
    @Inject('idGenerator') private generateUniqueID: () => bigint,
    @Inject('sqlBuilders')
    private sqlBuilders: DB.SqlBuilders,
    @Inject('webhookHandlers') private webhookHandlers: Webhook.Handlers,
    @Inject('logger') private logger: Logger,
    @Inject('errors') private CustomError: CustomError.Handlers,
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

  /**
   * To get sample data from postgres table sampling clause using bernoulli,
   * you can use this function to get the valid percentage value.
   *
   * If the desired value is below minimum threshold it will return 100.
   * Which mean it will return all available items since it's below the minimum threshold
   *
   * @param desiredRandomItems - the amount of sample needed
   * @param availableItems - the amount of data available
   * @returns - percentage to be used for sampling
   */
  private calculateSamplePercentage(
    desiredRandomItems: number,
    availableItems: number,
  ) {
    if (availableItems <= desiredRandomItems) return 100;

    const percentage = (desiredRandomItems / availableItems) * 100;

    return percentage;
  }

  public async query(options: DB.QueryOptions) {
    const countDriver = this.psql
      .select({ count: count() })
      .from(this.noteCategoryModel);
    const selectDriver = this.psql.select().from(this.noteCategoryModel);

    const pageSize = options.limit ?? 100;
    const isUnlimitedSize = options.limit === 'null';
    const rowOffset = this.getRowOffset({ ...options, limit: pageSize });

    if (options.filter) {
      const filterArgs = this.sqlBuilders.buildFilters(
        this.noteCategoryModel,
        options.filter,
      );
      selectDriver.where(filterArgs);
      countDriver.where(filterArgs);
    }
    selectDriver.offset(rowOffset);
    if (!isUnlimitedSize) selectDriver.limit(pageSize as number);
    if (options.order) {
      const orderArgs = this.sqlBuilders.buildSorts(
        this.noteCategoryModel,
        options.order,
      );

      selectDriver.orderBy(...orderArgs);
    }

    const noteCategories = await selectDriver;
    const [total] = await countDriver;

    const pageTotal = isUnlimitedSize
      ? 1
      : Math.ceil((total?.count ?? 0) / (pageSize as number));
    const currentPage = isUnlimitedSize
      ? 1
      : options.page ?? Math.floor(rowOffset / (pageSize as number)) + 1;

    return {
      data: noteCategories,
      meta: {
        pageTotal,
        currentPage: currentPage > pageTotal ? pageTotal : currentPage,
        itemTotal: total?.count ?? 0,
      },
    };
  }

  public async randomizedQuery(desiredAmountOfItems: number = 10) {
    const { rows } = await this.psql.execute(
      sql`SELECT * FROM ${this.noteCategoryModel} ORDER BY RANDOM() LIMIT ${desiredAmountOfItems}`,
    );

    return {
      data: rows,
    };
  }

  public async getById(id: bigint) {
    const [noteCategory] = await this.psql
      .select()
      .from(this.noteCategoryModel)
      .where(eq(this.noteCategoryModel.id, id));

    if (!noteCategory)
      throw new this.CustomError.NotFoundError(
        'NoteCategory with given id is not found.',
      );

    return noteCategory;
  }

  public async update(noteCategory: UpdateNoteCategory, id: bigint) {
    const isExist = await this.getById(id);
    if (!isExist)
      throw new this.CustomError.NotFoundError(
        'NoteCategory with given id is not found.',
      );

    await this.psql
      .update(this.noteCategoryModel)
      .set({ ...noteCategory, updatedAt: new Date() })
      .where(eq(this.noteCategoryModel.id, id));

    await this.deleteUnusedAssets([
      { oldFilePath: isExist.cover, newFilePath: noteCategory.cover },
    ]);

    await this.webhookHandlers.update({
      methodName: 'update',
      serviceName: 'note category',
    });
  }

  public async create(newNoteCategory: CreateNoteCategory) {
    const createdNoteCategory = await this.psql
      .insert(this.noteCategoryModel)
      .values({
        ...newNoteCategory,
        id: newNoteCategory.id ?? this.generateUniqueID(),
      })
      .returning({ id: this.noteCategoryModel.id });

    await this.webhookHandlers.create({
      methodName: 'create',
      serviceName: 'note category',
    });

    return createdNoteCategory[0]!.id;
  }

  public async deleteByIds(ids: bigint[]) {
    const deletedIds = await this.psql
      .delete(this.noteCategoryModel)
      .where(inArray(this.noteCategoryModel.id, ids))
      .returning({
        id: this.noteCategoryModel.id,
        cover: this.noteCategoryModel.cover,
      });

    const mappedIds = deletedIds.map((val) => val.id);

    if (mappedIds.length === 0)
      throw new this.CustomError.NotFoundError(
        'NoteCategories with given ids are not found.',
      );

    const deletedAssets: {
      oldFilePath?: string | null;
      newFilePath?: string | null;
    }[] = [];

    deletedIds.forEach((noteCategory) => {
      deletedAssets.push({
        oldFilePath: noteCategory.cover,
        newFilePath: '-deleted-',
      });
    });

    await this.deleteUnusedAssets(deletedAssets);

    await this.webhookHandlers.delete({
      methodName: 'deleteByIds',
      serviceName: 'note category',
    });

    return mappedIds;
  }
}
