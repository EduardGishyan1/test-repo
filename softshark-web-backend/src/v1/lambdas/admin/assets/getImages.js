import 'regenerator-runtime/runtime';
// utils
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import logger from '../../../../utils/logger.js';
import { parseInteger, response } from '../../../../utils/helpers.js';
// aws

// env
const {
  ASSETS_BUCKET,
  ASSETS_BUCKET_IMAGES_FOLDER,
} = process.env;

const s3 = new S3Client({});
export const handler = async (event) => {
  try {
    logger.info({ event }, 'Payload!');

    const { queryStringParameters } = event;

    let { limit, pointer } = { ...queryStringParameters };
    limit = parseInteger(limit) ?? 9;

    const params = {
      Bucket: ASSETS_BUCKET,
      Prefix: `${ASSETS_BUCKET_IMAGES_FOLDER}/`,
      MaxKeys: limit,
    };

    if (pointer) {
      params.ContinuationToken = decodeURIComponent(pointer);
    }

    logger.debug({ params }, 'Image list params');

    // const imageList = await s3.listObjectsV2(params).promise();
    const command = new ListObjectsV2Command(params);
    const imageList = await s3.send(command);

    logger.debug({ imageList }, 'Image list');

    let keys = [];
    const { Contents, NextContinuationToken, IsTruncated } = imageList;
    if (Contents?.length && Contents.length > 0) {
      keys = Contents.map((s3Object) => s3Object.Key);
    }

    const pagination = {
      pointer: NextContinuationToken,
      hasMore: IsTruncated,
    };

    return response(200, {
      data: {
        keys,
      },
      _meta: {
        pagination,
      },
    });
  } catch (e) {
    logger.error(e);
    return response(500, {
      error: 'Internal Server Error!!!',
    });
  }
};
