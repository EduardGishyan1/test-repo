import 'regenerator-runtime/runtime';
import { v4 as uuidv4 } from 'uuid';
// validation
import { unmarshall } from '@aws-sdk/util-dynamodb';
import jobPostingValidation from '../../../../utils/validation/jobPostingValidation.js';
import { extractExistingProperties, response } from '../../../../utils/helpers.js';
import { createItem } from '../../../modules/dynamoDB.js';
import logger from '../../../../utils/logger.js';
import { JOB_POSTING_TYPE_NAME } from '../../../../utils/constants/posts.js';

// env
const { JOB_POSTINGS_TABLE_NAME } = process.env;

// eslint-disable-next-line import/prefer-default-export
export const handler = async (event) => {
  try {
    logger.info({ event }, 'Payload!');

    const username = event.requestContext?.authorizer?.claims?.['cognito:username'];

    if (!event.body) {
      return response(400, {
        error: 'Provide a JSON body',
      });
    }

    let body;

    try {
      body = JSON.parse(event.body);
    } catch (e) {
      return response(400, {
        error: 'Provide a valid JSON body',
      });
    }

    const jobPostingDetails = extractExistingProperties(
      body,
      ['title', 'description', 'deadline', 'seniority', 'slug'],
    );

    // validation
    const { error } = jobPostingValidation.validate(jobPostingDetails);

    if (error) {
      const { details: [{ message }] } = error;
      return response(400, {
        error: message,
      });
    }

    const createdAt = new Date().toISOString();

    logger.debug({ jobPostingDetails }, 'Details of the blog post we\'ll create');

    const params = {
      TableName: JOB_POSTINGS_TABLE_NAME,
      Item: {
        title: { S: jobPostingDetails.title },
        description: { S: jobPostingDetails.description },
        deadline: { S: jobPostingDetails.deadline },
        seniority: { S: jobPostingDetails.seniority },
        slug: { S: jobPostingDetails.slug },
        id: { S: createdAt + uuidv4() },
        type: { S: JOB_POSTING_TYPE_NAME },
        published: { BOOL: false },
        createdBy: { S: username },
        createdAt: { S: createdAt },
        updatedAt: { S: createdAt },
      },
    };
    const { Item: Attributes } = params;

    const jobPosting = await createItem(params);

    logger.debug({ jobPosting }, 'Newly created job posting');

    return response(200, {
      data: unmarshall(Attributes),
    });
  } catch (e) {
    logger.error(e, 'Internal Server Error!!!');
    return response(500, {
      error: 'Internal Server Error!!!',
    });
  }
};
