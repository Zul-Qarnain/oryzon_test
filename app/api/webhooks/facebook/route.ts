import { NextRequest, NextResponse } from 'next/server';

import { handleNewMessageFromPlatform } from '@/backend/services/messenger/handleMsg';
import { channelsService } from '@/backend/services//channels/channels.service';
import { customersService } from '@/backend/services//customers/customers.service';
import { chatsService } from '@/backend/services//chats/chats.service';
// Assuming these are the correct imports from your Facebook Messenger library
import { FacebookMessageParser, FacebookMessagePayloadMessagingEntry as FacebookMessageObject, FacebookMessagingAPIClient } from 'fb-messenger-bot-api';
import { Customer } from '@/backend/services//customers/customers.types';
import { ConnectedChannelWithIncludes } from '@/backend/services//channels/channels.types';
import { messages } from '@/db/schema';
import { Chat } from '@/backend/services//chats/chats.types';
import { executeAgent } from '@/backend/services//ai/manager';
import { log } from 'console';


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
        const messagesFB: FacebookMessageObject[] = FacebookMessageParser.parsePayload(body);
        const response = new Response('EVENT_RECEIVED', { status: 200 });

        for (const message of messagesFB) {
            console.log("loll recip sender")
            console.log(message.recipient.id)
            console.log(message.sender.id)
            const jsonString = JSON.stringify(message);
            console.log(jsonString);
            if (message.sender.id != message.recipient.id && !message!.message!.is_echo) {


                    const recipientPageId = message.recipient.id;
                    const senderPlatformId = message.sender.id;
                    const fbMessage: FacebookMessageObject = message;


                    //{

                    if (senderPlatformId === recipientPageId) { // The message is from your page itself (bot) 
                        return response; 
                    }

                    // 1. Find ConnectedChannel using recipientPageId
                    let channel: ConnectedChannelWithIncludes | undefined;
                    try {
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

                    if (!customer) {
                        try {
                            // DO: Uncomment and implement customer creation logic
                            customer = await customersService.createCustomer({
                                platformCustomerId: senderPlatformId,
                                channelId: connectedChannelId,
                                fullName: `User ${senderPlatformId}`,
                                businessId: channel.business!.businessId,
                            });
                        } catch (error) {
                            console.error(`Error finding or creating customer for senderPlatformId ${senderPlatformId}:`, error);
                            return response;
                        }

                    }

                    if (!chat) {
                        try {
                            chat = await chatsService.createChat({
                                platformCustomerId: senderPlatformId,
                                channelId: connectedChannelId,
                                businessId: channel.business!.businessId,
                                providerUserId: channel.providerUserId,
                                status: 'OPEN', // Default status
                            });
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
                                const messageContent: Omit<typeof messages.$inferInsert, 'messageId' | 'chatId' | 'timestamp' | "platformMessageId"> = {
                                    content: attachment.payload.url,
                                    senderType: 'CUSTOMER', // Assuming message from platform user is 'CUSTOMER'
                                    contentType: 'IMAGE',
                                    // platformMessageId is intentionally not included here if omitted by chatsService.handleNewMessage
                                };

                                try {

                                    await chatsService.handleNewMessage(
                                        messageContent,
                                        chat.chatId,
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
                            const lastMsgs = await chatsService.handleNewMessage(
                                messageContent,
                                chat.chatId,
                            );
                            const AIResponse = await executeAgent(
                                lastMsgs,
                                internalCustomerId,
                                channel.platformSpecificId,
                                channel.business?.description || null,
                                channel.business!.businessId,
                                (ms) => console.log(ms) // Log function to capture messages
                            );
                            if (AIResponse) {
                                try {

                                    const content = typeof AIResponse === 'string' ? AIResponse : JSON.stringify(AIResponse);
                                    await chatsService.handleNewMessage(
                                        { content, senderType: 'BOT', contentType: 'TEXT', platformMessageId: undefined }, // No platformMessageId for bot messages
                                        chat.chatId,
                                    );
                                    await messagingClient.sendTextMessage(messageSenderPsid, content);
                                    return response;        
                                } catch (replyError) {
                                    console.error(`Failed to send AI response to ${messageSenderPsid}:`, replyError);
                                }
                            }
                        } catch (error) {
                            console.error(`Failed to handle new text message via chatsService for customer ${internalCustomerId}:`, error);
                            try {
                                await messagingClient.sendTextMessage(messageSenderPsid, "Sorry, we couldn't process your message at this time.");
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
                            return response;
                        } catch (error) {
                            console.error(`Failed to send unhandled message type notice to ${messageSenderPsid}:`, error);
                        }
                    }

                    //}











                }

            }

        return response;


    } catch (error) {
        console.error('Error handling message:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}
