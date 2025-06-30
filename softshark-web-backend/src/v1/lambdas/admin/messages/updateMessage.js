import 'regenerator-runtime/runtime';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import logger from '../../../../utils/logger.js';
import { response } from '../../../../utils/helpers.js';
import { getItem, updateItem } from '../../../modules/dynamoDB.js';
import { MESSAGE_TYPE_NAME } from '../../../../utils/constants/posts.js';

const { MESSAGES_TABLE_NAME } = process.env;

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

    logger.debug({ id }, "Message's id");

    const message = await getItem({
      TableName: MESSAGES_TABLE_NAME,
      Key: {
        id: { S: id },
        type: { S: MESSAGE_TYPE_NAME },
      },
    });
    const Item = unmarshall(message.Item);

    console.log(Item);
    logger.debug({ message }, 'Message');

    if (!Item) {
      return response(404, {
        error: `Message not found ${id}`,
      });
    }

    const { isSent } = body;

    const updatedAt = new Date().toISOString();

    await updateItem({
      TableName: MESSAGES_TABLE_NAME,
      Item: {
        id: { S: id },
        type: { S: MESSAGE_TYPE_NAME },
        isSent: { BOOL: isSent },
        updatedAt: { S: updatedAt },
        email: { S: Item.email },
        phone: { S: Item.phone },
        customer_name: { S: Item.customer_name },
        message: { S: Item.message },
        createdAt: { S: Item.createdAt },
      },
      ReturnValues: 'ALL_OLD',
    });

    return response(200, {
      data: {
        id,
        type: MESSAGE_TYPE_NAME,
        isSent,
        updatedAt,
        email: Item.email,
        phone: Item.phone,
        customer_name: Item.customer_name,
        message: Item.message,
        createdAt: Item.createdAt,
      },
    });
  } catch (e) {
    logger.error(e.message);
    return response(500, {
      error: e.message,
    });
  }
};
