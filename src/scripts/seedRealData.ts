// import JSONbig from 'json-bigint';
// JSON.parse = JSONbig({ useNativeBigInt: true }).parse; // Patch for serialize big int
// JSON.stringify = JSONbig({ useNativeBigInt: true }).stringify; // Patch for serialize big int

// import axios from 'axios';
// import fs from 'fs';
// import FormData from 'form-data';
// import { marked } from 'marked';
// import { JSDOM } from 'jsdom';
// import DOMPurify from 'dompurify';

// import env from '../config/index.js';

// import { readCsvFile } from '../utils/csvHandler.js';
// import logger from '../loaders/logger.js';

// import type { CreateNoteCategory } from '../interfaces/NoteCategory.js';
// import { generateUniqueID } from '../utils/generateId.js';
// import type { CreateNote } from '../interfaces/Note.js';
// import type { CreateBrand } from '../interfaces/Brand.js';
// import type { CreateTag } from '../interfaces/Tag.js';
// import { Gender, Occasion, PerfumeType } from '../models/perfumes.js';
// import { ArticleStatus, ArticleType } from '../models/articles.js';
// import type { CreatePerfume, UpdatePerfume } from '../interfaces/Perfume.js';
// import type { CreateArticle } from '../interfaces/Article.js';
// import { readHTMLFile } from '../utils/fsHandler.js';
// import type { CreatePromotion } from '../interfaces/Promotion.js';

// const getBooleanValue = (text: string) => {
//   return text.trim().toLowerCase() === 'yes';
// };

// const AUTH_HEADER = {
//   headers: {
//     'x-csrf-token':
//       '8b135b3f5461b428a240afccfc025209243a7faf67beef24756d5713ee137e4b88b16553a9cebb8048bff9cefe972478aa5bcd9270a0a2d3fa3ce24b1ad781df',
//     Cookie:
//       'wangi=8b135b3f5461b428a240afccfc025209243a7faf67beef24756d5713ee137e4b88b16553a9cebb8048bff9cefe972478aa5bcd9270a0a2d3fa3ce24b1ad781df%7C034bc8cf1118056f821c6b6dcd2aa764d97659422f4dc51bf24ba8d2812a1cd4; wangiwangi=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYyMTA5NjYyNDIxNDgyNDU2MTMiLCJyb2xlIjoiYWRtaW4iLCJ1c2VybmFtZSI6ImFkbWluIiwic3RhdHVzIjoiYWN0aXZlIiwiaWF0IjoxNzI5NjY2NjYwLCJleHAiOjE3MzIyNTg2NjB9.R_3cEKt3wROgnCRPVHpd-aof4xCk_pxUtv0YjtcaEhg',
//   },
// };

// interface PromotionData {
//   title: string;
//   label: string;
//   link: string;
//   cover: string;
//   isActive: string;
// }
// const seedPromotions = async () => {
//   try {
//     logger.info('Seeding promotions.');

//     logger.info('Reading promotions csv.');
//     const promotionPath = './data/promotion-data.csv';
//     const promotionData = await readCsvFile<PromotionData>(promotionPath, [
//       'title',
//       'label',
//       'link',
//       'cover',
//       'isActive',
//     ]);

//     if (!promotionData) throw new Error('Failed reading promotion data.');

//     const API_IMAGE = `${env.apiBaseUrl}/api/upload?category=promotion`;
//     const API_PROMOTION = `${env.apiBaseUrl}/api/promotions`;

//     for (const promotion of promotionData) {
//       const newId = generateUniqueID();

//       logger.info('Uploading promotions cover.');
//       const file = fs.createReadStream(`./__assets/${promotion.cover}`);
//       const formData = new FormData();
//       formData.append('image', file);

//       const { data: cover } = await axios.post(
//         `${API_IMAGE}&id=${newId}&prefix=cover`,
//         formData,
//         {
//           headers: {
//             'Content-Type': 'multipart/form-data',
//             ...AUTH_HEADER.headers,
//           },
//         },
//       );

