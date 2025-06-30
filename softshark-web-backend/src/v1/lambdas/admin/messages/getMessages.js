import 'regenerator-runtime/runtime';
import logger from '../../../../utils/logger.js';
import { extractExistingProperties, parseInteger, response } from '../../../../utils/helpers.js';
import { DEFAULT_LIMIT } from '../../../../utils/constants/pagination.js';
import { MESSAGE_TYPE_NAME } from '../../../../utils/constants/posts.js';
import { queryItems } from '../../../modules/dynamoDB.js';
import {unmarshall} from "@aws-sdk/util-dynamodb";

const { MESSAGES_TABLE_NAME } = process.env;

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
            TableName: MESSAGES_TABLE_NAME,
            KeyConditionExpression: '#tp=:tp',
            ExpressionAttributeNames: {
                '#tp': 'type',
            },
            ExpressionAttributeValues: {
                ':tp': {
                    S: MESSAGE_TYPE_NAME
                },
            },
            ProjectionExpression: 'id, phone, message, email, customer_name, isSent',
            Limit: parseInteger(limit) ?? DEFAULT_LIMIT,
            ScanIndexForward: false,
        };

        if (pointer) {
            params.ExclusiveStartKey = {
                id: {S: pointer },
                type: {S: MESSAGE_TYPE_NAME}
            };
        }

        const messages = await queryItems(params)
        const { Items, LastEvaluatedKey, ...restMetaData } = messages;

        console.log(messages)
        logger.debug({ messages }, 'Messages');

        const pagination = {
            pointer: LastEvaluatedKey,
        };

        return response(200, {
            data: Items?.map(v => unmarshall(v)),
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
