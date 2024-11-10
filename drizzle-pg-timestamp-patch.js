import fs from 'fs';
import path from 'path';

const filesToModify = [
  'node_modules/drizzle-orm/pg-core/columns/timestamp.js',
  'node_modules/drizzle-orm/pg-core/columns/timestamp.cjs',
];

const __dirname = path.resolve();

filesToModify.forEach((file) => {
  const filePath = path.join(__dirname, file);
  console.log(`Checking path: ${filePath}`);

  if (fs.existsSync(filePath)) {
    let fileContent = fs.readFileSync(filePath, 'utf8');
    fileContent = fileContent.replace(
      'return value.toISOString()',
      `if(Object.prototype.hasOwnProperty.call(value, "toISOString")) return value.toISOString()
      
    return value`,
    );
    fs.writeFileSync(filePath, fileContent, 'utf8');
    console.log(`Modified: ${file}`);
  } else {
    console.error(`File not found: ${filePath}`);
  }
});
