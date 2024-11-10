import { Inject, Service } from 'typedi';
import type { Logger } from 'winston';
import {
  and,
  arrayContains,
  arrayOverlaps,
  count,
  eq,
  getTableColumns,
  ilike,
  inArray,
  not,
  or,
  sql,
} from 'drizzle-orm';
import type {
  CreatePerfume,
  Perfume,
  UpdatePerfume,
} from '../interfaces/Perfume.js';
import type { CreatePerfumeNoteAlias } from '../interfaces/PerfumeNoteAlias.js';

@Service()
export default class PerfumeService {
  constructor(
    @Inject('perfumes') private perfumeModel: Models.PerfumeModel,
    @Inject('perfumeReviews')
    private perfumeReviewModel: Models.PerfumeReviewModel,
    @Inject('perfumeNoteAliases')
    private perfumeNoteAliasesModel: Models.PerfumeNoteAliasModel,
    @Inject('notes') private noteModel: Models.NoteModel,
    @Inject('brands') private brandModel: Models.BrandModel,
    @Inject('fragrancePyramid')
    private fragrancePyramid: Models.FragrancePyramid,
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

  private async handlePerfumeNoteAliasMutation(
    noteAliases: { alias: string; noteId: bigint }[],
    perfumeId: bigint,
  ) {
    if (noteAliases && noteAliases.length > 0) {
      this.logger.info('Alias data provided, creating alias records.');

      const newNoteAliases: (CreatePerfumeNoteAlias & { id: bigint })[] =
        noteAliases.map((alias) => ({
          id: this.generateUniqueID(),
          noteAlias: alias.alias,
          noteId: alias.noteId,
          perfumeId,
        }));

      await this.psql
        .insert(this.perfumeNoteAliasesModel)
        .values(newNoteAliases);

      this.logger.info('Success creating alias records.');
    }
  }

  private flattenNoteData(
    notes: Pick<
      CreatePerfume,
      'baseNotes' | 'middleNotes' | 'topNotes' | 'uncategorizedNotes'
    >,
  ) {
    const noteAliases: { alias: string; noteId: bigint }[] = [];

    const baseNoteIds = notes.baseNotes?.map(({ noteId, alias }) => {
      if (alias) noteAliases.push({ alias, noteId });

      return noteId;
    });
    const middleNoteIds = notes.middleNotes?.map(({ noteId, alias }) => {
      if (alias) noteAliases.push({ alias, noteId });

      return noteId;
    });
    const topNoteIds = notes.topNotes?.map(({ noteId, alias }) => {
      if (alias) noteAliases.push({ alias, noteId });

      return noteId;
    });
    const uncategorizedNoteIds = notes.uncategorizedNotes?.map(
      ({ noteId, alias }) => {
        if (alias) noteAliases.push({ alias, noteId });

        return noteId;
      },
    );

    const addedNoteIds = [
      ...(baseNoteIds ?? []),
      ...(middleNoteIds ?? []),
      ...(topNoteIds ?? []),
      ...(uncategorizedNoteIds ?? []),
    ];

    return {
      addedNoteIds,
      noteAliases,
      baseNoteIds,
      middleNoteIds,
      topNoteIds,
      uncategorizedNoteIds,
    };
  }

  private async getPopulatedNotesAndAliases(
    perfume: Pick<
      Perfume,
      'id' | 'topNotes' | 'baseNotes' | 'middleNotes' | 'uncategorizedNotes'
    >,
  ) {
    this.logger.info('Getting perfume note alias.');
    const noteAliasQuery = await this.psql
      .select({
        noteId: this.perfumeNoteAliasesModel.noteId,
        alias: this.perfumeNoteAliasesModel.noteAlias,
      })
      .from(this.perfumeNoteAliasesModel)
      .where(eq(this.perfumeNoteAliasesModel.perfumeId, perfume.id));

    const noteAliases = noteAliasQuery.reduce<Record<string, string>>(
      (acc, row) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - We ignore this error because we can actually use bigint for index in js.
        if (!acc[row.noteId]) acc[row.noteId] = row.alias;

        return acc;
      },
      {},
    );

    const { createdAt, description, updatedAt, popularityCount, ...noteCols } =
      getTableColumns(this.noteModel);

    const {
      baseNotes: __base,
      topNotes: __top,
      middleNotes: __middle,
      uncategorizedNotes: __uncategorized,
    } = perfume;

    this.logger.info('Getting perfume notes.');
    if (perfume.uncategorizedNotes) {
      const uncategorizedNotes = await this.psql
        .select(noteCols)
        .from(this.noteModel)
        .where(inArray(this.noteModel.id, perfume.uncategorizedNotes));

      return {
        uncategorizedNotes,
        baseNotes: null,
        middleNotes: null,
        topNotes: null,
        noteAliases,
      };
    } else {
      const [baseNotes, middleNotes, topNotes] = await Promise.all([
        this.psql
          .select(noteCols)
          .from(this.noteModel)
          .where(inArray(this.noteModel.id, perfume.baseNotes ?? [])),
        this.psql
          .select(noteCols)
          .from(this.noteModel)
          .where(inArray(this.noteModel.id, perfume.middleNotes ?? [])),
        this.psql
          .select(noteCols)
          .from(this.noteModel)
          .where(inArray(this.noteModel.id, perfume.topNotes ?? [])),
      ]);

      return {
        uncategorizedNotes: null,
        baseNotes,
        middleNotes,
        topNotes,
        noteAliases,
      };
    }
  }

