import 'regenerator-runtime/runtime';
import logger from '../../../../utils/logger';
import { extractExistingProperties, parseInteger, response } from '../../../../utils/helpers.js';
import { DEFAULT_LIMIT } from '../../../../utils/constants/pagination.js';
import { APPLY_JOB_TYPE_NAME } from '../../../../utils/constants/posts.js';
import { queryItems } from '../../../modules/dynamoDB.js';
import {unmarshall} from "@aws-sdk/util-dynamodb";

const { JOB_APPLICATIONS_TABLE_NAME } = process.env;

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
            TableName: JOB_APPLICATIONS_TABLE_NAME,
            KeyConditionExpression: '#tp=:tp',
            ExpressionAttributeNames: {
                '#tp': 'type',
            },
            ExpressionAttributeValues: {
                ':tp': {S: APPLY_JOB_TYPE_NAME },
            },
            ProjectionExpression: 'id, applicantName, jobPosition, email, fileURL',
            Limit: parseInteger(limit) ?? DEFAULT_LIMIT,
            ScanIndexForward: false,
        };

        if (pointer) {
            params.ExclusiveStartKey = { id: {S: pointer }, type:{S: APPLY_JOB_TYPE_NAME }};
        }

        const jobApplications = await queryItems(params);
        const { Items, LastEvaluatedKey, ...restMetaData } = jobApplications;

        logger.debug({ jobApplications }, 'Job Applications ');

        const pagination = {
            pointer: LastEvaluatedKey,
        };

        return response(200, {
            data: Items?.map((v) => unmarshall(v)),
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