//       logger.info('Uploading promotions data.');
//       const newPromotion: CreatePromotion = {
//         id: newId,
//         title: promotion.title.trim(),
//         href: promotion.link,
//         label: promotion.label,
//         cover: cover.data,
//         isActive: getBooleanValue(promotion.isActive),
//       };

//       await axios.post(`${API_PROMOTION}`, newPromotion, AUTH_HEADER);
//     }
//   } catch (error: any) {
//     logger.error('Error: ', error);
//   }
// };

// type LookupTableCategory = { [categoryName: string]: bigint };
// interface NoteCategoryData {
//   name: string;
//   description: string;
//   cover: string;
//   color: string;
//   shade: string;
// }
// const seedNoteCategory = async () => {
//   try {
//     logger.info('Seeding note category.');

//     logger.info('Reading note category csv.');
//     const noteCategoryPath = './data/note-category-data.csv';
//     const noteCategoryData = await readCsvFile<NoteCategoryData>(
//       noteCategoryPath,
//       ['name', 'description', 'cover', 'color', 'shade'],
//     );

//     if (!noteCategoryData)
//       throw new Error('Failed reading note category data.');

//     const API_IMAGE = `${env.apiBaseUrl}/api/upload?category=note-category`;
//     const API_NOTE_CATEGORY = `${env.apiBaseUrl}/api/notes/categories`;

//     const nodeCategoryLookup: LookupTableCategory = {};

//     for (const noteCategory of noteCategoryData) {
//       const newId = generateUniqueID();

//       logger.info('Uploading note category cover.');
//       const file = fs.createReadStream(`./__assets/${noteCategory.cover}`);
//       const formData = new FormData();
//       formData.append('image', file);

//       const { data: cover } = await axios.post(
//         `${API_IMAGE}&id=${newId}&prefix=cover`,
//         formData,
//         {
//           headers: {
//             'Content-Type': 'multipart/form-data',
//             ...AUTH_HEADER.headers,
//           },
//         },
//       );

//       logger.info('Uploading note category data.');
//       const newNoteCategory: CreateNoteCategory = {
//         id: newId,
//         name: noteCategory.name.trim(),
//         description: noteCategory.description,
//         color: noteCategory.color,
//         shade: noteCategory.shade,
//         cover: cover.data,
//       };

//       await axios.post(`${API_NOTE_CATEGORY}`, newNoteCategory, AUTH_HEADER);

//       nodeCategoryLookup[newNoteCategory.name.toLocaleLowerCase()] = newId;
//     }

//     return nodeCategoryLookup;
//   } catch (error: any) {
//     logger.error('Error: ', error);
//   }
// };

// type LookupTableNote = { [noteName: string]: bigint };
// interface NoteData {
//   name: string;
//   description: string;
//   cover: string;
//   category: string;
//   icon: string;
// }
// const seedNote = async (categoryLookup: LookupTableCategory) => {
//   try {
//     logger.info('Seeding note.');

//     logger.info('Reading note csv.');
//     const notePath = './data/note-data.csv';
//     const noteData = await readCsvFile<NoteData>(notePath, [
//       'name',
//       'description',
//       'category',
//       'cover',
//       'icon',
//     ]);

//     if (!noteData) throw new Error('Failed reading note data.');

//     const API_IMAGE = `${env.apiBaseUrl}/api/upload?category=note`;
//     const API_NOTE = `${env.apiBaseUrl}/api/notes`;

//     const noteLookup: LookupTableNote = {};

//     for (const note of noteData) {
//       const newId = generateUniqueID();
//       const categoryId =
//         categoryLookup[note.category.trim().toLocaleLowerCase()];

//       if (!categoryId) {
//         logger.error(
//           `Note ${note.name} doesn't found the category ${note.category} in database, skipping.`,
//         );
//         continue;
//       }

//       logger.info('Uploading note cover.');
//       const fileCover = fs.createReadStream(`./__assets/${note.cover}`);
//       const formDataCover = new FormData();
//       formDataCover.append('image', fileCover);

