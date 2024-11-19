import { recreateDB } from './recreate.js';
import { migrateDB } from './migration.js';

await recreateDB();
await migrateDB();
process.exit(1);
