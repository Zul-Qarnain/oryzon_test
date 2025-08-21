import { NextRequest, NextResponse } from 'next/server';

import { channelsService } from '@/backend/services/channels/channels.service';
import { customersService } from '@/backend/services/customers/customers.service';
import { chatsService } from '@/backend/services/chats/chats.service';
import { productsService } from '@/backend/services/products/products.service';

// Assuming these are the correct imports from your Facebook Messenger library
import { FacebookMessageParser, FacebookMessagePayloadMessagingEntry as FacebookMessageObject, FacebookMessagingAPIClient } from 'fb-messenger-bot-api';
import { Customer } from '@/backend/services/customers/customers.types';
import { ConnectedChannelWithIncludes } from '@/backend/services/channels/channels.types';
import { messages } from '@/db/schema';
import { Chat } from '@/backend/services/chats/chats.types';
import { executeAgent } from '@/backend/services/ai/manager';
import { log } from 'console';
import { formatObjectToString } from '@/backend/services/ai/tools';


export async function GET(request: NextRequest): Promise<Response> {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
        return new Response(challenge, { status: 200 });
    } else {
        return new Response('Forbidden', { status: 403 });
    }
}


const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN as string;
const messagingClient = new FacebookMessagingAPIClient(PAGE_ACCESS_TOKEN);

