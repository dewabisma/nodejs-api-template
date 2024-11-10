import { Inject, Service } from 'typedi';
import type { Logger } from 'winston';
import { and, count, eq, getTableColumns, inArray } from 'drizzle-orm';
import type {
  CreatePerfumeReview,
  UpdatePerfumeReview,
} from '../interfaces/PerfumeReview.js';

@Service()
export default class PerfumeReviewService {
  constructor(
    @Inject('perfumeReviews')
    private perfumeReviewModel: Models.PerfumeReviewModel,
    @Inject('users')
    private userModel: Models.UserModel,
    @Inject('brands')
    private brandModel: Models.BrandModel,
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
    const { perfumeId, userId, ...reviewCols } = getTableColumns(
      this.perfumeReviewModel,
    );
    const {
      password,
      email,
      dateOfBirth,
      lastLoginAt,
      oauthProvider,
      oauthUid,
      createdAt,
      updatedAt,
      status,
      ...userCols
    } = getTableColumns(this.userModel);

    const countDriver = this.psql
      .select({ count: count() })
      .from(this.perfumeReviewModel);
    const selectDriver = this.psql
      .select({
        ...reviewCols,
        user: userCols,
        brand: {
          id: this.brandModel.id,
          name: this.brandModel.name,
        },
        perfume: { id: this.perfumeModel.id, name: this.perfumeModel.name },
      })
      .from(this.perfumeReviewModel)
      .leftJoin(
        this.userModel,
        eq(this.perfumeReviewModel.userId, this.userModel.id),
      )
      .leftJoin(
        this.perfumeModel,
        eq(this.perfumeReviewModel.perfumeId, this.perfumeModel.id),
      )
      .leftJoin(
        this.brandModel,
        eq(this.perfumeModel.brandId, this.brandModel.id),
      );

    const pageSize = options.limit ?? 100;
    const isUnlimitedSize = options.limit === 'null';
    const rowOffset = this.getRowOffset({ ...options, limit: pageSize });

    if (options.filter) {
      const filterArgs = this.sqlBuilders.buildFilters(
        this.perfumeReviewModel,
        options.filter,
      );
      selectDriver.where(filterArgs);
      countDriver.where(filterArgs);
    }
    selectDriver.offset(rowOffset);
    if (!isUnlimitedSize) selectDriver.limit(pageSize as number);
    if (options.order) {
      const orderArgs = this.sqlBuilders.buildSorts(
        this.perfumeReviewModel,
        options.order,
      );

      selectDriver.orderBy(...orderArgs);
    }

    const perfumeReviews = await selectDriver;
    const [total] = await countDriver;

    const pageTotal = isUnlimitedSize
      ? 1
      : Math.ceil((total?.count ?? 0) / (pageSize as number));
    const currentPage = isUnlimitedSize
      ? 1
      : options.page ?? Math.floor(rowOffset / (pageSize as number)) + 1;

    return {
      data: perfumeReviews,
      meta: {
        pageTotal,
        currentPage: currentPage > pageTotal ? pageTotal : currentPage,
        itemTotal: total?.count ?? 0,
      },
    };
  }

  public async getById(id: bigint) {
    const { perfumeId, userId, ...reviewCols } = getTableColumns(
      this.perfumeReviewModel,
    );
    const {
      password,
      email,
      dateOfBirth,
      lastLoginAt,
      oauthProvider,
      oauthUid,
      createdAt,
      updatedAt,
      status,
      ...userCols
    } = getTableColumns(this.userModel);

    const [perfumeReview] = await this.psql
      .select({
        ...reviewCols,
        user: userCols,
        brand: {
          id: this.brandModel.id,
          name: this.brandModel.name,
        },
        perfume: { id: this.perfumeModel.id, name: this.perfumeModel.name },
      })
      .from(this.perfumeReviewModel)
      .leftJoin(
        this.userModel,
        eq(this.perfumeReviewModel.userId, this.userModel.id),
      )
      .leftJoin(
        this.perfumeModel,
        eq(this.perfumeReviewModel.perfumeId, this.perfumeModel.id),
      )
      .leftJoin(
        this.brandModel,
        eq(this.perfumeModel.brandId, this.brandModel.id),
      )
      .where(eq(this.perfumeReviewModel.id, id));

    if (!perfumeReview)
      throw new this.CustomError.NotFoundError(
        'PerfumeReview with given id is not found.',
      );

    return perfumeReview;
  }

  public async update(
    perfumeReview: UpdatePerfumeReview,
    id: bigint,
    userId: bigint,
  ) {
    const isExist = await this.getById(id);
    if (!isExist)
      throw new this.CustomError.NotFoundError(
        'PerfumeReview with given id is not found.',
      );

    if (isExist.user?.id !== userId)
      throw new this.CustomError.UnauthorizedError(
        'You are not the writer of the review.',
      );

    await this.psql
      .update(this.perfumeReviewModel)
      .set({ ...perfumeReview, updatedAt: new Date() })
      .where(eq(this.perfumeReviewModel.id, id));
  }

  public async create(newPerfumeReview: CreatePerfumeReview) {
    const createdPerfumeReview = await this.psql
      .insert(this.perfumeReviewModel)
      .values({ ...newPerfumeReview, id: this.generateUniqueID() })
      .returning({ id: this.perfumeReviewModel.id });

    return createdPerfumeReview[0]!.id;
  }

  public async deleteByIds(ids: bigint[], user: Models.AuthenticatedUser) {
    // Delete without making sure if the review is written by the authenticated user itself if authorized as admin.
    if (user.role === this.userRole.Admin) {
      const deletedIds = await this.psql
        .delete(this.perfumeReviewModel)
        .where(inArray(this.perfumeReviewModel.id, ids))
        .returning({ id: this.perfumeReviewModel.id });

      const mappedIds = deletedIds.map((val) => val.id);

      if (mappedIds.length === 0)
        throw new this.CustomError.NotFoundError(
          'PerfumeReviews with given ids are not found.',
        );

      return mappedIds;
    }

    // Delete by making sure if the review is written by the authenticated user itself if not authorized as admin.
    const deletedIds = await this.psql
      .delete(this.perfumeReviewModel)
      .where(
        and(
          inArray(this.perfumeReviewModel.id, ids),
          eq(this.perfumeReviewModel.userId, user.id),
        ),
      )
      .returning({ id: this.perfumeReviewModel.id });

    const mappedIds = deletedIds.map((val) => val.id);

    if (mappedIds.length === 0)
      throw new this.CustomError.NotFoundError(
        'PerfumeReviews with given ids are not found.',
      );

    return mappedIds;
  }
}