//       const { data: cover } = await axios.post(
//         `${API_IMAGE}&id=${newId}&prefix=cover`,
//         formDataCover,
//         {
//           headers: {
//             'Content-Type': 'multipart/form-data',
//             ...AUTH_HEADER.headers,
//           },
//         },
//       );

//       logger.info('Uploading note icon.');
//       const fileIcon = fs.createReadStream(`./__assets/${note.icon}`);
//       const formDataIcon = new FormData();
//       formDataIcon.append('image', fileIcon);

//       const { data: icon } = await axios.post(
//         `${API_IMAGE}&id=${newId}&prefix=icon`,
//         formDataIcon,
//         {
//           headers: {
//             'Content-Type': 'multipart/form-data',
//             ...AUTH_HEADER.headers,
//           },
//         },
//       );

//       logger.info('Uploading note data.');
//       const newNote: CreateNote = {
//         id: newId,
//         name: note.name.trim(),
//         description: note.description
//           ? note.description
//           : 'No description yet.',
//         cover: cover.data,
//         icon: icon.data,
//         categoryId,
//       };

//       await axios.post(`${API_NOTE}`, newNote, AUTH_HEADER);

//       noteLookup[newNote.name.toLocaleLowerCase()] = newNote.id!;
//     }

//     return noteLookup;
//   } catch (error: any) {
//     logger.error('Error: ', error);
//   }
// };

// type LookupTableBrand = { [brandName: string]: bigint };
// interface BrandData {
//   name: string;
//   description: string;
//   banner?: string;
//   logo?: string;
//   website?: string;
//   igUsername?: string;
// }
// const seedBrand = async () => {
//   try {
//     logger.info('Seeding brand.');

//     logger.info('Reading brand csv.');
//     const brandPath = './data/brand-data.csv';
//     const brandData = await readCsvFile<BrandData>(brandPath, [
//       'name',
//       'banner',
//       'logo',
//       'description',
//       'website',
//       'igUsername',
//     ]);

//     if (!brandData) throw new Error('Failed reading brand data.');

//     const API_IMAGE = `${env.apiBaseUrl}/api/upload?category=brand`;
//     const API_BRAND = `${env.apiBaseUrl}/api/brands`;

//     const brandLookup: LookupTableBrand = {};

//     for (const brand of brandData) {
//       const newId = generateUniqueID();
//       let banner: string | undefined;
//       let logo: string | undefined;

//       if (brand.banner && brand.banner !== '-') {
//         logger.info('Uploading brand cover.');
//         const fileCover = fs.createReadStream(`./__assets/${brand.banner}`);
//         const formDataCover = new FormData();
//         formDataCover.append('image', fileCover);

//         const { data: bannerImage } = await axios.post(
//           `${API_IMAGE}&id=${newId}&prefix=cover`,
//           formDataCover,
//           {
//             headers: {
//               'Content-Type': 'multipart/form-data',
//               ...AUTH_HEADER.headers,
//             },
//           },
//         );

//         banner = bannerImage.data;
//       }

//       if (brand.logo && brand.logo !== '-') {
//         logger.info('Uploading brand logo.');
//         const fileCover = fs.createReadStream(`./__assets/${brand.logo}`);
//         const formDataCover = new FormData();
//         formDataCover.append('image', fileCover);

//         const { data: logoImage } = await axios.post(
//           `${API_IMAGE}&id=${newId}&prefix=logo`,
//           formDataCover,
//           {
//             headers: {
//               'Content-Type': 'multipart/form-data',
//               ...AUTH_HEADER.headers,
//             },
//           },
//         );

//         logo = logoImage.data;
//       }

//       logger.info('Uploading brand data.');
//       const newBrand: CreateBrand = {
//         id: newId,
//         name: brand.name.trim(),
//         logo,
//         description: brand.description,
//         banner,
//         website: brand.website,
//         igUsername: brand.igUsername,
//       };

//       await axios.post(`${API_BRAND}`, newBrand, AUTH_HEADER);

//       brandLookup[newBrand.name.toLocaleLowerCase()] = newBrand.id!;
//     }