export async function POST(request: NextRequest): Promise<Response> {
    try {
        const body = await request.json();
        console.log('Received webhook body:', JSON.stringify(body, null, 2));
        const messagesFB: FacebookMessageObject[] = FacebookMessageParser.parsePayload(body);
        const response = new Response('EVENT_RECEIVED', { status: 200 });

        for (const message of messagesFB) {
            console.log(" recip sender")
            console.log(message.recipient.id)
            console.log(message.sender.id)
            const jsonString = JSON.stringify(message);
            console.log('Processing Facebook message:', jsonString);
            if (message.sender.id != message.recipient.id && message.message && !message.message.is_echo) {


                const recipientPageId = message.recipient.id;
                const senderPlatformId = message.sender.id;
                const fbMessage: FacebookMessageObject = message;


                // {

                if (senderPlatformId === recipientPageId) { // The message is from your page itself (bot) 
                    return response;
                }

                // 1. Find ConnectedChannel using recipientPageId
                let channel: ConnectedChannelWithIncludes | undefined;
                try {
                    console.log(`Fetching channel for recipientPageId: ${recipientPageId}`);
                    const { data } = await channelsService.getAllChannels({
                        filter: { platformSpecificId: recipientPageId },
                        include: {
                            business: true, customers: {
                                limit: 1,
                                platformCustomerId: senderPlatformId,
                            },
                            chats: {
                                limit: 1,
                                platformCustomerId: senderPlatformId,
                            }
                        },
                        limit: 1,
                    });
                    channel = data[0];
                    console.log('Fetched channel:', channel);
                } catch (error) {
                    console.error(`Error fetching channel for recipientPageId ${recipientPageId}:`, error);
                    return response;
                }



                if (!channel || !channel.accessToken) {
                    console.error(`Channel not found or no access token for recipientPageId: ${recipientPageId}`);
                    return response;
                }
                const connectedChannelId = channel.channelId;
                const accessToken = channel.accessToken;

                // 2. Find or create Customer using senderPlatformId

                let customer: Customer | null = channel.customers?.[0] || null;
                let chat: Chat | null = channel.chats?.[0] || null;
                console.log('Existing customer:', customer);
                console.log('Existing chat:', chat);

                if (!customer) {
                    try {
                        console.log(`Creating customer for senderPlatformId: ${senderPlatformId}`);
                        // DO: Uncomment and implement customer creation logic
                        customer = await customersService.createCustomer({
                            platformCustomerId: senderPlatformId,
                            channelId: connectedChannelId,
                            fullName: `User ${senderPlatformId}`,
                            businessId: channel.business!.businessId,
                        });
                        console.log('Created customer:', customer);
                    } catch (error) {
                        console.error(`Error finding or creating customer for senderPlatformId ${senderPlatformId}:`, error);
                        return response;
                    }

                }

                if (!chat) {
                    try {
                        console.log(`Creating chat for platformCustomerId: ${senderPlatformId}`);
                        chat = await chatsService.createChat({
                            platformCustomerId: senderPlatformId,
                            channelId: connectedChannelId,
                            businessId: channel.business!.businessId,
                            providerUserId: channel.providerUserId,
                            status: 'OPEN', // Default status
                        });
                        console.log('Created chat:', chat);
                    } catch (error) {
                        console.error(`Error creating chat for customer ${customer.customerId}:`, error);
                        return response;
                    }
                }

                const internalCustomerId = customer.customerId;

                // 3. Initialize Messaging Client
                // This instantiation depends on the actual Facebook Messenger library being used.
                const messagingClient = new FacebookMessagingAPIClient(accessToken);


                const messageSenderPsid = fbMessage.sender.id; // PSID from the specific message

                if (fbMessage.message?.attachments) {
                    for (const attachment of fbMessage.message.attachments) {
                        if (attachment.type === 'image' && attachment.payload && 'url' in attachment.payload) {
                            const messageContentHUMAN: Omit<typeof messages.$inferInsert, 'messageId' | 'chatId' | 'timestamp' | "platformMessageId"> = {
                                content: `A image with [IMAGE URL]: ${attachment.payload.url}`,
                                senderType: 'CUSTOMER', // Assuming message from platform user is 'Customer'
                                contentType: 'IMAGE',
                                // platformMessageId is intentionally not included here if omitted by chatsService.handleNewMessage
                            };
                            const messageContentAI: Omit<typeof messages.$inferInsert, 'messageId' | 'chatId' | 'timestamp' | "platformMessageId"> = {
                                content: `[SYSTEM_START]: (NOTE THAT IT IS SYSTEM PROMPT , NOT USER REPLY , USED TO GUIDE MY THOUGHTS) USER HAS GIVEN YOU A IMAGE URL (${attachment.payload.url}) AND YOU NEED TO PROCESS IT . AS IT TAKES TIME USER IS NOTFIED TO WAIT FOR A WHILE [SYSTEM_END] 
                                         Please wait a moment while processing the image. This may take a minute....
                                `,
                                senderType: 'BOT', // Assuming message from platform user is 'BOT'
                                contentType: 'IMAGE',
                                // platformMessageId is intentionally not included here if omitted by chatsService.handleNewMessage
                            };
                            console.log("User sent an image:", attachment.payload.url);

                            try {

                                await chatsService.handleNewMessage(
                                    messageContentHUMAN,
                                    chat.chatId,
                                );
                                await chatsService.handleNewMessage(
                                    messageContentAI,
                                    chat.chatId,
                                );
                                await messagingClient.sendTextMessage(
                                    messageSenderPsid,
                                    `Please wait a moment while processing the image. This may take a minute...`
                                );
                                const products = await productsService.getProductByImageURL(attachment.payload.url, channel.business!.businessId);
                                let result = '';
                                if (products) {

                                    if (products.length > 1) {
                                        for (const product of products) {
                                            result += formatObjectToString(product, 'Product Info') + '\n---\n';
                                        }
                                    } else {
                                        result = formatObjectToString(products[0], 'Product Info');
                                    }
                                }
                                else {
                                    result = 'No products found for the provided image.';
                                }
                                console.log("Product search result:", result);
                                await messagingClient.markSeen(messageSenderPsid);
                                await messagingClient.toggleTyping(messageSenderPsid, true);
                                const messageContent: Omit<typeof messages.$inferInsert, 'messageId' | 'chatId' | 'timestamp' | "platformMessageId"> = {
                                    content: `[SYSTEM START] AFTER TELLING USER TO WAIT, THE IMAGE WAS USED TO FIND ANY PRODUCT. SYSTEM ASSUMED THE USER PROVIDED IMAGE FOR PRODUCT SEARCH. IMAGE URL: ${attachment.payload.url}
                                 --RESULT: ${result}
                                 THIS SYSTEM MESSAGE IS NOT SEEN BY USER.
                                [SYSTEM END] `,
                                    senderType: 'BOT', // Assuming message from platform user is 'BOT'
                                    contentType: 'TEXT',
                                    // platformMessageId is intentionally not included here if omitted by chatsService.handleNewMessage
                                };
                                const lastMsgs = await chatsService.handleNewMessage(
                                    messageContent,
                                    chat.chatId,
                                );

                                const replyUserFn = async (msg: unknown) => {
                                    const content = typeof msg === 'string' ? msg : JSON.stringify(msg);
                                    await messagingClient.sendTextMessage(messageSenderPsid, content);
                                    await messagingClient.toggleTyping(messageSenderPsid, false);
                                    await chatsService.handleNewMessage(
                                        { content, senderType: 'BOT', contentType: 'TEXT', platformMessageId: undefined }, // No platformMessageId for bot messages
                                        chat.chatId,
                                    );
                                }

                                const replyUserWithProductImageAndInfoFn = async (productImageURL: string, productInfo: string) => {
                                    const content = productInfo
                                    await messagingClient.sendImageMessage(messageSenderPsid, productImageURL);
                                    await messagingClient.sendTextMessage(messageSenderPsid, content);
                                    await messagingClient.toggleTyping(messageSenderPsid, false);
                                    await chatsService.handleNewMessage(
                                        { content, senderType: 'BOT', contentType: 'TEXT', platformMessageId: undefined }, // No platformMessageId for bot messages
                                        chat.chatId,
                                    );
                                }

                                const AIResponse = await executeAgent(
                                    lastMsgs,
                                    internalCustomerId,
                                    channel.channelId,
                                    channel.business?.description || null,
                                    channel.business!.businessId,
                                    customer.address || "",
                                    replyUserFn,
                                    replyUserWithProductImageAndInfoFn,
                                    (ms) => console.log(ms) // Log function to capture messages
                                );
                            } catch (error) {
                                console.error(`Failed to send image message to ${messageSenderPsid}:`, error);
                            }

                        }
                        else {
                            console.log(`Received unsupported attachment type from ${messageSenderPsid}:`, attachment.type);
                            try {
                                await messagingClient.sendTextMessage(
                                    messageSenderPsid,
                                    `Can not process ${attachment.type} attachments yet.`
                                );
                                return response;
                            } catch (error) {
                                console.error(`Failed to send unsupported attachment type notice to ${messageSenderPsid}:`, error);
                            }
                        }
                    }
                } else if (fbMessage.message?.text) {
                    const text = fbMessage.message.text;
                    const platformMessageId = fbMessage.message.mid; // Facebook's message ID

                    try {
                        const messageContent: Omit<typeof messages.$inferInsert, 'messageId' | 'chatId' | 'timestamp'> = {
                            content: text,
                            senderType: 'CUSTOMER', // Assuming message from platform user is 'CUSTOMER'
                            contentType: 'TEXT',
                            platformMessageId: platformMessageId, // Include platformMessageId if needed
                        };
                        await messagingClient.markSeen(messageSenderPsid);
                        await messagingClient.toggleTyping(messageSenderPsid, true);
                        const lastMsgs = await chatsService.handleNewMessage(
                            messageContent,
                            chat.chatId,
                        );

                        const replyUserFn = async (msg: unknown) => {
                            const content = typeof msg === 'string' ? msg : JSON.stringify(msg);
                            await messagingClient.sendTextMessage(messageSenderPsid, content);
                            await messagingClient.toggleTyping(messageSenderPsid, false);
                            await chatsService.handleNewMessage(
                                { content, senderType: 'BOT', contentType: 'TEXT', platformMessageId: undefined }, // No platformMessageId for bot messages
                                chat.chatId,
                            );
                        }

                        const replyUserWithProductImageAndInfoFn = async (productImageURL: string, productInfo: string) => {
                            const content = productInfo
                            await messagingClient.sendImageMessage(messageSenderPsid, productImageURL);
                            await messagingClient.sendTextMessage(messageSenderPsid, content);
                            await messagingClient.toggleTyping(messageSenderPsid, false);
                            await chatsService.handleNewMessage(
                                { content, senderType: 'BOT', contentType: 'TEXT', platformMessageId: undefined }, // No platformMessageId for bot messages
                                chat.chatId,
                            );
                        }

                        const AIResponse = await executeAgent(
                            lastMsgs,
                            internalCustomerId,
                            channel.channelId,
                            channel.business?.description || null,
                            channel.business!.businessId,
                            customer.address || "",
                            replyUserFn,
                            replyUserWithProductImageAndInfoFn,
                            (ms) => console.log(ms) // Log function to capture messages
                        );

                    } catch (error) {
                        console.error(`Failed to handle new text message via chatsService for customer ${internalCustomerId}:`, error);
                        try {
                            await messagingClient.sendTextMessage(messageSenderPsid, "Sorry, we couldn't process your message at this time.");
                            await messagingClient.toggleTyping(messageSenderPsid, false);

                            return response;
                        } catch (replyError) {
                            console.error(`Failed to send error reply to ${messageSenderPsid}:`, replyError);
                        }
                    }
                } else {
                    console.log(`Received unhandled message type from ${messageSenderPsid}:`, fbMessage.message);
                    try {
                        await messagingClient.sendTextMessage(
                            messageSenderPsid,
                            `Received a message of a type we don't fully support yet.`
                        );
                        await messagingClient.toggleTyping(messageSenderPsid, false);

                        return response;
                    } catch (error) {
                        console.error(`Failed to send unhandled message type notice to ${messageSenderPsid}:`, error);
                    }
                }

                // }











            }

        }

        return response;


    } catch (error) {
        console.error('Error handling message:', error);
        return new Response('Internal Server Error', { status: 500 });
    }


}