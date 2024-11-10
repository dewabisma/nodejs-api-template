import { Inject, Service } from 'typedi';
import type { Logger } from 'winston';
import { and, count, eq, getTableColumns, inArray } from 'drizzle-orm';
import type {
  CreateUserFavoritedNote,
  UpdateUserFavoritedNote,
} from '../interfaces/UserFavoritedNote.js';

@Service()
export default class UserFavoritedNoteService {
  constructor(
    @Inject('userFavoritedNotes')
    private userFavoritedNoteModel: Models.UserFavoritedNoteModel,
    @Inject('notes')
    private noteModel: Models.NoteModel,
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
    const { noteId, ...favoritedNoteCols } = getTableColumns(
      this.userFavoritedNoteModel,
    );

    const countDriver = this.psql
      .select({ count: count() })
      .from(this.userFavoritedNoteModel);
    const selectDriver = this.psql
      .select({
        ...favoritedNoteCols,
        note: this.noteModel,
      })
      .from(this.userFavoritedNoteModel)
      .leftJoin(
        this.noteModel,
        eq(this.userFavoritedNoteModel.noteId, this.noteModel.id),
      );

    const pageSize = options.limit ?? 100;
    const isUnlimitedSize = options.limit === 'null';
    const rowOffset = this.getRowOffset({ ...options, limit: pageSize });

    if (options.filter) {
      const filterArgs = this.sqlBuilders.buildFilters(
        this.userFavoritedNoteModel,
        options.filter,
      );
      selectDriver.where(filterArgs);
      countDriver.where(filterArgs);
    }
    selectDriver.offset(rowOffset);
    if (!isUnlimitedSize) selectDriver.limit(pageSize as number);
    if (options.order) {
      const orderArgs = this.sqlBuilders.buildSorts(
        this.userFavoritedNoteModel,
        options.order,
      );

      selectDriver.orderBy(...orderArgs);
    }

    const userFavoritedNotes = await selectDriver;
    const [total] = await countDriver;

    const pageTotal = isUnlimitedSize
      ? 1
      : Math.ceil((total?.count ?? 0) / (pageSize as number));
    const currentPage = isUnlimitedSize
      ? 1
      : options.page ?? Math.floor(rowOffset / (pageSize as number)) + 1;

    return {
      data: userFavoritedNotes,
      meta: {
        pageTotal,
        currentPage: currentPage > pageTotal ? pageTotal : currentPage,
        itemTotal: total?.count ?? 0,
      },
    };
  }

  public async getById(id: bigint) {
    const { noteId, ...favoritedNoteCols } = getTableColumns(
      this.userFavoritedNoteModel,
    );

    const [userFavoritedNote] = await this.psql
      .select({
        ...favoritedNoteCols,
        note: this.noteModel,
      })
      .from(this.userFavoritedNoteModel)
      .leftJoin(
        this.noteModel,
        eq(this.userFavoritedNoteModel.noteId, this.noteModel.id),
      )
      .where(eq(this.userFavoritedNoteModel.id, id));

    if (!userFavoritedNote)
      throw new this.CustomError.NotFoundError(
        'UserFavoritedNote with given id is not found.',
      );

    return userFavoritedNote;
  }

  public async create(newUserFavoritedNote: CreateUserFavoritedNote) {
    const createdUserFavoritedNote = await this.psql
      .insert(this.userFavoritedNoteModel)
      .values({ ...newUserFavoritedNote, id: this.generateUniqueID() })
      .returning({ id: this.userFavoritedNoteModel.id });

    return createdUserFavoritedNote[0]!.id;
  }

  public async deleteByIds(ids: bigint[], user: Models.AuthenticatedUser) {
    // Delete without making sure if the record is owned by the authenticated user itself if authorized as admin.
    if (user.role === this.userRole.Admin) {
      const deletedIds = await this.psql
        .delete(this.userFavoritedNoteModel)
        .where(inArray(this.userFavoritedNoteModel.id, ids))
        .returning({ id: this.userFavoritedNoteModel.id });

      const mappedIds = deletedIds.map((val) => val.id);

      if (mappedIds.length === 0)
        throw new this.CustomError.NotFoundError(
          'PerfumeReviews with given ids are not found.',
        );

      return mappedIds;
    }

    // Delete by making sure if the record is owned by the authenticated user itself if not authorized as admin.
    const deletedIds = await this.psql
      .delete(this.userFavoritedNoteModel)
      .where(
        and(
          inArray(this.userFavoritedNoteModel.id, ids),
          eq(this.userFavoritedNoteModel.userId, user.id),
        ),
      )
      .returning({ id: this.userFavoritedNoteModel.id });

    const mappedIds = deletedIds.map((val) => val.id);

    if (mappedIds.length === 0)
      throw new this.CustomError.NotFoundError(
        'PerfumeReviews with given ids are not found.',
      );

    return mappedIds;
  }
}
