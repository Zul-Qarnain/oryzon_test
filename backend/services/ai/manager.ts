import { messages } from '@/db/schema';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { CoreSystemMessage, CoreUserMessage, CoreAssistantMessage, CoreToolMessage, UIMessage, generateText } from 'ai';
import { generateSystemPrompt } from './prompts'; 
import { getAITools } from './tools';

const google = createGoogleGenerativeAI({
  // custom settings
    apiKey: process.env.GOOGLE_API_KEY,
});

export const executeAgent = async (msgs: typeof messages.$inferSelect[], customerId: string, connectedPageID: string, channelDescription: string | null , businessId:string) => {
  // 1. Find the chat
    const  history: Array<CoreSystemMessage | CoreUserMessage | CoreAssistantMessage | CoreToolMessage> | Array<UIMessage> = [];

    const systemPromptContent = generateSystemPrompt(channelDescription);

    history.push({
      id: crypto.randomUUID(),
      role:"system",
      content: systemPromptContent,
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
    const {getProductById, getProductByImageUrl} = getAITools(customerId, connectedPageID, businessId);

    const {text} = await generateText({
      model: google("gemini-2.5-flash-preview-04-17"),
      messages: history,
      tools: {
        getProductById,
        getProductByImageUrl,
      },
    

    });

  return text;
};
