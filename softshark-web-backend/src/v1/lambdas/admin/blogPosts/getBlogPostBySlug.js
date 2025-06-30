import 'regenerator-runtime/runtime';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import logger from '../../../../utils/logger.js';
import { response } from '../../../../utils/helpers.js';
import { queryItems } from '../../../modules/dynamoDB.js';
import { BLOG_POST_TYPE_NAME } from '../../../../utils/constants/posts.js';

const { BLOG_POSTS_TABLE_NAME } = process.env;

// eslint-disable-next-line import/prefer-default-export
export const handler = async (event) => {
  try {
    logger.info({ event }, 'Payload!');

    const slug = event.pathParameters?.slug;

    if (!slug) {
      return response(400, {
        error: 'Provide an slug',
      });
    }

    logger.debug({ slug }, 'Slug of blog post we want to find');

    const params = {
      TableName: BLOG_POSTS_TABLE_NAME,
      IndexName: 'slug-index',
      KeyConditions: {
        slug: {
          ComparisonOperator: 'EQ',
          AttributeValueList: [{
            S: slug,
          }],
        },
      },
    };

    const result = await queryItems(params);
    const { Items } = result;

    logger.debug({ Items }, 'Blog post which we found');

    if (!Items) {
      return response(404, {
        error: 'Blog post not found',
      });
    }

    return response(200, {
      data: {
        blogPost: Items?.map((v) => unmarshall(v)),
      },
    });
  } catch (e) {
    logger.error(e, 'Internal Server Error!!!');
    return response(500, {
      error: 'Internal Server Error!!!',
    });
  }
};
