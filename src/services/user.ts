import { Inject, Service } from 'typedi';
import type { Logger } from 'winston';
import { count, eq, inArray, getTableColumns } from 'drizzle-orm';
import type { UpdateUser } from '../interfaces/User.js';

@Service()
export default class UserService {
  constructor(
    @Inject('users') private userModel: Models.UserModel,
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
    const { password, ...userCols } = getTableColumns(this.userModel);

    const countDriver = this.psql
      .select({ count: count() })
      .from(this.userModel);
    const selectDriver = this.psql.select(userCols).from(this.userModel);

    const pageSize = options.limit ?? 100;
    const isUnlimitedSize = options.limit === 'null';
    const rowOffset = this.getRowOffset({ ...options, limit: pageSize });

    if (options.filter) {
      const filterArgs = this.sqlBuilders.buildFilters(
        this.userModel,
        options.filter,
      );
      selectDriver.where(filterArgs);
      countDriver.where(filterArgs);
    }
    selectDriver.offset(rowOffset);
    if (!isUnlimitedSize) selectDriver.limit(pageSize as number);
    if (options.order) {
      const orderArgs = this.sqlBuilders.buildSorts(
        this.userModel,
        options.order,
      );

      selectDriver.orderBy(...orderArgs);
    }

    const users = await selectDriver;
    const [total] = await countDriver;

    const pageTotal = isUnlimitedSize
      ? 1
      : Math.ceil((total?.count ?? 0) / (pageSize as number));
    const currentPage = isUnlimitedSize
      ? 1
      : options.page ?? Math.floor(rowOffset / (pageSize as number)) + 1;

    return {
      data: users,
      meta: {
        pageTotal,
        currentPage: currentPage > pageTotal ? pageTotal : currentPage,
        itemTotal: total?.count ?? 0,
      },
    };
  }

  public async getById(id: bigint) {
    const { password, ...userCols } = getTableColumns(this.userModel);

    const [user] = await this.psql
      .select(userCols)
      .from(this.userModel)
      .where(eq(this.userModel.id, id));

    if (!user)
      throw new this.CustomError.NotFoundError(
        'User with given id is not found.',
      );

    return user;
  }

  public async update(user: UpdateUser, id: bigint) {
    const isExist = await this.getById(id);
    if (!isExist)
      throw new this.CustomError.NotFoundError(
        'User with given id is not found.',
      );

    await this.psql
      .update(this.userModel)
      .set({ ...user, updatedAt: new Date() })
      .where(eq(this.userModel.id, id));
  }

  public async deleteByIds(ids: bigint[]) {
    const deletedIds = await this.psql
      .delete(this.userModel)
      .where(inArray(this.userModel.id, ids))
      .returning({ id: this.userModel.id });

    const mappedIds = deletedIds.map((val) => val.id);

    if (mappedIds.length === 0)
      throw new this.CustomError.NotFoundError(
        'Users with given ids are not found.',
      );

    return mappedIds;
  }
}
