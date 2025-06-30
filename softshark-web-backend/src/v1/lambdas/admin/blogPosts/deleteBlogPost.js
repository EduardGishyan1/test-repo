import 'regenerator-runtime/runtime';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import logger from '../../../../utils/logger.js';
import { response } from '../../../../utils/helpers.js';
import { deleteItem } from '../../../modules/dynamoDB.js';
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

    logger.debug({ id }, 'Id of the blog post we want to delete');

    const params = {
      TableName: BLOG_POSTS_TABLE_NAME,
      Key: {
        id: { S: id },
        type: { S: BLOG_POST_TYPE_NAME },
      },
      ReturnValues: 'ALL_OLD',
    };

    const result = await deleteItem(params);
    const Attributes = unmarshall(result.Attributes);

    logger.debug({ deletedBlogPost: Attributes }, 'The blog post we just deleted');

    return response(200, {
      data: {
        deletedBlogPost: Attributes,
      },
    });
  } catch (e) {
    logger.error(e, 'Internal Server Error!!!');
    return response(500, {
      error: 'Internal Server Error!!!',
    });
  }
};
