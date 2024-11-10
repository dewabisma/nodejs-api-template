import { readFile, writeFile } from 'fs/promises';
import { Blob } from 'buffer';

const readJsonFile = async <T>(path: string) => {
  try {
    const buffer = await readFile(path, {
      encoding: 'utf-8',
    });
    const file = JSON.parse(buffer);

    return file as Promise<T>;
  } catch (error) {
    console.error(error);
    throw new Error('Path does not exist');
  }
};

const writeJsonFile = async (path: string, content: any) => {
  try {
    const stringified = JSON.stringify(content);

    await writeFile(path, stringified);
  } catch (error) {
    console.error(error);
    throw new Error('Failed writing file.');
  }
};

const readFileAsBlob = async (path: string) => {
  try {
    const buffer = await readFile(path);
    const blob = new Blob([buffer]);

    return blob;
  } catch (error) {
    console.error(error);
    throw new Error('Path does not exist');
  }
};

const readHTMLFile = async (path: string) => {
  try {
    const template = await readFile(path, { encoding: 'utf8' });

    return template;
  } catch (error) {
    console.error(error);
    throw new Error('Path does not exist');
  }
};

export { readJsonFile, readFileAsBlob, readHTMLFile, writeJsonFile };
