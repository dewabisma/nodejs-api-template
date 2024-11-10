import { faker } from '@faker-js/faker';
import { format } from 'date-fns/format';
import bcrypt from 'bcrypt';

import type { Brand } from '../interfaces/Brand.js';
import type { Note } from '../interfaces/Note.js';
import type { NoteCategory } from '../interfaces/NoteCategory.js';
import type { Perfume } from '../interfaces/Perfume.js';

import {
  FragrancePyramid,
  Gender,
  Occasion,
  PerfumeType,
} from '../models/perfumes.js';
import { generateUniqueID } from '../utils/generateId.js';
import type { Tag } from '../interfaces/Tag.js';
import type { Article } from '../interfaces/Article.js';
import { ArticleStatus, ArticleType } from '../models/articles.js';
import type { Promotion } from '../interfaces/Promotion.js';
import type { User } from '../interfaces/User.js';
import { UserRole, UserStatus } from '../models/users.js';
import type { PerfumeReview } from '../interfaces/PerfumeReview.js';
import type { UserLikedPerfume } from '../interfaces/UserLikedPerfume.js';
import type { UserFavoritedNote } from '../interfaces/UserFavoritedNote.js';
import slugify from '../utils/slugify.js';
import type { PerfumeNoteAlias } from '../interfaces/PerfumeNoteAlias.js';

const generateFakeUser = (isAdmin: boolean = false): User => {
  const randomDate = faker.date.anytime();
  const dateOfBirth = format(randomDate, 'dd/MM/yyyy');

  const user = {
    id: generateUniqueID(),
    email: faker.internet.email(),
    password: isAdmin ? 'admin' : faker.internet.password(),
    status: UserStatus.Active,
    username: isAdmin ? 'admin' : faker.internet.userName(),
    dateOfBirth,
    lastLoginAt: new Date(),
    oauthProvider: null,
    oauthUid: null,
    role: isAdmin ? UserRole.Admin : faker.helpers.enumValue(UserRole),
    createdAt: faker.date.anytime(),
    updatedAt: faker.date.anytime(),
  };

  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(user.password, salt);

  user.password = hashedPassword;

  return user;
};

const generateFakeUserLikedPerfume = (
  perfumeId: bigint,
  userId: bigint,
): UserLikedPerfume => {
  return {
    id: generateUniqueID(),
    perfumeId,
    userId,
    createdAt: faker.date.anytime(),
    updatedAt: faker.date.anytime(),
  };
};

const generateFakeUserFavoritedNote = (
  noteId: bigint,
  userId: bigint,
): UserFavoritedNote => {
  return {
    id: generateUniqueID(),
    noteId,
    userId,
    createdAt: faker.date.anytime(),
    updatedAt: faker.date.anytime(),
  };
};

const generateFakePromotion = (): Promotion => {
  return {
    id: generateUniqueID(),
    title: faker.word.words(3),
    label: faker.word.words(3),
    href: faker.internet.url(),
    cover: faker.image.url(),
    isActive: faker.datatype.boolean(),
    createdAt: faker.date.anytime(),
    updatedAt: faker.date.anytime(),
  };
};

const generateFakeTag = (): Tag => {
  return {
    id: generateUniqueID(),
    name: faker.word.noun(),
    createdAt: faker.date.anytime(),
    updatedAt: faker.date.anytime(),
  };
};

const generateFakeArticle = (tagIds: bigint[], brandId?: bigint): Article => {
  const title = faker.word.words(3);
  const slug = slugify(title);

  return {
    id: generateUniqueID(),
    title,
    slug,
    type: faker.helpers.enumValue(ArticleType),
    author: faker.internet.userName(),
    banner: faker.image.url(),
    brandId: brandId ?? null,
    content: faker.word.words(50),
    cover: faker.image.url(),
    imageBy: faker.internet.userName(),
    tags: faker.helpers.arrayElements(tagIds, { min: 1, max: 5 }),
    isFeatured: faker.datatype.boolean(),
    metaDescription: faker.word.words(10),
    metaKeywords: faker.word.words(10),
    status: faker.helpers.enumValue(ArticleStatus),
    createdAt: faker.date.anytime(),
    updatedAt: faker.date.anytime(),
  };
};

const generateFakeBrand = (): Brand => {
  return {
    id: generateUniqueID(),
    name: faker.company.name(),
    banner: faker.image.url(),
    logo: faker.image.avatar(),
    description: faker.word.words(10),
    igUsername: faker.internet.userName(),
    website: faker.internet.url(),
    createdAt: faker.date.anytime(),
    updatedAt: faker.date.anytime(),
  };
};

const generateFakeNote = (categoryId: bigint): Note => {
  return {
    id: generateUniqueID(),
    name: faker.word.words(3),
    description: faker.word.words(10),
    popularityCount: faker.number.int(),
    categoryId,
    icon: faker.image.url(),
    cover: faker.image.url(),
    createdAt: faker.date.anytime(),
    updatedAt: faker.date.anytime(),
  };
};

const generateFakeNoteCategory = (): NoteCategory => {
  return {
    id: generateUniqueID(),
    name: faker.word.words(3),
    description: faker.word.words(10),
    cover: faker.image.url(),
    color: faker.internet.color().slice(1),
    shade: faker.internet.color().slice(1),
    createdAt: faker.date.anytime(),
    updatedAt: faker.date.anytime(),
  };
};

