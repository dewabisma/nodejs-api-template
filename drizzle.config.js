import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './dist/src/models/index.js',
  out: './src/models/migration',
  verbose: true,
  strict: true,
});
