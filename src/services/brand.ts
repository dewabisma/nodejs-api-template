import { Inject, Service } from 'typedi';
import type { Logger } from 'winston';
import { count, eq, inArray, is } from 'drizzle-orm';
import type { CreateBrand, UpdateBrand } from '../interfaces/Brand.js';

@Service()
export default class BrandService {
  constructor(
    @Inject('brands') private brandModel: Models.BrandModel,
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
      .from(this.brandModel);
    const selectDriver = this.psql.select().from(this.brandModel);

    const pageSize = options.limit ?? 100;
    const isUnlimitedSize = options.limit === 'null';
    const rowOffset = this.getRowOffset({ ...options, limit: pageSize });

    if (options.filter) {
      const filterArgs = this.sqlBuilders.buildFilters(
        this.brandModel,
        options.filter,
      );
      selectDriver.where(filterArgs);
      countDriver.where(filterArgs);
    }
    selectDriver.offset(rowOffset);
    if (!isUnlimitedSize) selectDriver.limit(pageSize as number);
    if (options.order) {
      const orderArgs = this.sqlBuilders.buildSorts(
        this.brandModel,
        options.order,
      );

      selectDriver.orderBy(...orderArgs);
    }

    const brands = await selectDriver;
    const [total] = await countDriver;

    const pageTotal = isUnlimitedSize
      ? 1
      : Math.ceil((total?.count ?? 0) / (pageSize as number));
    const currentPage = isUnlimitedSize
      ? 1
      : options.page ?? Math.floor(rowOffset / (pageSize as number)) + 1;

    return {
      data: brands,
      meta: {
        pageTotal,
        currentPage: currentPage > pageTotal ? pageTotal : currentPage,
        itemTotal: total?.count ?? 0,
      },
    };
  }

  public async getById(id: bigint) {
    const [brand] = await this.psql
      .select()
      .from(this.brandModel)
      .where(eq(this.brandModel.id, id));

    if (!brand)
      throw new this.CustomError.NotFoundError(
        'Brand with given id is not found.',
      );

    return brand;
  }

  public async update(brand: UpdateBrand, id: bigint) {
    const isExist = await this.getById(id);
    if (!isExist)
      throw new this.CustomError.NotFoundError(
        'Brand with given id is not found.',
      );

    await this.psql
      .update(this.brandModel)
      .set({ ...brand, updatedAt: new Date() })
      .where(eq(this.brandModel.id, id));

    await this.deleteUnusedAssets([
      { oldFilePath: isExist.banner, newFilePath: brand.banner },
      { oldFilePath: isExist.logo, newFilePath: brand.logo },
    ]);

    await this.webhookHandlers.update({
      serviceName: 'brand',
      methodName: 'update',
    });
  }

  public async create(newBrand: CreateBrand) {
    const createdBrand = await this.psql
      .insert(this.brandModel)
      .values({ ...newBrand, id: newBrand.id ?? this.generateUniqueID() })
      .returning({ id: this.brandModel.id });

    await this.webhookHandlers.create({
      serviceName: 'brand',
      methodName: 'create',
    });

    return createdBrand[0]!.id;
  }

  public async deleteByIds(ids: bigint[]) {
    const deletedIds = await this.psql
      .delete(this.brandModel)
      .where(inArray(this.brandModel.id, ids))
      .returning({
        id: this.brandModel.id,
        banner: this.brandModel.banner,
        logo: this.brandModel.logo,
      });

    const mappedIds = deletedIds.map((val) => val.id);

    if (mappedIds.length === 0)
      throw new this.CustomError.NotFoundError(
        'Brands with given ids are not found.',
      );

    const deletedAssets: {
      oldFilePath?: string | null;
      newFilePath?: string | null;
    }[] = [];

    deletedIds.forEach((brand) => {
      deletedAssets.push({
        oldFilePath: brand.banner,
        newFilePath: '-deleted-',
      });

      deletedAssets.push({
        oldFilePath: brand.logo,
        newFilePath: '-deleted-',
      });
    });

    await this.deleteUnusedAssets(deletedAssets);

    await this.webhookHandlers.delete({
      serviceName: 'brand',
      methodName: 'deleteByIds',
    });

    return mappedIds;
  }
}