const generateFakePerfume = (brandId: bigint, noteIds: bigint[]): Perfume => {
  const randomDate = faker.date.anytime();
  const releaseDate = format(randomDate, 'dd/MM/yyyy');
  const isWithUncategorizedNotes = faker.datatype.boolean();

  const baseNotes = faker.helpers.arrayElements(noteIds, { min: 1, max: 3 });
  const middleNotes = faker.helpers.arrayElements(noteIds, { min: 3, max: 5 });
  const topNotes = faker.helpers.arrayElements(noteIds, { min: 3, max: 6 });
  const uncategorizedNotes = faker.helpers.arrayElements(noteIds, {
    min: 6,
    max: 10,
  });

  return {
    id: generateUniqueID(),
    name: faker.company.name(),
    description: faker.word.words(10),
    gender: faker.helpers.enumValue(Gender),
    occasion: faker.helpers.enumValue(Occasion),
    type: faker.helpers.enumValue(PerfumeType),
    variants: faker.helpers.arrayElements(
      [{ label: faker.word.words(3), thumbnail: faker.image.url() }],
      { min: 1, max: 3 },
    ),
    brandId,
    baseNotes: isWithUncategorizedNotes ? null : baseNotes,
    middleNotes: isWithUncategorizedNotes ? null : middleNotes,
    topNotes: isWithUncategorizedNotes ? null : topNotes,
    uncategorizedNotes: isWithUncategorizedNotes ? uncategorizedNotes : null,
    isBpomCertified: faker.datatype.boolean(),
    isFeatured: faker.datatype.boolean(),
    isHalal: faker.datatype.boolean(),
    price: faker.number.int({ min: 1, max: 5 }),
    releaseDate,
    likeCount: faker.number.int({ min: 0, max: 100 }),
    viewCount: faker.number.int({ min: 0, max: 10000 }),
    createdAt: faker.date.anytime(),
    updatedAt: faker.date.anytime(),
  };
};

// const generateFakePerfumeNote = (
//   perfumeId: bigint,
//   noteId: bigint,
// ): PerfumeNote => {
//   const withPerfumeAlias = faker.datatype.boolean();

//   return {
//     id: generateUniqueID(),
//     fragrancePyramid: faker.helpers.enumValue(FragrancePyramid),
//     noteId,
//     perfumeId,
//     noteAlias: withPerfumeAlias ? `Alias ${faker.word.adjective()}` : null,
//     createdAt: faker.date.anytime(),
//     updatedAt: faker.date.anytime(),
//   };
// };

const generateFakePerfumeNoteAlias = (
  perfumeId: bigint,
  noteId: bigint,
): PerfumeNoteAlias => {
  return {
    id: generateUniqueID(),
    noteId,
    perfumeId,
    noteAlias: `Alias ${faker.word.adjective()}`,
    createdAt: faker.date.anytime(),
    updatedAt: faker.date.anytime(),
  };
};

const generateFakePerfumeReview = (
  perfumeId: bigint,
  userId: bigint,
): PerfumeReview => {
  return {
    id: generateUniqueID(),
    comment: faker.word.words(10),
    rating: faker.number.int({ min: 1, max: 5 }),
    perfumeId,
    userId,
    createdAt: faker.date.anytime(),
    updatedAt: faker.date.anytime(),
  };
};

const generateFakeData = (amount: number) => {
  if (amount > 100) throw new Error('Amount is max 100.');

  const _ar = Array.from({ length: amount });

  const promotions = _ar.map(() => generateFakePromotion());
  const brands = _ar.map(() => generateFakeBrand());
  const noteCategories = _ar.map(() => generateFakeNoteCategory());
  const tags = _ar.map(() => generateFakeTag());
  const tagIds: bigint[] = tags.map((tag) => tag.id);
  const users = _ar.map((_, idx) => generateFakeUser(idx === 0));

  const notes: Note[] = [];
  noteCategories.forEach((v) =>
    _ar.forEach(() => notes.push(generateFakeNote(v.id))),
  );
  const noteIds: bigint[] = notes.map((note) => note.id);

  const userFavoritedNotes: UserFavoritedNote[] = [];
  users.forEach((u) =>
    notes.forEach((n) =>
      userFavoritedNotes.push(generateFakeUserFavoritedNote(n.id, u.id)),
    ),
  );

  const perfumes: Perfume[] = [];
  brands.forEach((v) =>
    _ar.forEach(() => perfumes.push(generateFakePerfume(v.id, noteIds))),
  );
  const userLikedPerfumes: UserLikedPerfume[] = [];
  users.forEach((u) =>
    perfumes.forEach((p) =>
      userLikedPerfumes.push(generateFakeUserLikedPerfume(p.id, u.id)),
    ),
  );
  const perfumeNoteAliases: PerfumeNoteAlias[] = [];
  notes.forEach((n) =>
    perfumes.forEach((p) =>
      perfumeNoteAliases.push(generateFakePerfumeNoteAlias(p.id, n.id)),
    ),
  );
  const perfumeReviews: PerfumeReview[] = [];
  users.forEach((u) =>
    perfumes.forEach((p) =>
      perfumeReviews.push(generateFakePerfumeReview(p.id, u.id)),
    ),
  );

  const articles = _ar.map(() => {
    const withBrandId = faker.datatype.boolean();
    const randBrandIdx = faker.number.int({ min: 0, max: brands.length - 1 });

    if (withBrandId)
      return generateFakeArticle(tagIds, brands[randBrandIdx]?.id);

    return generateFakeArticle(tagIds);
  });

  return {
    promotions,
    brands,
    noteCategories,
    tags,
    users,
    userFavoritedNotes,
    userLikedPerfumes,
    notes,
    perfumes,
    perfumeNoteAliases,
    perfumeReviews,
    articles,
  };
};

export default generateFakeData;