//     return brandLookup;
//   } catch (error: any) {
//     logger.error('Error: ', error);
//   }
// };

// type LookupTableTag = { [tagName: string]: CreateTag };
// interface TagData {
//   name: string;
// }
// const seedTag = async () => {
//   try {
//     logger.info('Seeding tag.');

//     logger.info('Reading tag csv.');
//     const tagPath = './data/tag-data.csv';
//     const tagData = await readCsvFile<TagData>(tagPath, ['name']);

//     if (!tagData) throw new Error('Failed reading tag data.');

//     const API_TAG = `${env.apiBaseUrl}/api/articles/tags`;

//     const tagLookup: LookupTableTag = {};

//     for (const tag of tagData) {
//       const newId = generateUniqueID();

//       logger.info('Uploading tag data.');
//       const newTag: CreateTag = {
//         id: newId,
//         name: tag.name.trim(),
//       };

//       await axios.post(`${API_TAG}`, newTag, AUTH_HEADER);

//       tagLookup[newTag.name.toLocaleLowerCase()] = newTag;
//     }

//     return tagLookup;
//   } catch (error: any) {
//     logger.error('Error: ', error);
//   }
// };

// interface ArticleData {
//   metaKeyword: string;
//   metaDescription: string;
//   title: string;
//   author: string;
//   imageBy: string;
//   cover: string;
//   banner?: string;
//   /** @description a link to md file. */
//   content: string;
//   /** @description comma separated tags. */
//   tags: string;
//   isFeatured: string;
//   type: string;
//   status: string;
// }
// const seedArticle = async (
//   tagLookup: LookupTableTag,
//   brandLookup: LookupTableBrand,
// ) => {
//   try {
//     const window = new JSDOM('').window;
//     const purify = DOMPurify(window);

//     logger.info('Seeding article.');

//     logger.info('Reading article csv.');
//     const articlePath = './data/article-data.csv';
//     const articleData = await readCsvFile<ArticleData>(articlePath, [
//       'metaKeyword',
//       'metaDescription',
//       'title',
//       'author',
//       'imageBy',
//       'cover',
//       'banner',
//       'content',
//       'tags',
//       'isFeatured',
//       'type',
//       'status',
//     ]);

//     if (!articleData) throw new Error('Failed reading article data.');

//     const API_IMAGE = `${env.apiBaseUrl}/api/upload?category=article`;
//     const API_ARTICLE = `${env.apiBaseUrl}/api/articles`;

//     for (const article of articleData) {
//       const newId = generateUniqueID();
//       const tags = article.tags
//         .split(',')
//         .map((tag) => tagLookup[tag.trim().toLowerCase()]?.id);

//       if (!tags || tags.some((tag) => !tag)) {
//         logger.error(
//           `Article tags ${article.tags} didn't found the tag in tag database, skipping.`,
//         );
//         continue;
//       }

//       let coverUrl = '';
//       let bannerUrl = '';
//       let content = '';

//       if (article.cover) {
//         logger.info('Uploading article cover.');
//         const file = fs.createReadStream(`./__assets/${article.cover}`);
//         const formData = new FormData();
//         formData.append('image', file);

//         const { data: cover } = await axios.post(
//           `${API_IMAGE}&id=${newId}&prefix=cover`,
//           formData,
//           {
//             headers: {
//               'Content-Type': 'multipart/form-data',
//               ...AUTH_HEADER.headers,
//             },
//           },
//         );

//         coverUrl = cover.data;
//       }

//       if (article.banner) {
//         logger.info('Uploading article banner.');
//         const file = fs.createReadStream(`./__assets/${article.banner}`);
//         const formData = new FormData();
//         formData.append('image', file);

//         const { data: banner } = await axios.post(
//           `${API_IMAGE}&id=${newId}&prefix=banner`,
//           formData,
//           {
//             headers: {
//               'Content-Type': 'multipart/form-data',
//               ...AUTH_HEADER.headers,
//             },
//           },
//         );

//         bannerUrl = banner.data;
//       }

