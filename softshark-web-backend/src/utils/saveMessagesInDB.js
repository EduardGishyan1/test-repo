import { PutCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { v4 as uuidv4 } from 'uuid';

async function saveMessageTurn(tablename, chatId, userMessage, botAnswer) {
  try {
    const REGION = process.env.AWS_REGION || 'us-east-1';
    const ddbClient = new DynamoDBClient({ region: REGION });
    const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

    const timestamp = new Date().toISOString();

    const params = {
      TableName: tablename,
      Item: {
        chatId,
        timestamp,
        id: uuidv4(),
        userMessage,
        botAnswer,
      },
    };

    await ddbDocClient.send(new PutCommand(params));
  } catch (error) {
    console.error('Error saving message turn:', error);
  }
}

export default saveMessageTurn;
