import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const ddbClient = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

const fetchCompanyInfo = async (tableName) => {
  try {
    const params = {
      TableName: tableName,
      Key: {
        id: 'company-info',
      },
    };

    const data = await ddbDocClient.send(new GetCommand(params));

    if (!data.Item) {
      return null;
    }

    return data.Item.description;
  } catch (error) {
    console.error('Error fetching company info:', error);
    throw new Error('Failed to fetch company info');
  }
};

export default fetchCompanyInfo;