//       if (article.content) {
//         logger.info('Reading markdown content.');
//         const mdText = await readHTMLFile(`./__assets/${article.content}`);
//         const html = await marked.parse(mdText);
//         const sanitized = purify.sanitize(html);

//         content = sanitized;
//       }

//       logger.info('Uploading article data.');
//       const newArticle: CreateArticle = {
//         id: newId,
//         metaDescription: article.metaDescription,
//         metaKeywords: article.metaKeyword,
//         content,
//         tags: tags as bigint[],
//         author: article.author,
//         imageBy: article.imageBy,
//         title: article.title,
//         type: ArticleType[article.type],
//         banner: bannerUrl,
//         cover: coverUrl,
//         isFeatured: getBooleanValue(article.isFeatured),
//         status: ArticleStatus[article.status],
//       };

//       await axios.post(`${API_ARTICLE}`, newArticle, AUTH_HEADER);
//     }
//   } catch (error: any) {
//     logger.error('Error: ', error);
//   }
// };

// type LookupTablePerfume = { [perfumeName: string]: bigint };
// interface PerfumeData {
//   brand: string;
//   name: string;
//   topNotes?: string;
//   middleNotes?: string;
//   baseNotes?: string;
//   uncategorizedNotes?: string;
//   releaseDate: string;
//   type: string;
//   gender: string;
//   ocassion: string;
//   price: string;
//   isHalal: string;
//   isBPOM: string;
//   variants: string;
//   thumbnails: string;
//   description: string;
//   isFeatured: string;
// }
// const getVariantsValue = async (perfume: PerfumeData, newId: bigint) => {
//   const API_IMAGE = `${env.apiBaseUrl}/api/upload?category=perfume`;

//   const variants = perfume.variants.split(',');
//   const thumbnails = perfume.thumbnails.split(',');

//   const perfumeVariants: CreatePerfume['variants'] = [];

//   for (let i = 0; i < variants.length; i++) {
//     const variant = variants[i]?.trim();
//     const thumbnail = thumbnails[i]?.trim();

//     if (!variant || !thumbnail) {
//       logger.info(
//         `Skipping perfume ${perfume.name}'s variant because not value.`,
//       );
//       continue;
//     }

//     logger.info(`Uploading perfume ${perfume.name}'s variant of ${thumbnail}.`);
//     const file = fs.createReadStream(`./__assets/${thumbnail}`);
//     const formData = new FormData();
//     formData.append('image', file);

//     const { data: perfumeThumbnail } = await axios.post(
//       `${API_IMAGE}&id=${newId}&prefix=variant`,
//       formData,
//       {
//         headers: {
//           'Content-Type': 'multipart/form-data',
//           ...AUTH_HEADER.headers,
//         },
//       },
//     );

//     perfumeVariants.push({ label: variant, thumbnail: perfumeThumbnail.data });
//   }

//   return perfumeVariants;
// };
// const getNoteAndAliasesValue = (
//   perfume: PerfumeData,
//   noteLookup: LookupTableNote,
// ) => {
//   const baseNoteIds: bigint[] = [];
//   const middleNoteIds: bigint[] = [];
//   const topNoteIds: bigint[] = [];
//   const uncategorizedNoteIds: bigint[] = [];
//   const noteAliases: { noteId: bigint; alias: string }[] = [];

//   const isUncategorized = Boolean(perfume.uncategorizedNotes?.trim());

//   if (isUncategorized) {
//     const splitted = perfume.uncategorizedNotes?.split(',') ?? [];

//     for (const note of splitted) {
//       const data = note.trim().split('|');
//       const name = data[0]!;
//       const alias = data[1];
//       const noteId = noteLookup[name.toLowerCase()];

//       if (!noteId) continue;
//       if (alias) noteAliases.push({ alias, noteId });

//       uncategorizedNoteIds.push(noteId);
//     }
//   } else {
//     const splittedBase = perfume.baseNotes?.split(',') ?? [];
//     for (const baseNote of splittedBase) {
//       const data = baseNote.trim().split('|');
//       const name = data[0]!.trim();
//       const alias = data[1];
//       const noteId = noteLookup[name.toLowerCase()];

