import { messages } from '@/db/schema';
// import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { CoreSystemMessage, CoreUserMessage, CoreAssistantMessage, CoreToolMessage, UIMessage, generateText } from 'ai';
import { generateSystemPrompt } from './prompts';
import { getAITools } from './tools';

// const google = createGoogleGenerativeAI({
//   // custom settings
//     apiKey: process.env.GOOGLE_API_KEY,
// });
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, AIMessage, ToolMessage } from '@langchain/core/messages';

export const executeAgent = async (msgs: typeof messages.$inferSelect[], customerId: string, connectedPageID: string, channelDescription: string | null, businessId: string) => {
  // 1. Find the chat
  const history: Array<CoreSystemMessage | CoreUserMessage | CoreAssistantMessage | CoreToolMessage> | Array<UIMessage> = [];

  const systemPromptContent = generateSystemPrompt(channelDescription);

  history.push({
    id: crypto.randomUUID(),
    role: "system",
    content: systemPromptContent,
    parts: [{ type: "text", text: systemPromptContent }],
  });
  console.log(msgs)
  for (const msg of msgs) {
    if (msg.senderType === "CUSTOMER") {
      history.push({
        id: crypto.randomUUID(),
        role: "user",
        content: msg.content,
        parts: [{ type: "text", text: msg.content }],
      });
    } else if (msg.senderType === "BOT") {
      history.push({
        id: crypto.randomUUID(),
        role: "assistant",
        content: msg.content,
        parts: [{ type: "text", text: msg.content }],
      });
    }

  }
  const { getProductById, getProductByImageUrl, calculator } = getAITools(customerId, connectedPageID, businessId);

  console.log("History:", JSON.stringify(history));

  // const {text} = await generateText({
  //   model: google("gemini-2.5-flash-preview-04-17"),
  //   prompt: msgs[msgs.length - 1].content, // Use the last message content as the prompt
  //   tools: {
  //     getProductById,
  //     getProductByImageUrl,
  //     calculator,
  //   },


  // });

  const model = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash-preview-04-17",
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    temperature: 0.2,
  });

  const llmWithTools = model.bindTools([
        getProductById,
        getProductByImageUrl,
        calculator,
  ]);

  const messages = [new HumanMessage(msgs[msgs.length - 1].content)];

  const aiMessage = await llmWithTools.invoke(messages);

  console.log(aiMessage);

  messages.push(aiMessage);

  const toolsByName = {
    getProductById,
    getProductByImageUrl,
    calculator,
  };

  // Check if tool_calls exist, is an array, and has elements
  if (aiMessage.tool_calls && Array.isArray(aiMessage.tool_calls) && aiMessage.tool_calls.length > 0) {
    for (const toolCall of aiMessage.tool_calls) {
      // Ensure toolCall has 'name' and 'id' properties. LangChain tool_calls should have these.
      if (!toolCall.name || typeof toolCall.id === 'undefined') {
        console.warn("Skipping malformed tool_call (missing name or id):", toolCall);
        // Optionally, push a ToolMessage indicating this malformed call if needed for the LLM to react.
        // For now, just skipping.
        continue;
      }

      const toolName = toolCall.name as keyof typeof toolsByName;
      const selectedTool = toolsByName[toolName];

      if (selectedTool) {
        try {
          console.log(`Invoking tool: ${toolName} with args:`, toolCall.args);
          // Perform a more specific cast on selectedTool or its invoke method
          // This tells TypeScript to trust that 'selectedTool' is a callable function
          // with an 'invoke' method that can accept 'toolCall.args'.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const toolFn = selectedTool as { invoke: (args: any) => Promise<any> };
          const toolResultData = await toolFn.invoke(toolCall.args); 
          
          // Construct ToolMessage correctly for LangChain
          messages.push(new ToolMessage({
            content: typeof toolResultData === 'string' ? toolResultData : JSON.stringify(toolResultData),
            tool_call_id: toolCall.id, // Use toolCall.id from the AI's tool_call object
          }));
        } catch (error) {
          console.error(`Error invoking tool ${toolName}:`, error);
          messages.push(new ToolMessage({
            content: `Error executing tool ${toolName}: ${(error as Error).message}`,
            tool_call_id: toolCall.id,
          }));
        }
      } else {
        console.warn(`Tool ${toolName} not found.`);
        messages.push(new ToolMessage({
          content: `Tool ${toolName} not found.`,
          tool_call_id: toolCall.id,
        }));
      }
    }

    console.log("Messages after tool processing:", messages);
    // If tools were called, invoke the LLM again with the updated messages array.
    // The 'messages' array now contains: HumanMessage, AIMessage (with tool_calls), and ToolMessages.
    const finalAiResponse = await llmWithTools.invoke(messages);
    console.log("Final AI Response after tool calls:", finalAiResponse);
    console.log("Final generated content to return:", finalAiResponse.content);
    return finalAiResponse.content; // Return content of the final AI response
  } else {
    // No tool calls were made in the initial AI response, or tool_calls array was empty/malformed.
    // Return the content of the initial aiMessage.
    console.log("No tool calls made or tool_calls empty/malformed. Returning initial AI content.");
    console.log("Final generated content to return:", aiMessage.content);
    return aiMessage.content;
  }
};
