import { DynamoDBClient, GetItemCommand, PutItemCommand, DeleteItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb';

export const dynamoDB = new DynamoDBClient({});

export const getItem = async (params) => {
  const getItemCommand = new GetItemCommand(params);
  const response = await dynamoDB.send(getItemCommand);
  return response;
};

export const updateItem = async (params) => {
  const command = new PutItemCommand(params);
  const result = await dynamoDB.send(command);
  return result;
};

export const createItem = async (params) => {
  const command = new PutItemCommand(params);
  const result = await dynamoDB.send(command);
  return result;
};

export const deleteItem = async (params) => {
  const command = new DeleteItemCommand(params);
  const result = await dynamoDB.send(command);
  return result;
};

export const queryItems = async (params) => {
  const command = new QueryCommand(params);
  const result = await dynamoDB.send(command);
  return result;
};

// collect all fields in a JSON object into a DynamoDB expression
export const buildExpression = (body) => Object.keys(body)
  .map((key) => `${key} = :${key}`)
  .join(', ');

export const buildAttributes = (body) => Object.fromEntries(
  Object.entries(body).map(([key, value]) => [
    `:${key}`,
    typeof value === 'string' || typeof value === 'number'
      ? value
      : JSON.stringify(value),
  ]),
);

export const buildConditionExpression = (keys) => {
  let exp = '';
  const attrs = [];
  // id = :id
  Object.keys(keys).forEach((keyAttr) => {
    attrs.push(`${keyAttr} = :${keyAttr}`);
  });
  exp += attrs.join(' AND ');
  return exp;
};
