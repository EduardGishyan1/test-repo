import 'regenerator-runtime/runtime';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import logger from '../../../../utils/logger.js';
import { buildExpressionAttributeValues, buildUpdateExpression, extractExistingProperties, response } from '../../../../utils/helpers.js';
import { getItem, updateItem } from '../../../modules/dynamoDB';
import { JOB_POSTING_TYPE_NAME, MESSAGE_TYPE_NAME } from '../../../../utils/constants/posts.js';
import { updateJobPostingSchema } from '../../../../utils/validation/jobPostingValidation.js';

const { JOB_POSTINGS_TABLE_NAME } = process.env;

export const handler = async (event) => {
  try {
    logger.info({ event }, 'Payload!');

    let body;

    try {
      body = JSON.parse(event.body);
    } catch (e) {
      return response(400, {
        error: 'Provide a valid JSON body',
      });
    }

    const id = event.pathParameters?.id;

    if (!id) {
      return response(400, {
        error: 'Required parameter id is not provided',
      });
    }

    logger.debug({ id }, 'Id of job posting we want to update');

    const jobPosting = await getItem({
      TableName: JOB_POSTINGS_TABLE_NAME,
      Key: {
        id: { S: id },
        type: { S: JOB_POSTING_TYPE_NAME },
      },
    });

    const Item = unmarshall(jobPosting.Item);

    logger.debug({ jobPosting }, 'Job posting');

    if (!Item) {
      return response(404, {
        error: `Job posting not found ${id}`,
      });
    }

    const newValues = extractExistingProperties(
      body,
      ['title', 'description', 'deadline', 'seniority', 'slug', 'published'],
    );

    const { error } = updateJobPostingSchema.validate(newValues);

    if (error) {
      const { details: [{ message }] } = error;
      return response(400, {
        error: message,
      });
    }

    const updatedAt = new Date().toISOString();

    const title = newValues.title ? newValues.title : Item.title;
    const description = newValues.description ? newValues.description : Item.description;
    const deadline = newValues.deadline ? newValues.deadline : Item.deadline;
    const seniority = newValues.seniority ? newValues.seniority : Item.seniority;
    const slug = newValues.slug ? newValues.slug : Item.slug;
    const published = newValues.published ? newValues.published : Item.published;

    await updateItem({
      TableName: JOB_POSTINGS_TABLE_NAME,
      Item: {
        id: { S: id },
        type: { S: JOB_POSTING_TYPE_NAME },
        title: { S: title },
        description: { S: description },
        deadline: { S: deadline },
        seniority: { S: seniority },
        slug: { S: slug },
        published: { BOOL: published },
        updatedAt: { S: updatedAt },
      },
      ReturnValues: 'ALL_OLD',
    });

    return response(200, {
      data: {
        id,
        type: JOB_POSTING_TYPE_NAME,
        title,
        description,
        deadline,
        seniority,
        slug,
        published,
        updatedAt,
      },
    });
  } catch (e) {
    logger.error(e.message);
    return response(500, {
      error: e.message,
    });
  }
};
