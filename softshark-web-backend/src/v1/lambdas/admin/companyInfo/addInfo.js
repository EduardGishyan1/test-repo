import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { response } from "../../../../utils/helpers.js"
import headers from "../../../../utils/constants/header.js";

const REGION = process.env.AWS_REGION || 'us-east-1';
const TABLE_NAME = process.env.COMPANY_INFO_TABLE_NAME;

const ddbClient = new DynamoDBClient({ region: REGION });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

export const handler = async (event) => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers: headers,
        body: JSON.stringify({ error: 'missing body' }),
      };
    }

    const data = JSON.parse(event.body);

    if (!data.description) {
      return {
        statusCode: 400,
        headers: headers,
        body: JSON.stringify({ error: 'missing description' }),
      };
    }

    const item = {
      id: 'company-info',
      description: data.description,
      updatedAt: new Date().toISOString(),
    };

    const putParams = {
      TableName: TABLE_NAME,
      Item: item,
    };

    await ddbDocClient.send(new PutCommand(putParams));

    return {
      statusCode: 201,
      headers: headers,
      body: JSON.stringify({ message: 'Company information updated successfully.' }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
