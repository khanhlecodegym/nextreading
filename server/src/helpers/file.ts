import fs from 'fs';
import * as path from 'path';
import * as AWS from 'aws-sdk';
import multer from 'multer';
import sharp from 'sharp';

// S3 env
import { S3_BUCKET, S3_KEY, S3_SECRET } from '../configs';

// Helpers
import { logger } from './logger';

// Constants
import { ENTITY } from '../constants/entity';

sharp.cache(false);

// Local constants
const IMG_EXT = ['jpg', 'jpeg', 'png'];

interface S3FileType {
  ETag: string;
  Location: string;
  key: string;
  Key: string;
  Bucket: string;
}

const s3bucket = new AWS.S3({
  accessKeyId: S3_KEY,
  secretAccessKey: S3_SECRET,
});

const uploadToS3 = (
  dir: string,
  folderName: string,
  fileName: string,
): Promise<any> => {
  const readStream = fs.createReadStream(dir + '/' + fileName);

  const params = {
    Bucket: S3_BUCKET,
    Key: `${folderName}/${fileName}`,
    Body: readStream,
  };

  return new Promise((resolve, reject) => {
    s3bucket.upload(params, (err, data) => {
      readStream.destroy();

      if (err) {
        return reject(err);
      }

      return resolve(data);
    });
  });
};

const deleteS3Img = (
  folderName: string,
  fileName: string,
): Promise<any> => {
  const params = {
    Bucket: S3_BUCKET,
    Key: `${folderName}/${fileName}`,
  };

  return new Promise((resolve, reject) => {
    return s3bucket.deleteObject(params, (err, data) => {
      if (err) {
        logger(`Delete S3 image error: ${folderName}/${fileName}`);

        return reject(err);
      }

      return resolve(data);
    });
  });
};

export const createFolder = (dir: string) => {
  return fs.promises.mkdir(dir, { recursive: true }).catch(error => {
    logger(`createFolder mkdir error, dir path: ${dir}`);
    logger(error.message);
  }).then(() => {
    // Create index file empty content
    return fs.writeFileSync(
      dir + '_index.md',
      '',
      { encoding: 'utf8', flag: 'w' },
    );
  });
};

// Write file content
export const writeFile = (
  dir: string,
  fileName: string,
  content: any,
) => {
  // Create parent(s) dir if it not exist
  // fs.promises.mkdir(dir, { recursive: true }).catch(error => {
  //   console.log('mkdir error, dir path: ', dir);
  //   console.log('error: ', error.message);
  // });
  return new Promise((resolve, reject) => {
    try {
      // Create file content
      fs.writeFileSync(
        dir + fileName,
        content,
        { encoding: 'utf8', flag: 'w' },
      );

      resolve(true);
    } catch (err) {
      reject({ message: 'Write file has error' });
    }
  });
};

const convertImage = (
  imgPath: string,
  toFile: string,
  entity: string,
  isWebP: boolean = false,
) => {
  let imgSize = 200;

  switch (entity) {
    case ENTITY.BOOK:
      imgSize = 200;
      break;

    case ENTITY.AUTHOR:
    case ENTITY.USER:
      imgSize = 200;
      break;
  }

  if (isWebP) {
    return sharp(imgPath)
      .resize(imgSize)
      .webp({ quality: 80 })
      .toFile(toFile)
      .then(() => true);
  }

  return sharp(imgPath)
    .resize(imgSize)
    .jpeg({ quality: 100 })
    .toFile(toFile)
    .then(() => true);
};

const formatImages = (
  dir: string,
  fileName: string,
  entity: string,
  originalName: string,
) => {
  const fileExtension = originalName.split('.').pop();
  const imgPath = `${dir}/${originalName}`;

  return new Promise((resolve, reject) => {
    if (IMG_EXT.indexOf(fileExtension) !== -1) {
      const jpgConvertPath = dir + '/' + fileName + '.jpg';
      const webpConvertPath = dir + '/' + fileName + '.webp';

      return Promise.all([
        convertImage(imgPath, jpgConvertPath, entity),
        convertImage(imgPath, webpConvertPath, entity, true),
      ]).then(() => resolve(true));
    } else {
      return reject({ message: 'Wrong image format' });
    }
  });
};

const maxSize = 4 * 1024 * 1024;
const diskStorageToUploads = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, __dirname + '/');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
// Save image to local
export const saveToUploads = multer({
  storage: diskStorageToUploads,
  limits: { fileSize: maxSize },
}).single('file');

export const uploadImage = (
  entity: string, // Use for folderName
  fileName: string,
  originalName: string,
) => {
  const folderPath = path.join(__dirname);
  return formatImages(folderPath, fileName, entity, originalName).then(() => {
    return Promise.all([
      uploadToS3(folderPath, entity, `${fileName}.jpg`).then(data => data),
      uploadToS3(folderPath, entity, `${fileName}.webp`).then(data => data),
    ]).then((imgs: S3FileType[]) => {
      // Remove images after upload
      fs.unlink(`${folderPath}/${originalName}`, () => true);
      fs.unlink(`${folderPath}/${fileName}.jpg`, () => true);
      fs.unlink(`${folderPath}/${fileName}.webp`, () => true);

      // Only need to get jpg url
      return imgs[0].Location;
    });
  })
  .then((imgUrl: string) => imgUrl)
  .catch(errFormat => {
    throw new Error(errFormat.message);
  });
};

export const removeImage = (
  entity: string, // Use for folderName
  id: string,
) => {
  return Promise.all([
    deleteS3Img(entity, `${id}.jpg`),
    deleteS3Img(entity, `${id}.webp`),
  ])
  .catch(errFormat => errFormat.message);
};
