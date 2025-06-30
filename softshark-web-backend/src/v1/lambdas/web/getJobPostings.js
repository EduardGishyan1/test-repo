
import 'regenerator-runtime/runtime';
import logger from '../../../utils/logger.js';
import { extractExistingProperties, parseInteger, response } from '../../../utils/helpers.js';
import { DEFAULT_LIMIT } from '../../../utils/constants/pagination.js';
import { JOB_POSTING_TYPE_NAME } from '../../../utils/constants/posts.js';
import { queryItems } from '../../modules/dynamoDB.js';
import {unmarshall} from "@aws-sdk/util-dynamodb";

// env
const { JOB_POSTINGS_TABLE_NAME } = process.env;

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

        let ProjectionExpression = 'id, title, deadline, seniority, slug'

        const params = {
            TableName: JOB_POSTINGS_TABLE_NAME,
            KeyConditionExpression: '#tp=:tp',
            ExpressionAttributeNames: {
                '#tp': 'type',
                '#dl': 'deadline',
                '#pb': 'published',
            },
            FilterExpression: '#dl > :current_time and #pb = :published',
            ExpressionAttributeValues: {
                ':tp':{S: JOB_POSTING_TYPE_NAME },
                ':current_time': {S: new Date().toISOString()},
                ':published':{BOOL: true },
            },
            ProjectionExpression,
            Limit: parseInteger(limit) ?? DEFAULT_LIMIT,
            ScanIndexForward: false,
        };

        if (pointer) {
            params.ExclusiveStartKey = { id:{S: pointer}, type: {S: JOB_POSTING_TYPE_NAME }};
        }

        const jobPostings = await queryItems(params);

        const { Items, LastEvaluatedKey, ...restMetaData } = jobPostings;

        logger.debug({ jobPostings }, 'Job postings');

        const pagination = {
            pointer: unmarshall(LastEvaluatedKey),
        };

        return response(200, {
            data: Items?.map(v => unmarshall(v)),
            _meta: {
                pagination,
                ...restMetaData,
            },
        });
    } catch (e) {
        logger.error(e, 'Internal Server Error!!!');
        return response(500, {
            error: 'Internal Server Error!!!',
        });
    }
};