//       if (!noteId) continue;
//       if (alias) noteAliases.push({ alias, noteId });

//       baseNoteIds.push(noteId);
//     }

//     const splittedMiddle = perfume.middleNotes?.split(',') ?? [];
//     for (const middleNote of splittedMiddle) {
//       const data = middleNote.trim().split('|');
//       const name = data[0]!.trim();
//       const alias = data[1];
//       const noteId = noteLookup[name.toLowerCase()];

//       if (!noteId) continue;
//       if (alias) noteAliases.push({ alias, noteId });

//       middleNoteIds.push(noteId);
//     }

//     const splittedTop = perfume.topNotes?.split(',') ?? [];
//     for (const topNote of splittedTop) {
//       const data = topNote.trim().split('|');
//       const name = data[0]!.trim();
//       const alias = data[1];
//       const noteId = noteLookup[name.toLowerCase()];

//       if (!noteId) continue;
//       if (alias) noteAliases.push({ alias, noteId });

//       topNoteIds.push(noteId);
//     }
//   }

//   return {
//     baseNotes: baseNoteIds.length === 0 ? undefined : baseNoteIds,
//     middleNotes: middleNoteIds.length === 0 ? undefined : middleNoteIds,
//     topNotes: topNoteIds.length === 0 ? undefined : topNoteIds,
//     uncategorizedNotes:
//       uncategorizedNoteIds.length === 0 ? undefined : uncategorizedNoteIds,
//     noteAliases,
//   };
// };
// const seedPerfume = async (
//   brandLookup: LookupTableBrand,
//   noteLookup: LookupTableNote,
// ) => {
//   try {
//     logger.info('Seeding perfume.');

//     logger.info('Reading perfume csv.');
//     const perfumePath = './data/perfume-data.csv';
//     const perfumeData = await readCsvFile<PerfumeData>(perfumePath, [
//       'brand',
//       'name',
//       'topNotes',
//       'middleNotes',
//       'baseNotes',
//       'uncategorizedNotes',
//       'releaseDate',
//       'type',
//       'gender',
//       'ocassion',
//       'price',
//       'isHalal',
//       'isBPOM',
//       'variants',
//       'thumbnails',
//       'description',
//       'isFeatured',
//     ]);

//     if (!perfumeData) throw new Error('Failed reading perfume data.');

//     const API_PERFUME = `${env.apiBaseUrl}/api/perfumes`;

//     for (const perfume of perfumeData) {
//       logger.info(`Processing perfume ${perfume.name}.`);

//       let brandId: bigint | undefined;

//       if (perfume.brand && perfume.brand !== '-')
//         brandId = brandLookup[perfume.brand.toLowerCase()];

//       const newId = generateUniqueID();
//       const occasion =
//         perfume.ocassion.toLowerCase() === 'all day'
//           ? Occasion.AllDay
//           : Occasion[perfume.ocassion];
//       const variants = await getVariantsValue(perfume, newId);
//       const {
//         baseNotes,
//         middleNotes,
//         noteAliases,
//         topNotes,
//         uncategorizedNotes,
//       } = getNoteAndAliasesValue(perfume, noteLookup);

//       logger.info('Uploading perfume data.');
//       const newPerfume: CreatePerfume = {
//         id: newId,
//         name: perfume.name.trim(),
//         description: perfume.description
//           ? perfume.description
//           : 'No Description yet.',
//         gender: Gender[perfume.gender],
//         type: PerfumeType[perfume.type],
//         occasion,
//         brandId,
//         variants,
//         baseNotes,
//         middleNotes,
//         noteAliases,
//         topNotes,
//         uncategorizedNotes,
//         price: Number(perfume.price),
//         releaseDate: perfume.releaseDate,
//         isHalal: getBooleanValue(perfume.isHalal),
//         isBpomCertified: getBooleanValue(perfume.isBPOM),
//       };

