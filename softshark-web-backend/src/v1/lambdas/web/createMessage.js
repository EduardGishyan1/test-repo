import 'regenerator-runtime/runtime';
import { v4 as uuidv4 } from 'uuid';
// validation
import { extractExistingProperties, response } from '../../../utils/helpers';
import { createItem } from '../../modules/dynamoDB';
import logger from '../../../utils/logger';
import { MESSAGE_TYPE_NAME } from '../../../utils/constants/posts';
import {unmarshall} from "@aws-sdk/util-dynamodb";

// env
const { MESSAGES_TABLE_NAME } = process.env;

export const handler = async (event) => {
    try {
        let body;

        try {
            body = JSON.parse(event.body);
        } catch (e) {
            return response(400, {
                error: 'Provide a valid JSON body',
            });
        }

        const messageDetails = extractExistingProperties(
            body,
            ['email', 'phone', 'customer_name', 'message'],
        );
        console.log(messageDetails)

        const createdAt = new Date().toISOString();

        logger.debug({ messageDetails }, 'Details of message');

        const params = {
            TableName: MESSAGES_TABLE_NAME,
            Item: {
                email: {S: messageDetails['email']},
                phone : {S: messageDetails['phone']},
                customer_name: {S: messageDetails['customer_name']},
                message: {S: messageDetails['message']},
                id: {S: createdAt + uuidv4()},
                type: {S: MESSAGE_TYPE_NAME},
                isSent: {BOOL: false},
                createdAt : {S: createdAt},
            },
        };
        const { Item: Attributes } = params;

        const message = await createItem(params);

        logger.debug({ message }, 'Successfully created');

        return response(200, {
            data: unmarshall(Attributes),
        });
    } catch (e) {
        logger.error(e.message);
        return response(500, {
            error: e.message,
        });
    }
};
