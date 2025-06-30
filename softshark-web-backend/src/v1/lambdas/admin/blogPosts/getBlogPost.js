import 'regenerator-runtime/runtime';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import logger from '../../../../utils/logger.js';
import { response } from '../../../../utils/helpers.js';
import { getItem } from '../../../modules/dynamoDB.js';
import { BLOG_POST_TYPE_NAME } from '../../../../utils/constants/posts.js';

const { BLOG_POSTS_TABLE_NAME } = process.env;

export const handler = async (event) => {
  try {
    logger.info({ event }, 'Payload!');

    const id = event.pathParameters?.id;

    if (!id) {
      return response(400, {
        error: 'Provide an id',
      });
    }

    logger.debug({ id }, 'Id of blog post we want to find');

    const params = {
      TableName: BLOG_POSTS_TABLE_NAME,
      Key: {
        id: { S: id },
        type: { S: BLOG_POST_TYPE_NAME },
      },
    };
    const result = await getItem(params);
    const Item = unmarshall(result.Item);

    logger.debug({ Item }, 'Blog post which we found');

    if (!Item) {
      return response(404, {
        error: 'Blog post not found',
      });
    }

    return response(200, {
      data: {
        blogPost: Item,
      },
    });
  } catch (e) {
    logger.error(e, 'Internal Server Error!!!');
    return response(500, {
      error: 'Internal Server Error!!!',
    });
  }
};
