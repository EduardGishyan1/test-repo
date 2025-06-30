import { ChatOpenAI } from '@langchain/openai';
import dotenv from 'dotenv';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import fetchCompanyInfo from '../../../../utils/getCompanyInfo.js';
import saveMessageTurn from '../../../../utils/saveMessagesInDB.js';
import headers from '../../../../utils/constants/header.js';

dotenv.config();

const openai = new ChatOpenAI({
  modelName: process.env.AI_MODEL,
  temperature: 0,
  maxTokens: 256,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

async function getCareersAnswer() {
  try {
    const { JOB_POSTINGS_TABLE_NAME } = process.env;
    const REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
    const ddbClient = new DynamoDBClient({ region: REGION });
    const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

    const params = {
      TableName: JOB_POSTINGS_TABLE_NAME,
      KeyConditionExpression: '#tp = :tp',
      ExpressionAttributeNames: { '#tp': 'type' },
      ExpressionAttributeValues: { ':tp': 'job_posting' },
      ProjectionExpression: 'id, title, description, deadline, seniority',
      ScanIndexForward: false,
      Limit: 10,
      published: true,
    };

    const data = await ddbDocClient.send(new QueryCommand(params));
    const now = new Date();

    const jobs = (data.Items || []).filter((job) => job.deadline && new Date(job.deadline) > now);

    if (jobs.length === 0) {
      return 'Currently, there are no open job postings. Please check back later!';
    }

    const jobsList = jobs
      .map((job) => `- ${job.title || 'Job position'} (${job.seniority || 'N/A'})\n` +
                `  Description: ${job.description || 'No description'}\n` +
                `  Deadline: ${job.deadline || 'N/A'}`)
      .join('\n\n');

    return `We have the following career opportunities:\n\n${jobsList}\n\nVisit our careers page for more details!`;
  } catch (error) {
    return 'There was an error retrieving career information. Please try again later.';
  }
}

export const handler = async (event) => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Message is required' }),
      };
    }

    const { message, chatID } = JSON.parse(event.body);
    if (!message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Message is required' }),
      };
    }

    const companyInfo = await fetchCompanyInfo(process.env.COMPANY_INFO_TABLE_NAME);

    if (!companyInfo) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Company information not found.' }),
      };
    }

    const systemPrompt = `
const systemPrompt = \`
You are a helpful assistant for SoftShark company.

Answer the user's questions **briefly and concisely**.

You can ONLY answer questions based on this company information:
"${companyInfo}"

Special rules:
- If the user's question is about career opportunities, reply exactly with "careers".
- If the user makes a grammar mistake like writing "carrier" instead of "career", reply exactly with:
  "It seems like you have a grammar mistake.?"
- If you don't know the answer based on this information, reply:
  "I don't have that information. Please ask me about SoftShark company, company services, or careers."

Only answer based on the provided company info.
\`;

`;

    const response = await openai.invoke([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message },
    ]);

    let answer;

    if (response.content.trim().toLowerCase() === 'careers') {
      answer = await getCareersAnswer();
    } else {
      answer = response.content.trim();
    }

    await saveMessageTurn(process.env.CHAT_MESSAGES_TABLE_NAME, chatID, message, answer);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ data: answer }),
    };
  } catch (error) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