  private getCategorizedNotesFilter(noteIds: bigint[]) {
    const length = noteIds.length;

    if (length === 1)
      return arrayContains(this.perfumeModel.baseNotes, noteIds);

    if (length === 2)
      return or(
        arrayContains(this.perfumeModel.baseNotes, noteIds),
        and(
          arrayOverlaps(this.perfumeModel.baseNotes, noteIds),
          arrayOverlaps(this.perfumeModel.middleNotes, noteIds),
        ),
      );

    return or(
      arrayContains(this.perfumeModel.baseNotes, noteIds),
      and(
        arrayOverlaps(this.perfumeModel.baseNotes, noteIds),
        arrayOverlaps(this.perfumeModel.middleNotes, noteIds),
      ),
      and(
        arrayOverlaps(this.perfumeModel.baseNotes, noteIds),
        arrayOverlaps(this.perfumeModel.middleNotes, noteIds),
        arrayOverlaps(this.perfumeModel.topNotes, noteIds),
      ),
    );
  }

  private getCategorizedSimilarPerfumeFilter(perfume: Perfume) {
    if (!perfume.baseNotes || !perfume.middleNotes || !perfume.topNotes) return;

    return or(
      arrayOverlaps(this.perfumeModel.middleNotes, perfume.middleNotes),
      and(
        arrayOverlaps(this.perfumeModel.baseNotes, perfume.baseNotes),
        arrayOverlaps(this.perfumeModel.middleNotes, perfume.middleNotes),
      ),
    );
  }

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
    const { brandId, ...perfumeCols } = getTableColumns(this.perfumeModel);

    const countDriver = this.psql
      .select({ count: count() })
      .from(this.perfumeModel);
    const selectDriver = this.psql
      .select({ ...perfumeCols, brand: this.brandModel })
      .from(this.perfumeModel)
      .leftJoin(
        this.brandModel,
        eq(this.perfumeModel.brandId, this.brandModel.id),
      );

    const pageSize = options.limit ?? 100;
    const isUnlimitedSize = options.limit === 'null';
    const rowOffset = this.getRowOffset({ ...options, limit: pageSize });

    if (options.filter) {
      const filterArgs = this.sqlBuilders.buildFilters(
        this.perfumeModel,
        options.filter,
      );
      selectDriver.where(filterArgs);
      countDriver.where(filterArgs);
    }
    selectDriver.offset(rowOffset);
    if (!isUnlimitedSize) selectDriver.limit(pageSize as number);
    if (options.order) {
      const orderArgs = this.sqlBuilders.buildSorts(
        this.perfumeModel,
        options.order,
      );

      selectDriver.orderBy(...orderArgs);
    }

    const perfumes = await selectDriver;
    const [total] = await countDriver;