//       await axios.post(`${API_PERFUME}`, newPerfume, AUTH_HEADER);
//     }
//   } catch (error: any) {
//     logger.error('Error: ', error);
//   }
// };
// const fixPerfumeTopNotes = async (
//   perfumeLookup: LookupTablePerfume,
//   noteLookup: LookupTableNote,
// ) => {
//   try {
//     logger.info('Seeding perfume.');

//     logger.info('Reading perfume csv.');
//     const perfumePath = './data/perfume-data.csv';
//     const perfumeData = await readCsvFile<PerfumeData>(perfumePath, [
//       'brand',
//       'name',
//       'topNotes',
//       'middleNotes',
//       'baseNotes',
//       'uncategorizedNotes',
//       'releaseDate',
//       'type',
//       'gender',
//       'ocassion',
//       'price',
//       'isHalal',
//       'isBPOM',
//       'variants',
//       'thumbnails',
//       'description',
//       'isFeatured',
//     ]);

//     if (!perfumeData) throw new Error('Failed reading perfume data.');

//     for (const perfume of perfumeData) {
//       logger.info(`Processing perfume ${perfume.name}.`);
//       const perfumeId = perfumeLookup[perfume.name.trim().toLowerCase()];

//       if (!perfumeId) {
//         logger.error(`Perfume ${perfume.name} not found perfume id.`);
//         continue;
//       }

//       const { noteAliases, topNotes } = getNoteAndAliasesValue(
//         perfume,
//         noteLookup,
//       );

//       logger.info('Updating perfume data.');
//       const updatePerfumeData: UpdatePerfume = {
//         addedTopNotes: topNotes,
//       };

//       await axios.put(
//         `${env.apiBaseUrl}/api/perfumes/${perfumeId}`,
//         updatePerfumeData,
//         AUTH_HEADER,
//       );
//     }
//   } catch (error: any) {
//     logger.error('Error: ', error);
//   }
// };

// logger.info('Start seeding process.');
// // const tagLookup = await seedTag();
// // if (!tagLookup) process.exit(1);

// // const brandLookup = await seedBrand();
// // if (!brandLookup) process.exit(1);

// // await seedArticle(tagLookup, brandLookup);

// // const categoryLookup = await seedNoteCategory();
// // if (!categoryLookup) process.exit(1);

// // const {
// //   data: { data: categories },
// // } = await axios.get<{ data: NoteCategory[] }>(
// //   `${env.apiBaseUrl}/api/notes/categories?limit=null`,
// // );
// // const categoryLookup: LookupTableCategory = categories.reduce(
// //   (acc, category) => {
// //     acc[category.name.toLowerCase()] = category.id;

// //     return acc;
// //   },
// //   {},
// // );

// // const {
// //   data: { data: perfumes },
// // } = await axios.get<{ data: Perfume[] }>(
// //   `${env.apiBaseUrl}/api/perfumes?filter=["and", [["isNull", "topNotes", ""], ["isNull", "uncategorizedNotes", ""]]]`,
// // );
// // const perfumeLookup: LookupTablePerfume = perfumes.reduce((acc, perfume) => {
// //   acc[perfume.name.toLowerCase()] = perfume.id;

// //   return acc;
// // }, {});

// // const {
// //   data: { data: notes },
// // } = await axios.get<{ data: NoteCategory[] }>(
// //   `${env.apiBaseUrl}/api/notes?limit=null`,
// // );
// // const noteLookup: LookupTableNote = notes.reduce((acc, note) => {
// //   acc[note.name.toLowerCase()] = note.id;

// //   return acc;
// // }, {});

// // const {
// //   data: { data: brands },
// // } = await axios.get<{ data: Brand[] }>(
// //   `${env.apiBaseUrl}/api/brands?limit=null`,
// // );
// // const brandLookup: LookupTableBrand = brands.reduce((acc, brand) => {
// //   acc[brand.name.toLowerCase()] = brand.id;

// //   return acc;
// // }, {});

// // await seedPerfume(brandLookup, noteLookup);
// // await fixPerfumeTopNotes(perfumeLookup, noteLookup);
// // await seedPromotions();
// logger.info('Finish seeding process.');
