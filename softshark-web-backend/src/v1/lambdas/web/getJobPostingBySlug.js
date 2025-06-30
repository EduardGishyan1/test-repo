import 'regenerator-runtime/runtime';

import {response} from '../../../utils/helpers';
import logger from '../../../utils/logger';
import {queryItems} from '../../modules/dynamoDB';
import {unmarshall} from "@aws-sdk/util-dynamodb";

const { JOB_POSTINGS_TABLE_NAME, GSI_NAME } = process.env;

export const handler = async (event) => {
    try {
        logger.info({ event }, 'Payload!');

        const { pathParameters: { slug } } = event;

        if (!slug) {
            return response(400, {
                error: 'Provide slug',
            });
        }

        const params = {
            TableName: JOB_POSTINGS_TABLE_NAME,
            IndexName: GSI_NAME,
            KeyConditions: {
                slug: {
                    ComparisonOperator: 'EQ',
                    AttributeValueList: [{
                        S: `${slug}`
                    }],
                },
            },
        };

        const result = await queryItems(params);
        console.log(result)
        const Items = result.Items?.map(v => unmarshall(v));

        console.log(Items)

        logger.debug({ result }, 'Job posting which we found');

        if (!result) {
            return response(400, {
                error: 'Job posting with the given slug not found',
            });
        }

        return response(200, {
            data: Items[0]
        });

    } catch (e) {
        logger.error(e, 'Internal Server Error!!!');
        return response(500, {
            error: 'Internal Server Error!!!',
        });
    }
};
