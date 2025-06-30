import 'regenerator-runtime/runtime';

// utils
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import logger from '../../../../utils/logger.js';
import { response } from '../../../../utils/helpers.js';
// aws
const s3 = new S3Client({});

// env
const { ASSETS_BUCKET } = process.env;

export const handler = async (event) => {
  try {
    logger.info({ event }, 'Payload!');

    let { pathParameters: { key } } = event;

    key = decodeURIComponent(key);

    const params = {
      Bucket: ASSETS_BUCKET,
      Key: key,
    };

    logger.debug({ params }, 'Image deletion details');

    const command = new DeleteObjectCommand(params);
    const deletedImage = await s3.send(command);

    logger.debug({ deletedImage }, 'Deleted image');

    console.log(deletedImage);
    return response(200, {
      data: {
        deletedImage,
      },
    });
  } catch (e) {
    logger.error(e, 'Internal Server Error!!!');
    return response(500, {
      error: 'Internal Server Error!!!',
    });
  }
};
