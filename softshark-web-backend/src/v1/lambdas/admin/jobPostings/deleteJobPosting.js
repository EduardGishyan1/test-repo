import 'regenerator-runtime/runtime';
// helpers
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { response } from '../../../../utils/helpers.js';
import { deleteItem } from '../../../modules/dynamoDB.js';
import logger from '../../../../utils/logger.js';
import { JOB_POSTING_TYPE_NAME } from '../../../../utils/constants/posts.js';

// env
const { JOB_POSTINGS_TABLE_NAME } = process.env;

// eslint-disable-next-line import/prefer-default-export
export const handler = async (event) => {
  try {
    logger.info({ event }, 'Payload!');

    const { pathParameters: { id } } = event;

    if (!id) {
      return response(400, {
        error: 'Provide an id',
      });
    }

    logger.debug({ id }, 'Id of the job posting we want to delete');

    const params = {
      TableName: JOB_POSTINGS_TABLE_NAME,
      Key: {
        id: { S: id },
        type: { S: JOB_POSTING_TYPE_NAME },
      },
      ReturnValues: 'ALL_OLD',
    };

    const result = await deleteItem(params);
    const Attributes = unmarshall(result.Attributes);

    logger.debug({ deletedBlogPost: Attributes }, 'The job posting we just deleted');

    return response(200, {
      data: Attributes,
    });
  } catch (e) {
    logger.error(e, 'Internal Server Error!!!');
    return response(500, {
      error: 'Internal Server Error!!!',
    });
  }
};
