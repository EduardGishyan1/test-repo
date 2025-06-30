import 'regenerator-runtime/runtime';
import { v4 as uuidv4 } from 'uuid';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { response } from '../../../../utils/helpers.js';

// utils
import logger from '../../../../utils/logger.js';

const s3 = new S3Client({});

// env
const { ASSETS_BUCKET } = process.env;

// eslint-disable-next-line import/prefer-default-export
export const handler = async (event) => {
  try {
    logger.info({ event }, 'Payload!');

    const ext = event.queryStringParameters?.ext;

    let key = `images/${`${10 ** 20 - Date.now()}_${uuidv4()}`}`;
    if (ext) key += `.${ext}`;

    const params = {
      ACL: 'public-read',
      ContentType: 'binary/octet-stream',
      Bucket: ASSETS_BUCKET,
      Key: key,
    };

    logger.debug({ params }, 'SignedUrl Params');

    const command = new PutObjectCommand(params);
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 }); // expires in seconds

    logger.debug({ url }, 'Image url');

    return response(200, {
      data: {
        url,
        key,
      },
    });
  } catch (e) {
    logger.error(e, 'Internal Server Error!!!');
    return response(500, {
      error: 'Internal Server Error!!!',
    });
  }
};
