import 'regenerator-runtime/runtime';
import { response } from '../../../../utils/helpers.js';
import { deleteItem } from '../../../modules/dynamoDB.js';
import logger from '../../../../utils/logger.js';
import { MESSAGE_TYPE_NAME } from '../../../../utils/constants/posts.js';
import {unmarshall} from "@aws-sdk/util-dynamodb";

// env
const { MESSAGES_TABLE_NAME } = process.env;

export const handler = async (event) => {
    try {
        const { pathParameters: { id } } = event;

        if (!id) {
            return response(400, {
                error: 'Required parameter id is not provided',
            });
        }

        logger.debug({ id }, 'Id of the message we want to delete');

        const params = {
            TableName: MESSAGES_TABLE_NAME,
            Key: {
                id: {S: id },
                type: {S: MESSAGE_TYPE_NAME }
            },
            ReturnValues: 'ALL_OLD',
        };

        const result = await deleteItem(params);
        const Attributes = unmarshall(result.Attributes)

        logger.debug({ deletedBlogPost: Attributes }, 'The message we just deleted');

        return response(200, {
            data: Attributes,
        });
    } catch (e) {
        logger.error(e.message);
        return response(500, {
            error: e.message,
        });
    }
};
