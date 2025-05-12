import { messages } from '@/db/schema';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { CoreSystemMessage, CoreUserMessage, CoreAssistantMessage, CoreToolMessage, UIMessage } from 'ai';
import { prompts } from './prompts';

const google = createGoogleGenerativeAI({
  // custom settings
    apiKey: process.env.GOOGLE_API_KEY,
});

export const executeAgent = async (msgs: typeof messages.$inferSelect[], customerId: string, connectedPageID: string) => {
  // 1. Find the chat
    const  history: Array<CoreSystemMessage | CoreUserMessage | CoreAssistantMessage | CoreToolMessage> | Array<UIMessage> = [];
    history.push({
      id: crypto.randomUUID(),
      role:"system",
      content: prompts.systemPromptsGeneral,
      parts: [],  
    });
    for(const msg of msgs) {
      if (msg.senderType === "CUSTOMER") {
        history.push({
          id: crypto.randomUUID(),
          role:"user",
          content: msg.content,
          parts: [],  
        });
      } else if (msg.senderType === "BOT") {
        history.push({
          id: crypto.randomUUID(),
          role:"assistant",
          content: msg.content,
          parts: [],
        });
      }
      
    }

  return "";
};