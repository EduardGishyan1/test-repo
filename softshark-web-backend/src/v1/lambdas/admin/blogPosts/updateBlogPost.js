import 'regenerator-runtime/runtime';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { updateBlogPostSchema } from '../../../../utils/validation/blogPostValidationSchemas.js';
import logger from '../../../../utils/logger.js';
import { extractExistingProperties, response } from '../../../../utils/helpers.js';
import { getItem, updateItem } from '../../../modules/dynamoDB.js';
import { BLOG_POST_TYPE_NAME } from '../../../../utils/constants/posts.js';

const { BLOG_POSTS_TABLE_NAME } = process.env;

export const handler = async (event) => {
  try {
    logger.info({ event }, 'Payload!');

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

    const id = event.pathParameters?.id;

    if (!id) {
      return response(400, {
        error: 'Provide an id',
      });
    }

    logger.debug({ id }, 'Id of blog post we want to find and then update');

    const params = {
      TableName: BLOG_POSTS_TABLE_NAME,
      Key: {
        id: { S: id },
        type: { S: BLOG_POST_TYPE_NAME },
      },
    };
    const blogPost = await getItem(params);
    const Item = unmarshall(blogPost.Item);

    logger.debug({ blogPost }, 'Blog post which we found');

    if (!Item) {
      return response(404, {
        error: `Blog post not found ${id}`,
      });
    }

    const newValues = extractExistingProperties(
      body,
      ['title', 'short_description', 'thumbnail', 'content', 'slug', 'keywords'],
    );

    const { error } = updateBlogPostSchema.validate(newValues);

    if (error) {
      const { details: [{ message }] } = error;
      return response(400, {
        error: message,
      });
    }

    const updatedAt = new Date().toISOString();

    const title = newValues.title ? newValues.title : Item.title;
    const short_description = newValues.short_description ?
      newValues.short_description : Item.short_description;
    const thumbnail = newValues.thumbnail ? newValues.thumbnail : Item.thumbnail;
    const content = newValues.content ? newValues.content : Item.content;
    const keywords = newValues.keywords ? newValues.keywords : Item.keywords;
    const { createdAt } = Item;
    const slug = title.toLowerCase().replace(/[&/\\#, +()$~%.'":*?<>{}]/g, ' ')
      .split(' ')
      .join('-')
      .replace(/-+/g, ' ')
      .split(' ')
      .join('-')
      .replace(/-+$/, '');

    await updateItem({
      TableName: BLOG_POSTS_TABLE_NAME,
      Item: {
        id: { S: id },
        type: { S: BLOG_POST_TYPE_NAME },
        title: { S: title },
        short_description: { S: short_description },
        thumbnail: { S: thumbnail },
        content: { S: content },
        keywords: { S: keywords },
        slug: { S: slug },
        createdAt: { S: createdAt },
        updatedAt: { S: updatedAt },
      },
      ReturnValues: 'ALL_OLD',
    });

    return response(200, {
      data: {
        updatedBlogPost: {
          id,
          type: BLOG_POST_TYPE_NAME,
          title,
          short_description,
          thumbnail,
          content,
          keywords,
          slug,
          createdAt,
          updatedAt,
        },
      },
    });
  } catch (e) {
    logger.error(e, 'Internal Server Error!!!');
    return response(500, {
      error: 'Internal Server Error!!!',
    });
  }
};
