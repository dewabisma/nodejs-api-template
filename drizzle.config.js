import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './dist/src/modules/models.js',
  out: './src/migration',
  verbose: true,
  strict: true,
});