    const pageTotal = isUnlimitedSize
      ? 1
      : Math.ceil((total?.count ?? 0) / (pageSize as number));
    const currentPage = isUnlimitedSize
      ? 1
      : options.page ?? Math.floor(rowOffset / (pageSize as number)) + 1;

    return {
      data: perfumes,
      meta: {
        pageTotal,
        currentPage: currentPage > pageTotal ? pageTotal : currentPage,
        itemTotal: total?.count ?? 0,
      },
    };
  }

  public async getById(id: bigint) {
    const { brandId, ...perfumeCols } = getTableColumns(this.perfumeModel);

    const [perfume] = await this.psql
      .select({ ...perfumeCols, brand: this.brandModel })
      .from(this.perfumeModel)
      .leftJoin(
        this.brandModel,
        eq(this.perfumeModel.brandId, this.brandModel.id),
      )
      .where(eq(this.perfumeModel.id, id));

    if (!perfume)
      throw new this.CustomError.NotFoundError(
        'Perfume with given id is not found.',
      );

    this.logger.info('Populating perfume notes and noteAlias');
    const {
      baseNotes,
      middleNotes,
      noteAliases,
      topNotes,
      uncategorizedNotes,
    } = await this.getPopulatedNotesAndAliases(perfume);

    const {
      baseNotes: __base,
      topNotes: __top,
      middleNotes: __middle,
      uncategorizedNotes: __uncategorized,
      ...perfumeRest
    } = perfume;

    if (uncategorizedNotes)
      return { ...perfumeRest, uncategorizedNotes, noteAliases };

    return { ...perfumeRest, baseNotes, middleNotes, topNotes, noteAliases };
  }

  public async querySimilaryPerfumes(
    perfumeName: string,
    options: DB.QueryOptions,
  ) {
    this.logger.info('Finding existing perfume by given name');
    const [perfume] = await this.psql
      .select({
        id: this.perfumeModel.id,
        name: this.perfumeModel.name,
        baseNotes: this.perfumeModel.baseNotes,
        middleNotes: this.perfumeModel.middleNotes,
        topNotes: this.perfumeModel.topNotes,
        uncategorizedNotes: this.perfumeModel.uncategorizedNotes,
      })
      .from(this.perfumeModel)
      .where(ilike(this.perfumeModel.name, `${perfumeName}%`));

    if (!perfume)
      throw new this.CustomError.NotFoundError(
        'Perfume with given name is not found.',
      );

    this.logger.info('Finding similar perfumes by comparing notes');
    const { brandId, ...perfumeCols } = getTableColumns(this.perfumeModel);

    const noteAsPostgresArray = `{${perfume.uncategorizedNotes?.toString() ?? '-1'}}`;
    const MINIMUM_UNCATEGORIZED_MATCH = 2;
    /** @description we set this to -1 because there is no id with -1 hence no way it can overlaps. Because it's not allowed to overlaps againnts empty array. */
    const DEFAULT_NOTES_NULL = [-1n];

    let filterQuery = and(
      not(eq(this.perfumeModel.id, perfume.id)),
      or(
        arrayOverlaps(
          this.perfumeModel.middleNotes,
          perfume.middleNotes ?? DEFAULT_NOTES_NULL,
        ),
        and(
          arrayOverlaps(
            this.perfumeModel.baseNotes,
            perfume.baseNotes ?? DEFAULT_NOTES_NULL,
          ),
          arrayOverlaps(
            this.perfumeModel.middleNotes,
            perfume.middleNotes ?? DEFAULT_NOTES_NULL,
          ),
        ),
        and(
          arrayOverlaps(
            this.perfumeModel.uncategorizedNotes,
            perfume.uncategorizedNotes ?? DEFAULT_NOTES_NULL,
          ),
          sql`EXISTS (SELECT 1 FROM unnest(perfumes.uncategorized_notes) x(tg) WHERE x.tg = ANY (${noteAsPostgresArray}) HAVING count(*) >= ${MINIMUM_UNCATEGORIZED_MATCH})`,
        ),
        and(
          arrayOverlaps(
            this.perfumeModel.middleNotes,
            perfume.uncategorizedNotes ?? DEFAULT_NOTES_NULL,
          ),
          sql`EXISTS (SELECT 1 FROM unnest(perfumes.uncategorized_notes) x(tg) WHERE x.tg = ANY (${noteAsPostgresArray}) HAVING count(*) >= ${MINIMUM_UNCATEGORIZED_MATCH})`,
        ),
      ),
    );

    const countDriver = this.psql
      .select({ count: count() })
      .from(this.perfumeModel);
    const selectSimilarPerfumesDriver = this.psql
      .select({ ...perfumeCols, brand: this.brandModel })
      .from(this.perfumeModel)
      .leftJoin(
        this.brandModel,
        eq(this.perfumeModel.brandId, this.brandModel.id),
      );

    const pageSize = options.limit ?? 100;
    const isUnlimitedSize = options.limit === 'null';
    const rowOffset = this.getRowOffset({ ...options, limit: pageSize });

    if (options.filter) {
      const filterArgs = this.sqlBuilders.buildFilters(
        this.perfumeModel,
        options.filter,
      );

      filterQuery = and(filterQuery, filterArgs);
    }
    selectSimilarPerfumesDriver.offset(rowOffset);
    if (!isUnlimitedSize) selectSimilarPerfumesDriver.limit(pageSize as number);
    if (options.order) {
      const orderArgs = this.sqlBuilders.buildSorts(
        this.perfumeModel,
        options.order,
      );

      selectSimilarPerfumesDriver.orderBy(...orderArgs);
    }

    const similarPerfumes =
      await selectSimilarPerfumesDriver.where(filterQuery);
    const [total] = await countDriver.where(filterQuery);

    const pageTotal = isUnlimitedSize
      ? 1
      : Math.ceil((total?.count ?? 0) / (pageSize as number));
    const currentPage = isUnlimitedSize
      ? 1
      : options.page ?? Math.floor(rowOffset / (pageSize as number)) + 1;

    return {
      data: {
        perfumeTarget: { id: perfume.id, name: perfume.name },
        similarPerfumes,
      },
      meta: {
        pageTotal,
        currentPage: currentPage > pageTotal ? pageTotal : currentPage,
        itemTotal: total?.count ?? 0,
      },
    };
  }

  public async queryPerfumesByNotes(
    noteIds: bigint[],
    options: DB.QueryOptions,
  ) {
    this.logger.info('Finding perfumes by given notes');
    const { brandId, ...perfumeCols } = getTableColumns(this.perfumeModel);

    let filterQuery = or(
      this.getCategorizedNotesFilter(noteIds),
      arrayContains(this.perfumeModel.uncategorizedNotes, noteIds),
    );

    const countDriver = this.psql
      .select({ count: count() })
      .from(this.perfumeModel);
    const selectDriver = this.psql
      .select({
        popularity: sql<number>`((COUNT(*) * 0.6) + (${this.perfumeModel.likeCount} * 0.3) + (${this.perfumeModel.viewCount} * 0.1))::DOUBLE PRECISION`,
        ...perfumeCols,
        brand: this.brandModel,
      })
      .from(this.perfumeModel)
      .leftJoin(
        this.brandModel,
        eq(this.perfumeModel.brandId, this.brandModel.id),
      )
      .leftJoin(
        this.perfumeReviewModel,
        eq(this.perfumeModel.id, this.perfumeReviewModel.perfumeId),
      )
      .groupBy(this.perfumeModel.id, this.brandModel.id);

    const pageSize = options.limit ?? 100;
    const isUnlimitedSize = options.limit === 'null';
    const rowOffset = this.getRowOffset({ ...options, limit: pageSize });

    if (options.filter) {
      const filterArgs = this.sqlBuilders.buildFilters(
        this.perfumeModel,
        options.filter,
      );

      filterQuery = and(filterQuery, filterArgs);
    }
    selectDriver.offset(rowOffset);
    if (!isUnlimitedSize) selectDriver.limit(pageSize as number);
    if (options.order) {
      const direction = options.order[0]?.[0];
      const column = options.order[0]?.[1];

      if (column === 'popularity') {
        selectDriver.orderBy(sql.raw(`1 ${direction}`));
      } else {
        const orderArgs = this.sqlBuilders.buildSorts(
          this.perfumeModel,
          options.order,
        );

        selectDriver.orderBy(...orderArgs);
      }
    }

    const perfumes = await selectDriver.where(filterQuery);
    const [total] = await countDriver.where(filterQuery);

    const pageTotal = isUnlimitedSize
      ? 1
      : Math.ceil((total?.count ?? 0) / (pageSize as number));
    const currentPage = isUnlimitedSize
      ? 1
      : options.page ?? Math.floor(rowOffset / (pageSize as number)) + 1;

    return {
      data: perfumes,
      meta: {
        pageTotal,
        currentPage: currentPage > pageTotal ? pageTotal : currentPage,
        itemTotal: total?.count ?? 0,
      },
    };
  }

  public async queryPerfumesContainNote(
    noteId: bigint,
    options: DB.QueryOptions,
  ) {
    this.logger.info('Finding perfumes by given notes');
    const { brandId, ...perfumeCols } = getTableColumns(this.perfumeModel);

    let filterQuery = or(
      arrayContains(this.perfumeModel.topNotes, [noteId]),
      arrayContains(this.perfumeModel.middleNotes, [noteId]),
      arrayContains(this.perfumeModel.baseNotes, [noteId]),
      arrayContains(this.perfumeModel.uncategorizedNotes, [noteId]),
    );

    const countDriver = this.psql
      .select({ count: count() })
      .from(this.perfumeModel);
    const selectDriver = this.psql
      .select({
        ...perfumeCols,
        brand: this.brandModel,
      })
      .from(this.perfumeModel)
      .leftJoin(
        this.brandModel,
        eq(this.perfumeModel.brandId, this.brandModel.id),
      );

    const pageSize = options.limit ?? 100;
    const isUnlimitedSize = options.limit === 'null';
    const rowOffset = this.getRowOffset({ ...options, limit: pageSize });

    if (options.filter) {
      const filterArgs = this.sqlBuilders.buildFilters(
        this.perfumeModel,
        options.filter,
      );

      filterQuery = and(filterQuery, filterArgs);
    }
    selectDriver.offset(rowOffset);
    if (!isUnlimitedSize) selectDriver.limit(pageSize as number);
    if (options.order) {
      const orderArgs = this.sqlBuilders.buildSorts(
        this.perfumeModel,
        options.order,
      );

      selectDriver.orderBy(...orderArgs);
    }

    const perfumes = await selectDriver.where(filterQuery);
    const [total] = await countDriver.where(filterQuery);

    const pageTotal = isUnlimitedSize
      ? 1
      : Math.ceil((total?.count ?? 0) / (pageSize as number));
    const currentPage = isUnlimitedSize
      ? 1
      : options.page ?? Math.floor(rowOffset / (pageSize as number)) + 1;

    return {
      data: perfumes,
      meta: {
        pageTotal,
        currentPage: currentPage > pageTotal ? pageTotal : currentPage,
        itemTotal: total?.count ?? 0,
      },
    };
  }

  public async update(
    {
      removedBaseNotes,
      removedMiddleNotes,
      removedTopNotes,
      removedUncategorizedNotes,
      addedBaseNotes,
      addedMiddleNotes,
      addedTopNotes,
      addedUncategorizedNotes,
      ...perfume
    }: UpdatePerfume,
    id: bigint,
  ) {
    const { topNotes, baseNotes, middleNotes, uncategorizedNotes, variants } =
      getTableColumns(this.perfumeModel);
    const [isExist] = await this.psql
      .select({
        topNotes,
        baseNotes,
        middleNotes,
        uncategorizedNotes,
        variants,
      })
      .from(this.perfumeModel)
      .where(eq(this.perfumeModel.id, id));
    if (!isExist)
      throw new this.CustomError.NotFoundError(
        'Perfume with given id is not found.',
      );

    this.logger.info('Flatten notes data.');
    const {
      addedNoteIds,
      baseNoteIds,
      middleNoteIds,
      noteAliases,
      topNoteIds,
      uncategorizedNoteIds,
    } = this.flattenNoteData({
      baseNotes: addedBaseNotes,
      middleNotes: addedMiddleNotes,
      topNotes: addedTopNotes,
      uncategorizedNotes: addedUncategorizedNotes,
    });
    this.logger.info('Finish flattening notes data.');

    const removedNoteIds = [
      ...(removedBaseNotes ?? []),
      ...(removedMiddleNotes ?? []),
      ...(removedTopNotes ?? []),
      ...(removedUncategorizedNotes ?? []),
    ];

    let updatedUncategorizedNotes: bigint[] | null = isExist.uncategorizedNotes;
    let updatedBaseNotes: bigint[] | null = isExist.baseNotes;
    let updatedMiddleNotes: bigint[] | null = isExist.middleNotes;
    let updatedTopNotes: bigint[] | null = isExist.topNotes;

    this.logger.info('Going through pipelines for updating perfume notes.');

    this.logger.info('Uncategorized notes update pipelines.');
    if (uncategorizedNoteIds) {
      updatedUncategorizedNotes = [
        ...(updatedUncategorizedNotes ?? []),
        ...uncategorizedNoteIds,
      ];
    }

    if (updatedUncategorizedNotes && removedUncategorizedNotes) {
      updatedUncategorizedNotes = updatedUncategorizedNotes.filter(
        (noteId) => !removedUncategorizedNotes?.includes(noteId),
      );

      if (updatedUncategorizedNotes.length === 0)
        updatedUncategorizedNotes = null;
    }

    this.logger.info('Categorized notes update pipelines.');
    if (baseNoteIds) {
      updatedBaseNotes = [...(updatedBaseNotes ?? []), ...baseNoteIds];
    }
    if (middleNoteIds) {
      updatedMiddleNotes = [...(updatedMiddleNotes ?? []), ...middleNoteIds];
    }
    if (topNoteIds) {
      updatedTopNotes = [...(updatedTopNotes ?? []), ...topNoteIds];
    }

    if (updatedBaseNotes && removedBaseNotes) {
      updatedBaseNotes = updatedBaseNotes.filter(
        (noteId) => !removedBaseNotes?.includes(noteId),
      );

      if (updatedBaseNotes.length === 0) updatedBaseNotes = null;
    }
    if (updatedMiddleNotes && removedMiddleNotes) {
      updatedMiddleNotes = updatedMiddleNotes.filter(
        (noteId) => !removedMiddleNotes?.includes(noteId),
      );

      if (updatedMiddleNotes.length === 0) updatedMiddleNotes = null;
    }
    if (updatedTopNotes && removedTopNotes) {
      updatedTopNotes = updatedTopNotes.filter(
        (noteId) => !removedTopNotes?.includes(noteId),
      );

      if (updatedTopNotes.length === 0) updatedTopNotes = null;
    }

    await Promise.all([
      this.psql
        .update(this.perfumeModel)
        .set({
          ...perfume,
          baseNotes: updatedBaseNotes,
          middleNotes: updatedMiddleNotes,
          topNotes: updatedTopNotes,
          uncategorizedNotes: updatedUncategorizedNotes,
          updatedAt: new Date(),
        })
        .where(eq(this.perfumeModel.id, id)),
      this.psql
        .update(this.noteModel)
        .set({ popularityCount: sql`${this.noteModel.popularityCount} + 1` })
        .where(inArray(this.noteModel.id, addedNoteIds)),
      this.psql
        .update(this.noteModel)
        .set({ popularityCount: sql`${this.noteModel.popularityCount} - 1` })
        .where(inArray(this.noteModel.id, removedNoteIds)),
      this.psql
        .delete(this.perfumeNoteAliasesModel)
        .where(
          and(
            inArray(this.perfumeNoteAliasesModel.noteId, removedNoteIds),
            eq(this.perfumeNoteAliasesModel.perfumeId, id),
          ),
        ),
    ]);

    this.logger.info('Create alias records if demanded.');
    await this.handlePerfumeNoteAliasMutation(noteAliases, id);

    this.logger.info('Handle variant asset change.');

    if (isExist.variants && perfume.variants) {
      const deleted: {
        oldFilePath?: string | null;
        newFilePath?: string | null;
      }[] = [];

      for (const oldVariant of isExist.variants) {
        const isNotDeleted = perfume.variants.some(
          (newVariant) => oldVariant.thumbnail === newVariant.thumbnail,
        );

        if (isNotDeleted) continue;

        deleted.push({
          oldFilePath: oldVariant.thumbnail,
          newFilePath: '-deleted-',
        });
      }

      await this.deleteUnusedAssets(deleted);
    }
    this.logger.info('Finished handling variant asset change.');

    this.webhookHandlers.update({
      methodName: 'update',
      serviceName: 'perfume',
    });
  }

  public async incrementViewCount(id: bigint) {
    await this.psql
      .update(this.perfumeModel)
      .set({
        viewCount: sql`${this.perfumeModel.viewCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(this.perfumeModel.id, id));
  }

  public async create({
    baseNotes,
    middleNotes,
    topNotes,
    uncategorizedNotes,
    ...newPerfume
  }: CreatePerfume) {
    this.logger.info('Increment popularity of all notes in new perfume.');

    this.logger.info('Flatten notes data.');
    const {
      addedNoteIds,
      baseNoteIds,
      middleNoteIds,
      noteAliases,
      topNoteIds,
      uncategorizedNoteIds,
    } = this.flattenNoteData({
      baseNotes,
      middleNotes,
      topNotes,
      uncategorizedNotes,
    });
    this.logger.info('Finish flattening notes data.');

    const [createdPerfume] = await Promise.all([
      this.psql
        .insert(this.perfumeModel)
        .values({
          ...newPerfume,
          topNotes: topNoteIds,
          middleNotes: middleNoteIds,
          baseNotes: baseNoteIds,
          uncategorizedNotes: uncategorizedNoteIds,
          id: newPerfume.id ?? this.generateUniqueID(),
        })
        .returning({ id: this.perfumeModel.id }),
      this.psql
        .update(this.noteModel)
        .set({ popularityCount: sql`${this.noteModel.popularityCount} + 1` })
        .where(inArray(this.noteModel.id, addedNoteIds)),
    ]);

    this.logger.info('Create alias records if demanded.');
    if (createdPerfume[0]?.id)
      await this.handlePerfumeNoteAliasMutation(
        noteAliases,
        createdPerfume[0].id,
      );

    this.webhookHandlers.create({
      methodName: 'create',
      serviceName: 'perfume',
    });

    return createdPerfume[0]!.id;
  }

  public async deleteByIds(ids: bigint[]) {
    const { topNotes, baseNotes, middleNotes, uncategorizedNotes, variants } =
      getTableColumns(this.perfumeModel);

    const deletedPerfumes = await this.psql
      .delete(this.perfumeModel)
      .where(inArray(this.perfumeModel.id, ids))
      .returning({
        id: this.perfumeModel.id,
        topNotes,
        baseNotes,
        middleNotes,
        uncategorizedNotes,
        variants,
      });

    const mappedIds = deletedPerfumes.map((val) => val.id);

    if (mappedIds.length === 0)
      throw new this.CustomError.NotFoundError(
        'Perfumes with given ids are not found.',
      );

    this.logger.info("Decrement deleted perfume's notes popularity.");
    for (const deletedPerfume of deletedPerfumes) {
      const removedNoteIds = [
        ...(deletedPerfume.baseNotes ?? []),
        ...(deletedPerfume.middleNotes ?? []),
        ...(deletedPerfume.topNotes ?? []),
        ...(deletedPerfume.uncategorizedNotes ?? []),
      ];

      await this.psql
        .update(this.noteModel)
        .set({ popularityCount: sql`${this.noteModel.popularityCount} + 1` })
        .where(inArray(this.noteModel.id, removedNoteIds));
    }

    const deletedAssets: {
      oldFilePath?: string | null;
      newFilePath?: string | null;
    }[] = [];

    deletedPerfumes.forEach((perfume) => {
      perfume.variants.forEach((variant) => {
        deletedAssets.push({
          oldFilePath: variant.thumbnail,
          newFilePath: '-deleted-',
        });
      });
    });

    await this.deleteUnusedAssets(deletedAssets);

    this.webhookHandlers.delete({
      methodName: 'deleteByIds',
      serviceName: 'perfume',
    });

    return mappedIds;
  }
}
