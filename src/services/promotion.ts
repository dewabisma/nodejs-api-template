import { Inject, Service } from 'typedi';
import type { Logger } from 'winston';
import { count, eq, inArray } from 'drizzle-orm';
import type {
  CreatePromotion,
  UpdatePromotion,
} from '../interfaces/Promotion.js';

@Service()
export default class PromotionService {
  constructor(
    @Inject('promotions') private promotionModel: Models.PromotionModel,
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

  public async query(options: DB.QueryOptions) {
    const countDriver = this.psql
      .select({ count: count() })
      .from(this.promotionModel);
    const selectDriver = this.psql.select().from(this.promotionModel);

    const pageSize = options.limit ?? 100;
    const isUnlimitedSize = options.limit === 'null';
    const rowOffset = this.getRowOffset({ ...options, limit: pageSize });

    if (options.filter) {
      const filterArgs = this.sqlBuilders.buildFilters(
        this.promotionModel,
        options.filter,
      );
      selectDriver.where(filterArgs);
      countDriver.where(filterArgs);
    }
    selectDriver.offset(rowOffset);
    if (!isUnlimitedSize) selectDriver.limit(pageSize as number);
    if (options.order) {
      const orderArgs = this.sqlBuilders.buildSorts(
        this.promotionModel,
        options.order,
      );

      selectDriver.orderBy(...orderArgs);
    }

    const promotions = await selectDriver;
    const [total] = await countDriver;

    const pageTotal = isUnlimitedSize
      ? 1
      : Math.ceil((total?.count ?? 0) / (pageSize as number));
    const currentPage = isUnlimitedSize
      ? 1
      : options.page ?? Math.floor(rowOffset / (pageSize as number)) + 1;

    return {
      data: promotions,
      meta: {
        pageTotal,
        currentPage: currentPage > pageTotal ? pageTotal : currentPage,
        itemTotal: total?.count ?? 0,
      },
    };
  }

  public async getById(id: bigint) {
    const [promotion] = await this.psql
      .select()
      .from(this.promotionModel)
      .where(eq(this.promotionModel.id, id));

    if (!promotion)
      throw new this.CustomError.NotFoundError(
        'Promotion with given id is not found.',
      );

    return promotion;
  }

  public async update(promotion: UpdatePromotion, id: bigint) {
    const isExist = await this.getById(id);
    if (!isExist)
      throw new this.CustomError.NotFoundError(
        'Promotion with given id is not found.',
      );

    await this.psql
      .update(this.promotionModel)
      .set({ ...promotion, updatedAt: new Date() })
      .where(eq(this.promotionModel.id, id));

    await this.deleteUnusedAssets([
      { oldFilePath: isExist.cover, newFilePath: promotion.cover },
    ]);

    await this.webhookHandlers.update({
      methodName: 'update',
      serviceName: 'promotion',
    });
  }

  public async create(newPromotion: CreatePromotion) {
    const createdPromotion = await this.psql
      .insert(this.promotionModel)
      .values({ ...newPromotion, id: this.generateUniqueID() })
      .returning({ id: this.promotionModel.id });

    await this.webhookHandlers.create({
      methodName: 'create',
      serviceName: 'promotion',
    });

    return createdPromotion[0]!.id;
  }

  public async deleteByIds(ids: bigint[]) {
    const deletedIds = await this.psql
      .delete(this.promotionModel)
      .where(inArray(this.promotionModel.id, ids))
      .returning({
        id: this.promotionModel.id,
        cover: this.promotionModel.cover,
      });

    const mappedIds = deletedIds.map((val) => val.id);

    if (mappedIds.length === 0)
      throw new this.CustomError.NotFoundError(
        'Promotions with given ids are not found.',
      );

    const deletedAssets: {
      oldFilePath?: string | null;
      newFilePath?: string | null;
    }[] = [];

    deletedIds.forEach((promotion) => {
      deletedAssets.push({
        oldFilePath: promotion.cover,
        newFilePath: '-deleted-',
      });
    });

    await this.deleteUnusedAssets(deletedAssets);

    await this.webhookHandlers.delete({
      methodName: 'deleteByIds',
      serviceName: 'promotion',
    });

    return mappedIds;
  }
}
