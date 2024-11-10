import { Inject, Service } from 'typedi';
import type { Logger } from 'winston';
import {
  and,
  count,
  eq,
  getTableColumns,
  inArray,
  notInArray,
} from 'drizzle-orm';
import type { CreateNote, UpdateNote } from '../interfaces/Note.js';

@Service()
export default class NoteService {
  constructor(
    @Inject('notes') private noteModel: Models.NoteModel,
    @Inject('noteCategories')
    private noteCategoryModel: Models.NoteCategoryModel,
    @Inject('userFavoritedNotes')
    private userFavoritedNoteModel: Models.UserFavoritedNoteModel,
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
    const { categoryId, ...noteCols } = getTableColumns(this.noteModel);

    const countDriver = this.psql
      .select({ count: count() })
      .from(this.noteModel);
    const selectDriver = this.psql
      .select({ ...noteCols, category: this.noteCategoryModel })
      .from(this.noteModel)
      .leftJoin(
        this.noteCategoryModel,
        eq(this.noteModel.categoryId, this.noteCategoryModel.id),
      );

    const pageSize = options.limit ?? 100;
    const isUnlimitedSize = options.limit === 'null';
    const rowOffset = this.getRowOffset({ ...options, limit: pageSize });

    if (options.filter) {
      const filterArgs = this.sqlBuilders.buildFilters(
        this.noteModel,
        options.filter,
      );
      selectDriver.where(filterArgs);
      countDriver.where(filterArgs);
    }
    selectDriver.offset(rowOffset);
    if (!isUnlimitedSize) selectDriver.limit(pageSize as number);
    if (options.order) {
      const orderArgs = this.sqlBuilders.buildSorts(
        this.noteModel,
        options.order,
      );

      selectDriver.orderBy(...orderArgs);
    }

    const notes = await selectDriver;
    const [total] = await countDriver;

    const pageTotal = isUnlimitedSize
      ? 1
      : Math.ceil((total?.count ?? 0) / (pageSize as number));
    const currentPage = isUnlimitedSize
      ? 1
      : options.page ?? Math.floor(rowOffset / (pageSize as number)) + 1;

    return {
      data: notes,
      meta: {
        pageTotal,
        currentPage: currentPage > pageTotal ? pageTotal : currentPage,
        itemTotal: total?.count ?? 0,
      },
    };
  }

  public async queryNotFavorited(userId: bigint, options: DB.QueryOptions) {
    const { categoryId, ...noteCols } = getTableColumns(this.noteModel);

    const favoritedNotes = await this.psql
      .select({
        noteId: this.userFavoritedNoteModel.noteId,
      })
      .from(this.userFavoritedNoteModel)
      .where(eq(this.userFavoritedNoteModel.userId, userId));
    const favoritedNoteIds = favoritedNotes.map(
      (favorited) => favorited.noteId,
    );

    const countDriver = this.psql
      .select({ count: count() })
      .from(this.noteModel);
    const selectDriver = this.psql
      .select({ ...noteCols, category: this.noteCategoryModel })
      .from(this.noteModel)
      .leftJoin(
        this.noteCategoryModel,
        eq(this.noteModel.categoryId, this.noteCategoryModel.id),
      );

    let filterQuery: any = notInArray(this.noteModel.id, favoritedNoteIds);

    const pageSize = options.limit ?? 100;
    const isUnlimitedSize = options.limit === 'null';
    const rowOffset = this.getRowOffset({ ...options, limit: pageSize });

    if (options.filter) {
      const filterArgs = this.sqlBuilders.buildFilters(
        this.noteModel,
        options.filter,
      );

      filterQuery = and(filterQuery, filterArgs);
    }
    selectDriver.offset(rowOffset);
    if (!isUnlimitedSize) selectDriver.limit(pageSize as number);
    if (options.order) {
      const orderArgs = this.sqlBuilders.buildSorts(
        this.noteModel,
        options.order,
      );

      selectDriver.orderBy(...orderArgs);
    }

    const notes = await selectDriver.where(filterQuery);
    const [total] = await countDriver.where(filterQuery);

    const pageTotal = isUnlimitedSize
      ? 1
      : Math.ceil((total?.count ?? 0) / (pageSize as number));
    const currentPage = isUnlimitedSize
      ? 1
      : options.page ?? Math.floor(rowOffset / (pageSize as number)) + 1;

    return {
      data: notes,
      meta: {
        pageTotal,
        currentPage: currentPage > pageTotal ? pageTotal : currentPage,
        itemTotal: total?.count ?? 0,
      },
    };
  }

  public async getById(id: bigint) {
    const { categoryId, ...noteCols } = getTableColumns(this.noteModel);

    const [note] = await this.psql
      .select({ ...noteCols, category: this.noteCategoryModel })
      .from(this.noteModel)
      .leftJoin(
        this.noteCategoryModel,
        eq(this.noteModel.categoryId, this.noteCategoryModel.id),
      )
      .where(eq(this.noteModel.id, id));

    if (!note)
      throw new this.CustomError.NotFoundError(
        'Note with given id is not found.',
      );

    return note;
  }

  public async update(note: UpdateNote, id: bigint) {
    const isExist = await this.getById(id);
    if (!isExist)
      throw new this.CustomError.NotFoundError(
        'Note with given id is not found.',
      );

    await this.psql
      .update(this.noteModel)
      .set({ ...note, updatedAt: new Date() })
      .where(eq(this.noteModel.id, id));

    await this.deleteUnusedAssets([
      { oldFilePath: isExist.cover, newFilePath: note.cover },
      { oldFilePath: isExist.icon, newFilePath: note.icon },
    ]);

    await this.webhookHandlers.update({
      serviceName: 'note',
      methodName: 'update',
    });
  }

  public async create(newNote: CreateNote) {
    const createdNote = await this.psql
      .insert(this.noteModel)
      .values({ ...newNote, id: newNote.id ?? this.generateUniqueID() })
      .returning({ id: this.noteModel.id });

    await this.webhookHandlers.create({
      serviceName: 'note',
      methodName: 'create',
    });

    return createdNote[0]!.id;
  }

  public async deleteByIds(ids: bigint[]) {
    const deletedIds = await this.psql
      .delete(this.noteModel)
      .where(inArray(this.noteModel.id, ids))
      .returning({
        id: this.noteModel.id,
        cover: this.noteModel.cover,
        icon: this.noteModel.icon,
      });

    const mappedIds = deletedIds.map((val) => val.id);

    if (mappedIds.length === 0)
      throw new this.CustomError.NotFoundError(
        'Notes with given ids are not found.',
      );

    const deletedAssets: {
      oldFilePath?: string | null;
      newFilePath?: string | null;
    }[] = [];

    deletedIds.forEach((note) => {
      deletedAssets.push({
        oldFilePath: note.cover,
        newFilePath: '-deleted-',
      });

      deletedAssets.push({
        oldFilePath: note.icon,
        newFilePath: '-deleted-',
      });
    });

    await this.deleteUnusedAssets(deletedAssets);

    await this.webhookHandlers.delete({
      serviceName: 'note',
      methodName: 'deleteByIds',
    });

    return mappedIds;
  }
}
