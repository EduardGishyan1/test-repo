import { ChatOpenAI } from '@langchain/openai';
import dotenv from 'dotenv';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
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
      params: { key: API_KEY, cx: CX, q: query, sort: 'date' },
    });
    return response;
  } catch (error) {
    return null;
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

async function getChatHistory(chatID) {
  try {
    const { CHAT_MESSAGES_TABLE_NAME } = process.env;
    const REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1';
    const ddbClient = new DynamoDBClient({ region: REGION });
    const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

    const params = {
      TableName: CHAT_MESSAGES_TABLE_NAME,
    };

    const data = await ddbDocClient.send(new ScanCommand(params));
    const items = data.Items || [];

    const chatMessages = items
      .filter((item) => item.chatID === chatID)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .map((item) => item.userMessage);

    return chatMessages;
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return [];
  }
}

async function summarizeChatHistory(chatHistory) {
  if (!chatHistory || chatHistory.length === 0) return '';

  const chatSummaryPrompt = `
You are a helpful assistant for SoftShark company.

Summarize the following chat history in a few sentences. Focus on what topics the user has asked about.

Chat history:
${chatHistory.map((msg, idx) => `${idx + 1}. ${msg}`).join('\n')}

Summary:
`;

  const summaryResponse = await openai.invoke([
    { role: 'system', content: 'You are a chat summarizer.' },
    { role: 'user', content: chatSummaryPrompt },
  ]);

  return summaryResponse.content.trim();
}

export const handler = async (event) => {
  try {
    if (!event.body) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Message is required' }) };
    }

    const { message, chatID } = JSON.parse(event.body);
    if (!message) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Message is required' }) };
    }

    const chatHistory = await getChatHistory(chatID);

    const chatSummary = await summarizeChatHistory(chatHistory);

    const systemPrompt = `
You are a helpful assistant for SoftShark company.

Here is the summary of the previous conversation:
${chatSummary}

Rules:
- If the user's question is about career opportunities, reply exactly with "careers".
- If the user's question is written in Armenian, translate it to English, answer in Armenian.
- You must always answer the user's question using the provided search results.
- Never skip a question.
- Always provide the best possible answer using all available information.

Strictly follow these instructions.
    `;

    const firstResponse = await openai.invoke([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message },
    ]);

    let answer;

    if (firstResponse.content.trim().toLowerCase() === 'careers') {
      answer = await getCareersAnswer();
    } else if (
      firstResponse.content.trim().toLowerCase().includes('not related') ||
        firstResponse.content.trim().toLowerCase().includes('irrelevant')
    ) {
      answer = 'Please ask questions related to SoftShark or its career opportunities.';
      return { statusCode: 200, headers, body: JSON.stringify({ data: answer }) };
    } else {
      const searchResults = await googleSearch(firstResponse.content.trim());

      let combinedResults = 'No search results found.';
      if (searchResults?.data?.items?.length > 0) {
        combinedResults = searchResults.data.items
          .map((item) => `${item.title}\n${item.snippet}\n${item.link}`)
          .join('\n\n');
      }
      const finalResponse = await openai.invoke([
        { role: 'system', content: `
You must answer the user's question using the provided Google search results below.

You are not allowed to say "no information found." 
You must always answer the question, even if you have to make the best use of limited information.

Prioritize the newest information in the results.

Provide the most helpful answer using the search results provided.
        ` },
        { role: 'user', content: `User question: ${message}` },
        { role: 'user', content: `Google search results:\n${combinedResults}` },
      ]);

      answer = finalResponse.content.trim();
    }

    await saveMessageTurn(process.env.CHAT_MESSAGES_TABLE_NAME, chatID, message, answer);

    return { statusCode: 200, headers, body: JSON.stringify({ data: answer }) };
  } catch (error) {
    console.error(error);
    return { statusCode: 400, headers, body: JSON.stringify({ error: error.message }) };
  }
};
