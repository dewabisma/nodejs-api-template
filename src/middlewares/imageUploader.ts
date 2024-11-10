import multer from 'multer';
import { slugifyFile } from '../utils/slugify.js';
import { customErrors } from '../loaders/customError.js';
import { MulterDiskCompressedStorage } from '../utils/multerCustomStorage.js';

/**
 * Create storage path for multer. By default it will save in public/images. You can add dir to categorize the image.
 *
 * @param dirPath - e.g. '/notes' or '/articles'
 * @returns multerStorage
 */
const setStorage = (dirPath: string = '') =>
  new MulterDiskCompressedStorage({
    destination: `public/images${dirPath}/`,
    filename(_, file, cb) {
      const slugified = slugifyFile(file.originalname);

      cb(null, `${slugified}.webp`);
    },
  });

const checkFileTypes = (
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const isFileAnImage = file.mimetype.includes('image');

  if (isFileAnImage) {
    cb(null, true);
    return;
  }

  const errMsg = new customErrors.BadRequestError('Image file only.');

  cb(errMsg);
};

/**
 * Create a upload middleware powered by multer. By default it will save in public/images. You can add dir to categorize the image.
 *
 * @param dirPath - e.g. '/notes' or '/articles'.
 * @param maxFileSize - in bytes. 10mb limit by default.
 *
 * @returns multerStorage
 */
const imageUploader = (dirPath: string = '', maxFileSize = 10 * 1024 * 1024) =>
  multer({
    storage: setStorage(dirPath),
    fileFilter: function (_, file, cb) {
      checkFileTypes(file, cb);
    },
    limits: {
      fileSize: maxFileSize,
    },
  });

export const searchBgUploader = multer({
  storage: new MulterDiskCompressedStorage({
    destination: `public/images/search/`,
    filename(req, _, cb) {
      const order = req.query.order as '1' | '2';

      cb(null, `background-${order}.webp`);
    },
  }),
  fileFilter: function (_, file, cb) {
    checkFileTypes(file, cb);
  },
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
}).single('image');

export default imageUploader;
