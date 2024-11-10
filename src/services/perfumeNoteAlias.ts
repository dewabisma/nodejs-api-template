import { Inject, Service } from 'typedi';
import type { Logger } from 'winston';
import { count, eq, inArray } from 'drizzle-orm';
import type {
  CreatePerfumeNoteAlias,
  UpdatePerfumeNoteAlias,
} from '../interfaces/PerfumeNoteAlias.js';

@Service()
export default class PerfumeNoteAliasService {
  constructor(
    @Inject('perfumeNoteAliases')
    private perfumeNoteAliasModel: Models.PerfumeNoteAliasModel,
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
      .from(this.perfumeNoteAliasModel);
    const selectDriver = this.psql.select().from(this.perfumeNoteAliasModel);

    const pageSize = options.limit ?? 100;
    const isUnlimitedSize = options.limit === 'null';
    const rowOffset = this.getRowOffset({ ...options, limit: pageSize });

    if (options.filter) {
      const filterArgs = this.sqlBuilders.buildFilters(
        this.perfumeNoteAliasModel,
        options.filter,
      );
      selectDriver.where(filterArgs);
      countDriver.where(filterArgs);
    }
    selectDriver.offset(rowOffset);
    if (!isUnlimitedSize) selectDriver.limit(pageSize as number);
    if (options.order) {
      const orderArgs = this.sqlBuilders.buildSorts(
        this.perfumeNoteAliasModel,
        options.order,
      );

      selectDriver.orderBy(...orderArgs);
    }

    const perfumeNoteAliass = await selectDriver;
    const [total] = await countDriver;

    const pageTotal = isUnlimitedSize
      ? 1
      : Math.ceil((total?.count ?? 0) / (pageSize as number));
    const currentPage = isUnlimitedSize
      ? 1
      : options.page ?? Math.floor(rowOffset / (pageSize as number)) + 1;

    return {
      data: perfumeNoteAliass,
      meta: {
        pageTotal,
        currentPage: currentPage > pageTotal ? pageTotal : currentPage,
        itemTotal: total?.count ?? 0,
      },
    };
  }

  public async getById(id: bigint) {
    const [perfumeNoteAlias] = await this.psql
      .select()
      .from(this.perfumeNoteAliasModel)
      .where(eq(this.perfumeNoteAliasModel.id, id));

    if (!perfumeNoteAlias)
      throw new this.CustomError.NotFoundError(
        'PerfumeNoteAlias with given id is not found.',
      );

    return perfumeNoteAlias;
  }

  public async update(perfumeNoteAlias: UpdatePerfumeNoteAlias, id: bigint) {
    const isExist = await this.getById(id);
    if (!isExist)
      throw new this.CustomError.NotFoundError(
        'PerfumeNoteAlias with given id is not found.',
      );

    await this.psql
      .update(this.perfumeNoteAliasModel)
      .set({ ...perfumeNoteAlias, updatedAt: new Date() })
      .where(eq(this.perfumeNoteAliasModel.id, id));
  }

  public async create(newPerfumeNoteAlias: CreatePerfumeNoteAlias) {
    const createdPerfumeNoteAlias = await this.psql
      .insert(this.perfumeNoteAliasModel)
      .values({ ...newPerfumeNoteAlias, id: this.generateUniqueID() })
      .returning({ id: this.perfumeNoteAliasModel.id });

    return createdPerfumeNoteAlias[0]!.id;
  }

  public async deleteByIds(ids: bigint[]) {
    const deletedIds = await this.psql
      .delete(this.perfumeNoteAliasModel)
      .where(inArray(this.perfumeNoteAliasModel.id, ids))
      .returning({ id: this.perfumeNoteAliasModel.id });

    const mappedIds = deletedIds.map((val) => val.id);

    if (mappedIds.length === 0)
      throw new this.CustomError.NotFoundError(
        'PerfumeNoteAliass with given ids are not found.',
      );

    return mappedIds;
  }
}
