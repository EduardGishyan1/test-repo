import 'regenerator-runtime/runtime';

import { v4 as uuidv4 } from 'uuid';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { createBlogPostSchema } from '../../../../utils/validation/blogPostValidationSchemas.js';
import logger from '../../../../utils/logger.js';
import { extractExistingProperties, response } from '../../../../utils/helpers.js';
import { createItem } from '../../../modules/dynamoDB.js';
import { BLOG_POST_TYPE_NAME } from '../../../../utils/constants/posts.js';

const { BLOG_POSTS_TABLE_NAME } = process.env;

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

    const blogPostDetails = extractExistingProperties(
      body,
      ['title', 'short_description', 'thumbnail', 'content', 'keywords'],
    );

    const { error } = createBlogPostSchema.validate(blogPostDetails);

    if (error) {
      const { details: [{ message }] } = error;
      return response(400, {
        error: message,
      });
    }

    const createdAt = new Date().toISOString();

    const slug = blogPostDetails.title.toLowerCase().replace(/[&/\\#, +()$~%.'":*?<>{}]/g, ' ')
      .split(' ')
      .join('-')
      .replace(/-+/g, ' ')
      .split(' ')
      .join('-')
      .replace(/-+$/, '');

    const params = {
      TableName: BLOG_POSTS_TABLE_NAME,
      Item: {
        title: { S: blogPostDetails.title },
        short_description: { S: blogPostDetails.short_description },
        thumbnail: { S: blogPostDetails.thumbnail },
        content: { S: blogPostDetails.content },
        createdBy: { S: username },
        id: { S: createdAt + uuidv4() },
        slug: { S: slug },
        keywords: { S: blogPostDetails.keywords },
        type: { S: BLOG_POST_TYPE_NAME },
        createdAt: { S: createdAt },
        updatedAt: { S: createdAt },
      },
    };
    const blogPost = await createItem(params);
    const { Item: Attributes } = params;

    logger.debug({ blogPost }, 'Newly created blog post');

    return response(200, {
      data: {
        blogPost: unmarshall(Attributes),
      },
    });
  } catch (e) {
    logger.error(e, 'Internal Server Error!!!');
    return response(500, {
      error: 'Internal Server Error!!!',
    });
  }
};
