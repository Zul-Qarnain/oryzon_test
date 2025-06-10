import { messages } from '@/db/schema';
import { CoreSystemMessage, CoreUserMessage, CoreAssistantMessage, CoreToolMessage, UIMessage, generateText } from 'ai';
import { generateSystemPrompt } from './prompts';
import { getAITools } from './tools';

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, AIMessage, ToolMessage , SystemMessage} from '@langchain/core/messages';

export const executeAgent = async (msgs: typeof messages.$inferSelect[], customerId: string, connectedPageID: string, businessDescription: string | null, businessId: string, log: (message: string) => void) => {
  // 1. Find the chat
  const messages = []

  const systemPromptContent = generateSystemPrompt(businessDescription);
  messages.push(new SystemMessage(systemPromptContent));

  for (const msg of msgs) {
    if (msg.senderType === "CUSTOMER") {
      messages.push(new HumanMessage(msg.content));
    } else if (msg.senderType === "BOT") {
      messages.push(new AIMessage(msg.content));
    }
  }
    log(JSON.stringify(msgs))

  const { 
    getProductById, 
    getProductByImageUrl, 
    calculator, 
    createProduct,
    getProductByKeyword,
    getProductByKeywordWithMaxPrice,
    getProductByKeywordWithMinPrice ,
  createOrder,
    replyUser
  } = getAITools(customerId, connectedPageID, businessId);

  log("messages: " + JSON.stringify(messages));

  const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash-preview-04-17",
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    temperature: 0.2,
  });

  const llmWithTools = model.bindTools([
        getProductById,
        getProductByImageUrl,
        calculator,
        createProduct,
        getProductByKeyword,
        createOrder,
    replyUser
    
  ], {tool_choice: "any"}
                                      );

  const aiMessage = await llmWithTools.invoke(messages);

  log(JSON.stringify(aiMessage));

  messages.push(aiMessage);

  const toolsByName = {
    getProductById,
    getProductByImageUrl,
    calculator,
    createProduct,
    getProductByKeyword,
    createOrder,
    replyUser
  };

  // Check if tool_calls exist, is an array, and has elements
  if (aiMessage.tool_calls && Array.isArray(aiMessage.tool_calls) && aiMessage.tool_calls.length > 0) {
    for (const toolCall of aiMessage.tool_calls) {
      // Ensure toolCall has 'name' and 'id' properties. LangChain tool_calls should have these.
      if (!toolCall.name || typeof toolCall.id === 'undefined') {
        log("Skipping malformed tool_call (missing name or id): " + JSON.stringify(toolCall));
        // Optionally, push a ToolMessage indicating this malformed call if needed for the LLM to react.
        // For now, just skipping.
        continue;
      }
      

      const toolName = toolCall.name as keyof typeof toolsByName;
      const selectedTool = toolsByName[toolName];
 if(toolName == 'replyUser'){
   log("Reply User tool called skipping");
   continue ;
 
   
 }
      if (selectedTool) {
        try {
          log(`Invoking tool: ${toolName} with args: ${JSON.stringify(toolCall.args)}`);
          // Perform a more specific cast on selectedTool or its invoke method
          // This tells TypeScript to trust that 'selectedTool' is a callable function
          // with an 'invoke' method that can accept 'toolCall.args'.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const toolFn = selectedTool as { invoke: (args: any) => Promise<any> };
          const toolResultData = await toolFn.invoke(toolCall.args); 
          log(typeof toolResultData === 'string' ? toolResultData : JSON.stringify(toolResultData));
          // Construct ToolMessage correctly for LangChain
          messages.push(new ToolMessage({
            content: typeof toolResultData === 'string' ? toolResultData : JSON.stringify(toolResultData),
            tool_call_id: toolCall.id, // Use toolCall.id from the AI's tool_call object
          }));
        } catch (error) {
          console.log(error)
          log(`Error invoking tool ${toolName}: ${(error as Error).message}`);
          messages.push(new ToolMessage({
            content: `Error executing tool ${toolName}: ${(error as Error).message}`,
            tool_call_id: toolCall.id,
          }));
        }
      } else {
        log(`Tool ${toolName} not found.`);
        messages.push(new ToolMessage({
          content: `Tool ${toolName} not found.`,
          tool_call_id: toolCall.id,
        }));
      }
    }

    log("Messages after tool processing: " + JSON.stringify(messages));
    // If tools were called, invoke the LLM again with the updated messages array.
    // The 'messages' array now contains: HumanMessage, AIMessage (with tool_calls), and ToolMessages.
    const finalAiResponse = await llmWithTools.invoke(messages);
    log("Final AI Response after tool calls: " + JSON.stringify(finalAiResponse));
    log("Final generated content to return: " + JSON.stringify(finalAiResponse.content));
    return finalAiResponse.content; // Return content of the final AI response
  } else {
    // No tool calls were made in the initial AI response, or tool_calls array was empty/malformed.
    // Return the content of the initial aiMessage.
    log("No tool calls made or tool_calls empty/malformed. Returning initial AI content.");
    log("Final generated content to return: " + JSON.stringify(aiMessage.content));
    return aiMessage.content;
  }
};

 
