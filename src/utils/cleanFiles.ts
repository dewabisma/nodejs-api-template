import { unlink } from 'fs/promises';
import path from 'path';
import logger from '../loaders/logger.js';

const deleteStaticFiles = async (filePaths: string[]) => {
  const publicPath = path.join(path.resolve(), 'public');

  for (let i = 0; i < filePaths.length; i++) {
    const filePath = `${publicPath}${filePaths[i]}`;

    try {
      await unlink(filePath);
    } catch (error) {
      logger.error(error);
    }
  }
};

const deleteUnusedAssets = async (
  paths: { oldFilePath?: string | null; newFilePath?: string | null }[],
) => {
  logger.info(
    'Check if any asset change happen, add the old one to delete file path if changed.',
  );

  const toDeleteFilePaths: string[] = [];

  paths.forEach((path) => {
    if (
      path.newFilePath &&
      path.oldFilePath &&
      path.oldFilePath !== path.newFilePath
    ) {
      const sliceIndex = path.oldFilePath.indexOf('/images');
      toDeleteFilePaths.push(path.oldFilePath.slice(sliceIndex));
    }
  });

  if (toDeleteFilePaths.length > 0) await deleteStaticFiles(toDeleteFilePaths);
  logger.info('Finish handling any asset change.');
};

export { deleteStaticFiles, deleteUnusedAssets };
