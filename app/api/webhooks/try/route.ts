import { NextRequest, NextResponse } from 'next/server';

import { channelsService } from '@/backend/services//channels/channels.service';
import { customersService } from '@/backend/services//customers/customers.service';
import { chatsService } from '@/backend/services//chats/chats.service';
// Assuming these are the correct imports from your Facebook Messenger library
import { Customer } from '@/backend/services//customers/customers.types';
import { ConnectedChannelWithIncludes } from '@/backend/services//channels/channels.types';
import { messages } from '@/db/schema';
import { Chat } from '@/backend/services//chats/chats.types';
import { executeAgent } from '@/backend/services//ai/manager';
import { log } from 'console';


const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN as string;

interface BodyType {
    recipient: {
        id: string;
    },
    sender: {
        id: string
    },
    content: {
        text: string | null,
        image: string | null
    }
}

export async function POST(request: NextRequest): Promise<Response> {
    try {
        const message: BodyType = await request.json();
        console.log(" recip sender")
        console.log(message.recipient.id)
        console.log(message.sender.id)
        const jsonString = JSON.stringify(message);
        console.log(jsonString);

        const recipientPageId = message.recipient.id;
        const senderPlatformId = message.sender.id;
        const fbMessage = message;
        if (senderPlatformId === recipientPageId) { // The message is from your page itself (bot) 
            return new Response("ERROR_SAME_SENDER", { status: 400 });
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
            return new Response("ERROR_FETCHING_CHANNEL", { status: 500 });
        }

        if (!channel || !channel.accessToken) {
            console.error(`Channel not found or no access token for recipientPageId: ${recipientPageId}`);
            return new Response("ERROR_CHANNEL_NOT_FOUND", { status: 404 });
        }
        const connectedChannelId = channel.channelId;
        const accessToken = channel.accessToken;

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
                return new Response("ERROR_CREATING_CUSTOMER", { status: 500 });
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
                    chatType: "test"
                });
            } catch (error) {
                console.error(`Error creating chat for customer ${customer.customerId}:`, error);
                return new Response("ERROR_CREATING_CHAT", { status: 500 });
            }
        }

        const internalCustomerId = customer.customerId;
        const customerInfo = `
                Name: ${customer.fullName}
                Contact: ${customer.contact ? customer.contact : "No contact available. If make any order ask contact number."}
                Address: ${customer.address ? customer.address : "No address available. If make any order ask address."}
                `;
        // 3. Initialize Messaging Client
        // This instantiation depends on the actual Facebook Messenger library being used.



        const messageSenderPsid = fbMessage.sender.id; // PSID from the specific message
        let response = new Response("SOMETHING_WRONG", { status: 500 });
        if (fbMessage.content.text) {
            const text = fbMessage.content.text; // Facebook's message ID

            try {
                const messageContent: Omit<typeof messages.$inferInsert, 'messageId' | 'chatId' | 'timestamp'> = {
                    content: text,
                    senderType: 'CUSTOMER', // Assuming message from platform user is 'CUSTOMER'
                    contentType: 'TEXT', // Include platformMessageId if needed
                };
                const lastMsgs = await chatsService.handleNewMessage(
                    messageContent,
                    chat.chatId,
                );

                const replyUserFn = async (msg: unknown) => {
                    const content = typeof msg === 'string' ? msg : JSON.stringify(msg);
                    response = new Response(JSON.stringify({ image: null, msg: content }), { status: 200, headers: { 'Content-Type': 'application/json' } });
                    await chatsService.handleNewMessage(
                        { content, senderType: 'BOT', contentType: 'TEXT', platformMessageId: undefined }, // No platformMessageId for bot messages
                        chat.chatId,
                    );
                }

                const replyUserWithProductImageAndInfoFn = async (productImageURL: string, productInfo: string) => {
                    const content = productInfo
                    response = new Response(JSON.stringify({ image: productImageURL, msg: content }), { status: 200, headers: { 'Content-Type': 'application/json' } });
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
                    customerInfo,
                    replyUserFn,
                    replyUserWithProductImageAndInfoFn,
                    (ms) => console.log(ms) // Log function to capture messages
                );

            } catch (error) {
                console.error(`Failed to handle new text message via chatsService for customer ${internalCustomerId}:`, error);
                return new Response("ERROR_PROCESSING_MESSAGE", { status: 500 });
            }
        } else if (fbMessage.content.image) {


        }


        else {
            console.log(`Received unhandled message type from ${messageSenderPsid}:`, fbMessage.content);
            return new Response("UNHANDLED_MESSAGE_TYPE", { status: 400 });

        }

        return response;
    }

    catch (error) {
        console.error('Error handling message:', error);
        return new Response('Internal Server Error', { status: 500 });
    }

}