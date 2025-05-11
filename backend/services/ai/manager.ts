import { messages } from '@/db/schema';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { CoreSystemMessage, CoreUserMessage, CoreAssistantMessage, CoreToolMessage, UIMessage } from 'ai';

const google = createGoogleGenerativeAI({
  // custom settings
    apiKey: process.env.GOOGLE_API_KEY,
});

export const executeAgent = async (msgs: typeof messages.$inferSelect[], customerId: string, connectedPageID: string) => {
  // 1. Find the chat
    const  history: Array<CoreSystemMessage | CoreUserMessage | CoreAssistantMessage | CoreToolMessage> | Array<UIMessage> = [];


  return "";
};