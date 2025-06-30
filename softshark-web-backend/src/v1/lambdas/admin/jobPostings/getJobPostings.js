import 'regenerator-runtime/runtime';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import logger from '../../../../utils/logger.js';
import { extractExistingProperties, parseInteger, response } from '../../../../utils/helpers.js';
import { DEFAULT_LIMIT } from '../../../../utils/constants/pagination.js';
import { JOB_POSTING_TYPE_NAME } from '../../../../utils/constants/posts.js';
import { queryItems } from '../../../modules/dynamoDB.js';

// env
const { JOB_POSTINGS_TABLE_NAME } = process.env;

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
      TableName: JOB_POSTINGS_TABLE_NAME,
      KeyConditionExpression: '#tp=:tp',
      ExpressionAttributeNames: {
        '#tp': 'type',
      },
      ExpressionAttributeValues: {
        ':tp': { S: JOB_POSTING_TYPE_NAME },
      },
      ProjectionExpression: 'id, title, description, deadline, seniority, slug, published',
      Limit: parseInteger(limit) ?? DEFAULT_LIMIT,
      ScanIndexForward: false,
    };

    if (pointer) {
      params.ExclusiveStartKey = { id: { S: pointer }, type: { S: JOB_POSTING_TYPE_NAME } };
    }

    const jobPostings = await queryItems(params);
    const { Items, LastEvaluatedKey, ...restMetaData } = jobPostings;

    logger.debug({ jobPostings }, 'Job postings');

    const pagination = {
      pointer: LastEvaluatedKey,
    };

    return response(200, {
      data: Items?.map((v) => unmarshall(v)),
      _meta: {
        pagination,
        ...restMetaData,
      },
    });
  } catch (e) {
    logger.error(e.message);
    return response(500, {
      error: e.message,
    });
  }
};
