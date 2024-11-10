import { Inject, Service } from 'typedi';
import type { Logger } from 'winston';
import { and, count, eq, getTableColumns, inArray, sql } from 'drizzle-orm';
import type {
  CreateUserLikedPerfume,
  UpdateUserLikedPerfume,
} from '../interfaces/UserLikedPerfume.js';

@Service()
export default class UserLikedPerfumeService {
  constructor(
    @Inject('userLikedPerfumes')
    private userLikedPerfumeModel: Models.UserLikedPerfumeModel,
    @Inject('perfumes')
    private perfumeModel: Models.PerfumeModel,
    @Inject('userRole') private userRole: Models.UserRole,
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
    const { perfumeId, userId, ...likedPerfumeCols } = getTableColumns(
      this.userLikedPerfumeModel,
    );

    const countDriver = this.psql
      .select({ count: count() })
      .from(this.userLikedPerfumeModel);
    const selectDriver = this.psql
      .select({ ...likedPerfumeCols, perfume: this.perfumeModel })
      .from(this.userLikedPerfumeModel)
      .leftJoin(
        this.perfumeModel,
        eq(this.userLikedPerfumeModel.perfumeId, this.perfumeModel.id),
      );

    const pageSize = options.limit ?? 100;
    const isUnlimitedSize = options.limit === 'null';
    const rowOffset = this.getRowOffset({ ...options, limit: pageSize });

    if (options.filter) {
      const filterArgs = this.sqlBuilders.buildFilters(
        this.userLikedPerfumeModel,
        options.filter,
      );
      selectDriver.where(filterArgs);
      countDriver.where(filterArgs);
    }
    selectDriver.offset(rowOffset);
    if (!isUnlimitedSize) selectDriver.limit(pageSize as number);
    if (options.order) {
      const orderArgs = this.sqlBuilders.buildSorts(
        this.userLikedPerfumeModel,
        options.order,
      );

      selectDriver.orderBy(...orderArgs);
    }

    const userLikedPerfumes = await selectDriver;
    const [total] = await countDriver;

    const pageTotal = isUnlimitedSize
      ? 1
      : Math.ceil((total?.count ?? 0) / (pageSize as number));
    const currentPage = isUnlimitedSize
      ? 1
      : options.page ?? Math.floor(rowOffset / (pageSize as number)) + 1;

    return {
      data: userLikedPerfumes,
      meta: {
        pageTotal,
        currentPage: currentPage > pageTotal ? pageTotal : currentPage,
        itemTotal: total?.count ?? 0,
      },
    };
  }

  public async getById(id: bigint) {
    const { perfumeId, ...likedPerfumeCols } = getTableColumns(
      this.userLikedPerfumeModel,
    );

    const [userLikedPerfume] = await this.psql
      .select({ ...likedPerfumeCols, perfume: this.perfumeModel })
      .from(this.userLikedPerfumeModel)
      .leftJoin(
        this.perfumeModel,
        eq(this.userLikedPerfumeModel.perfumeId, this.perfumeModel.id),
      )
      .where(eq(this.userLikedPerfumeModel.id, id));

    if (!userLikedPerfume)
      throw new this.CustomError.NotFoundError(
        'UserLikedPerfume with given id is not found.',
      );

    return userLikedPerfume;
  }

  public async create(newUserLikedPerfume: CreateUserLikedPerfume) {
    const [createdUserLikedPerfume] = await Promise.all([
      this.psql
        .insert(this.userLikedPerfumeModel)
        .values({ ...newUserLikedPerfume, id: this.generateUniqueID() })
        .returning({ id: this.userLikedPerfumeModel.id }),
      this.psql
        .update(this.perfumeModel)
        .set({ likeCount: sql`${this.perfumeModel.likeCount} + 1` })
        .where(eq(this.perfumeModel.id, newUserLikedPerfume.perfumeId)),
    ]);

    return createdUserLikedPerfume[0]!.id;
  }

  public async deleteByIds(ids: bigint[], user: Models.AuthenticatedUser) {
    const { perfumeId } = getTableColumns(this.userLikedPerfumeModel);
    // Delete without making sure if the record is owned by the authenticated user itself if authorized as admin.
    if (user.role === this.userRole.Admin) {
      const deletedLikedPerfumes = await this.psql
        .delete(this.userLikedPerfumeModel)
        .where(inArray(this.userLikedPerfumeModel.id, ids))
        .returning({ id: this.userLikedPerfumeModel.id, perfumeId });

      const mappedIds = deletedLikedPerfumes.map((val) => val.id);

      if (mappedIds.length === 0)
        throw new this.CustomError.NotFoundError(
          'PerfumeReviews with given ids are not found.',
        );

      this.logger.info("Decrement deleted like's perfume like count.");
      const perfumeIds = deletedLikedPerfumes.map(
        (deletedLike) => deletedLike.perfumeId,
      );

      await this.psql
        .update(this.perfumeModel)
        .set({ likeCount: sql`${this.perfumeModel.likeCount} - 1` })
        .where(inArray(this.perfumeModel.id, perfumeIds));

      return mappedIds;
    }

    // Delete by making sure if the record is owned by the authenticated user itself if not authorized as admin.
    const deletedLikedPerfumes = await this.psql
      .delete(this.userLikedPerfumeModel)
      .where(
        and(
          inArray(this.userLikedPerfumeModel.id, ids),
          eq(this.userLikedPerfumeModel.userId, user.id),
        ),
      )
      .returning({ id: this.userLikedPerfumeModel.id, perfumeId });

    const mappedIds = deletedLikedPerfumes.map((val) => val.id);

    if (mappedIds.length === 0)
      throw new this.CustomError.NotFoundError(
        'PerfumeReviews with given ids are not found.',
      );

    this.logger.info("Decrement deleted like's perfume like count.");
    const perfumeIds = deletedLikedPerfumes.map(
      (deletedLike) => deletedLike.perfumeId,
    );

    await this.psql
      .update(this.perfumeModel)
      .set({ likeCount: sql`${this.perfumeModel.likeCount} - 1` })
      .where(inArray(this.perfumeModel.id, perfumeIds));

    return mappedIds;
  }
}
