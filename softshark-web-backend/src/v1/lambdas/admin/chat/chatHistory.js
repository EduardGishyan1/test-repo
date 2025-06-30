import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import headers from '../../../../utils/constants/header.js'

const REGION = process.env.AWS_REGION || 'us-east-1';
const TABLE_NAME = process.env.CHAT_MESSAGES_TABLE_NAME;

const ddbClient = new DynamoDBClient({ region: REGION });
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

export const handler = async (event) => {
  try {
    const params = {
      TableName: TABLE_NAME,
    };

    const data = await ddbDocClient.send(new ScanCommand(params));
    const items = data.Items || [];

    items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify({ messages: items }),
    };
  } catch (error) {
    return {
      statusCode: 200,
      headers: headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
