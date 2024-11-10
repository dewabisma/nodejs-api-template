import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

import env from '../../config/index.js';
import * as schemas from '../../models/index.js';
import logger from '../../loaders/logger.js';
import generateFakeData from '../../seeder/generateFakeData.js';

export const seedDB = async () => {
  logger.info('Seeding DB');

  const client = new pg.Client({
    connectionString: env.databaseURI,
  });

  await client.connect();

  const db = drizzle(client, { schema: schemas });

  /**
   * Be care ful setting the amount. Max should be 100. Because it will result in too big of data.
   */
  const seedData = generateFakeData(10);

  logger.info('Seeding base tables');

  // Base Table
  await Promise.all([
    db.insert(schemas.users).values(seedData.users),
    db.insert(schemas.brands).values(seedData.brands),
    db.insert(schemas.promotions).values(seedData.promotions),
    db.insert(schemas.tags).values(seedData.tags),
    db.insert(schemas.noteCategories).values(seedData.noteCategories),
  ]);

  logger.info('Success seeding base tables');

  logger.info('Seeding dependence one tables');

  // Dependence One Table
  await Promise.all([
    db.insert(schemas.notes).values(seedData.notes),
    db.insert(schemas.perfumes).values(seedData.perfumes),
    db.insert(schemas.articles).values(seedData.articles),
  ]);

  logger.info('Success seeding dependence one tables');

  logger.info('Seeding dependence two tables');

  // Dependence Two Tables
  for (const perfumeNoteAlias of seedData.perfumeNoteAliases) {
    await db.insert(schemas.perfumeNoteAliases).values(perfumeNoteAlias);
  }
  for (const perfumeReview of seedData.perfumeReviews) {
    await db.insert(schemas.perfumeReviews).values(perfumeReview);
  }
  for (const favoritedNote of seedData.userFavoritedNotes) {
    await db.insert(schemas.userFavoritedNotes).values(favoritedNote);
  }
  for (const likedPerfume of seedData.userLikedPerfumes) {
    await db.insert(schemas.userLikedPerfumes).values(likedPerfume);
  }

  logger.info('Success seeding dependence two tables');

  logger.info('Success seeding DB');
};

if (process.argv[2] === '-start') {
  await seedDB();
  process.exit();
}
