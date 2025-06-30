import 'regenerator-runtime/runtime';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import logger from '../../../../utils/logger.js';
import { extractExistingProperties, parseInteger, response } from '../../../../utils/helpers.js';
import { DEFAULT_LIMIT } from '../../../../utils/constants/pagination.js';
import { BLOG_POST_TYPE_NAME } from '../../../../utils/constants/posts.js';
import { queryItems } from '../../../modules/dynamoDB.js';

const { BLOG_POSTS_TABLE_NAME } = process.env;

// eslint-disable-next-line import/prefer-default-export
export const handler = async (event) => {
  try {
    logger.info({ event }, 'Payload!');

    const { queryStringParameters } = event;

    const paginationDetails = extractExistingProperties(
      queryStringParameters,
      ['limit', 'pointer'],
    );

    logger.debug({ paginationDetails }, 'Pagination details');

    const { limit, pointer } = paginationDetails;

    const params = {
      TableName: BLOG_POSTS_TABLE_NAME,
      KeyConditionExpression: '#tp=:tp',
      ExpressionAttributeNames: {
        '#tp': 'type',
      },
      ExpressionAttributeValues: {
        ':tp': { S: BLOG_POST_TYPE_NAME },
      },
      ProjectionExpression: 'id, title, short_description, thumbnail, content, createdAt, slug, keywords',
      Limit: parseInteger(limit) ?? DEFAULT_LIMIT,
      ScanIndexForward: false,
      ExclusiveStartKey: undefined,
    };

    if (pointer) {
      params.ExclusiveStartKey = { id: { S: pointer }, type: { S: BLOG_POST_TYPE_NAME } };
    }

    const blogPosts = await queryItems(params);
    const { Items, LastEvaluatedKey, ...restMetaData } = blogPosts;

    logger.debug({ blogPosts }, 'Blog posts');

    const pagination = {
      pointer: LastEvaluatedKey,
    };

    return response(200, {
      data: {
        blogPosts: Items?.map((v) => unmarshall(v)),
      },
      _meta: {
        pagination,
        ...restMetaData,
      },
    });
  } catch (e) {
    logger.error(e, 'Internal Server Error!!!');
    return response(500, {
      error: 'Internal Server Error!!!',
    });
  }
};
