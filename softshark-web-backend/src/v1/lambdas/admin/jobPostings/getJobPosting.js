import 'regenerator-runtime/runtime';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { JOB_POSTING_TYPE_NAME } from '../../../../utils/constants/posts.js';

import { response } from '../../../../utils/helpers.js';
import logger from '../../../../utils/logger.js';
import { getItem } from '../../../modules/dynamoDB.js';

// env
const { JOB_POSTINGS_TABLE_NAME } = process.env;

export const handler = async (event) => {
  try {
    logger.info({ event }, 'Payload!');

    const { pathParameters: { id } } = event;

    if (!id) {
      return response(400, {
        error: 'Provide an id',
      });
    }

    logger.debug({ id }, 'Id of blog post we want to find');

    const params = {
      TableName: JOB_POSTINGS_TABLE_NAME,
      Key: {
        id: { S: id },
        type: { S: JOB_POSTING_TYPE_NAME },
      },
      ProjectionExpression: 'id, title, description, deadline, seniority, slug',
    };

    const result = await getItem(params);
    const Item = unmarshall(result.Item);

    logger.debug({ result }, 'Job posting which we found');

    if (!Item) {
      return response(400, {
        error: 'Job posting with the given id not found',
      });
    }

    return response(200, {
      data: Item,
    });
  } catch (e) {
    logger.error(e, 'Internal Server Error!!!');
    return response(500, {
      error: 'Internal Server Error!!!',
    });
  }
};
