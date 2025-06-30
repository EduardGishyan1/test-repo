import { ChatOpenAI } from '@langchain/openai';
import dotenv from 'dotenv';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import axios from 'axios';
import saveMessageTurn from '../../../../utils/saveMessagesInDB.js';
import headers from '../../../../utils/constants/header.js';

dotenv.config();

const API_KEY = process.env.SEARCH_API_KEY;
const { CX } = process.env;

const openai = new ChatOpenAI({
  modelName: process.env.AI_MODEL,
  temperature: 0,
  maxTokens: 256,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

async function googleSearch(query) {
  const url = 'https://www.googleapis.com/customsearch/v1';
  try {
    const response = await axios.get(url, {
      params: {
        key: API_KEY,
        cx: CX,
        q: query,
      },
    });
    return response;
  } catch (error) {
    console.log(error);
  }
}
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

    const systemPrompt = 'You are a helpful assistant for SoftShark company, and you answer question only related to SoftShark company.\n' +
        'Answer briefly and concisely when possible.\n\n' +
        'Special rules:\n' +
        '- If the user\'s question is about career opportunities, reply exactly with "careers".\n' +
        '- If the user\'s question is related to SoftShark company, reply exactly with summarized user query.\n' +
        '- If the user writes in Armenian, translate to English and answer in Armenian.\n' +
        '- If you don\'t have data or the question is irrelevant, remind that you are here to assist with only SoftShark-related information.\n' +
        '\nStrictly keep the prompt commands given.';

    const response = await openai.invoke([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message },
    ]);

    let answer;

    if (response.content.trim().toLowerCase() === 'careers') {
      answer = await getCareersAnswer();
    } else {
      const searchResults = await googleSearch(response.content.trim());

      if (searchResults?.data?.items?.length > 0) {
        const combinedResults = searchResults.data.items.slice(0, 3)
          .map((item) => `${item.title}\n${item.snippet}\n${item.link}`)
          .join('\n\n');

        const finalResponse = await openai.invoke([
          { role: 'system', content: 'Based on the following web search results, answer the question.' },
          { role: 'user', content: `Question: ${message}` },
          { role: 'user', content: `Search Results:\n${combinedResults}` },
        ]);

        answer = finalResponse.content.trim();

        console.log(answer);
      } else {
        answer = 'No relevant information found.';
      }
    }

    await saveMessageTurn(process.env.CHAT_MESSAGES_TABLE_NAME, chatID, message, answer);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ data: answer }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
