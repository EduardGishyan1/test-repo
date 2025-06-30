/* eslint-disable */
import 'regenerator-runtime/runtime';
import logger from "../../../../utils/logger";
import {getItem} from "../../../modules/dynamoDB";
import {response} from "../../../../utils/helpers";
import {unmarshall} from "@aws-sdk/util-dynamodb";

exports.handler = async event => {
    try {
        const { pathParameters: { store } } = event;
        const params = {
            TableName: 'eligabable-stores-devrefactory-dev',
            Key: {
                id: store
            }
        };
        const result = await getItem(params);
        logger.info(result);
        let res = unmarshall(result.Item) ? result : undefined;
        return response(200, {
            isEligible: !!res.FP_STORE,
        });
    } catch (e) {
        logger.error(e.message);
        return response(200, {
            isEligible: false
        });
    }
}
