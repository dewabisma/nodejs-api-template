import { Inject, Service } from 'typedi';
import { eq, getTableColumns, ilike, or, sql } from 'drizzle-orm';

@Service()
export default class SearchService {
  constructor(
    @Inject('articles') private articleModel: Models.ArticleModel,
    @Inject('perfumes') private perfumeModel: Models.PerfumeModel,
    @Inject('tags') private tagModel: Models.TagModel,
    @Inject('brands') private brandModel: Models.BrandModel,
    @Inject('psql')
    private psql: DB.Driver,
  ) {}

  /**
   * Combine the search data into one data object.
   *
   * @param data - all data to combine.
   */
  private constructCombinedData(data: {
    perfumes: { id: bigint }[];
    articles: { id: bigint }[];
    brandPerfumes: { id: bigint }[];
  }) {
    const { perfumes, articles, brandPerfumes } = data;

    const combinedPerfumes: any = [];
    const lookupTable: any = {};

    for (const perfume of perfumes) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const alreadyExist = lookupTable[perfume.id];
      if (alreadyExist) continue;

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      lookupTable[perfume.id] = perfume.id;
      combinedPerfumes.push(perfume);
    }

    for (const perfume of brandPerfumes) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const alreadyExist = lookupTable[perfume.id];
      if (alreadyExist) continue;

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      lookupTable[perfume.id] = perfume.id;
      combinedPerfumes.push(perfume);
    }

    data.perfumes = combinedPerfumes;

    const combinedData = { perfumes: combinedPerfumes, articles };
    return combinedData;
  }

  public async searchAll(keyword: string) {
    const { brandId, ...perfumeCols } = getTableColumns(this.perfumeModel);
    const { tags, ...articleCols } = getTableColumns(this.articleModel);

    const [brandMatched] = await this.psql
      .select()
      .from(this.brandModel)
      .where(ilike(this.brandModel.name, `%${keyword}%`))
      .limit(1);

    let brandPerfumes: any[] = [];

    // Only add brand perfumes if found matching brand.
    if (brandMatched)
      brandPerfumes = await this.psql
        .select({ ...perfumeCols, brand: this.brandModel })
        .from(this.perfumeModel)
        .leftJoin(
          this.brandModel,
          eq(this.perfumeModel.brandId, this.brandModel.id),
        )
        .where(eq(this.perfumeModel.brandId, brandMatched.id));

    const selectPerfumeDriver = this.psql
      .select({ ...perfumeCols, brand: this.brandModel })
      .from(this.perfumeModel)
      .leftJoin(
        this.brandModel,
        eq(this.perfumeModel.brandId, this.brandModel.id),
      )
      .where(ilike(this.perfumeModel.name, `%${keyword}%`));

    const selectArticleDriver = this.psql
      .select({
        ...articleCols,
        tags: sql<
          { id: bigint; name: string }[]
        >`jsonb_agg(jsonb_build_object('id', ${this.tagModel.id}, 'name', ${this.tagModel.name}))`,
      })
      .from(this.articleModel)
      .leftJoin(
        this.tagModel,
        sql`${this.tagModel.id} = ANY(${this.articleModel.tags})`,
      )
      .groupBy(this.articleModel.id)
      .where(
        or(
          ilike(this.articleModel.title, `%${keyword}%`),
          ilike(this.articleModel.author, `%${keyword}%`),
        ),
      );

    const [articles, perfumes] = await Promise.all([
      selectArticleDriver,
      selectPerfumeDriver,
    ]);

    const data = this.constructCombinedData({
      perfumes,
      articles,
      brandPerfumes,
    });

    return {
      data,
    };
  }
}
