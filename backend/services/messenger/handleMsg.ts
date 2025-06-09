import { channelsService } from '../channels/channels.service';
import { customersService } from '../customers/customers.service';
import { chatsService } from '../chats/chats.service';
// Assuming these are the correct imports from your Facebook Messenger library
import { FacebookMessageParser, FacebookMessagePayloadMessagingEntry as FacebookMessageObject, FacebookMessagingAPIClient } from 'fb-messenger-bot-api';
import { Customer } from '../customers/customers.types';
import { ConnectedChannelWithIncludes } from '../channels/channels.types';
import { messages } from '@/db/schema';
import { Chat } from '../chats/chats.types';
import { executeAgent } from '../ai/manager';



export async function handleNewMessageFromPlatform(
    recipientPageId: string, // The Facebook Page ID for which the message is intended
    fbMessage: FacebookMessageObject, // The parsed message object from Facebook
    senderPlatformId: string // The PSID of the user who sent the message
): Promise<void> {
   // Check if the message is from the page itself (bot message)
   // In Facebook Messenger, when your bot sends a message, the sender.id will be the page ID
   if (senderPlatformId === recipientPageId || fbMessage.sender.id === recipientPageId) { 
       console.log('Ignoring message from page itself (bot message)');
       return; 
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
        return;
    }

    if (!channel || !channel.accessToken) {
        console.error(`Channel not found or no access token for recipientPageId: ${recipientPageId}`);
        return;
    }
    const connectedChannelId = channel.channelId;
    const accessToken = channel.accessToken;

    // 2. Find or create Customer using senderPlatformId

    let customer: Customer | null = channel.customers?.[0] || null;
    let chat:Chat | null = channel.chats?.[0] || null;

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
            return;
        }

    }

    if(!chat) {
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
            return;
        }
    }

    const internalCustomerId = customer.customerId;

    // 3. Initialize Messaging Client
    // This instantiation depends on the actual Facebook Messenger library being used.
    const messagingClient = new FacebookMessagingAPIClient(accessToken);


    const messageSenderPsid = fbMessage.sender.id; // PSID from the specific message

    // Additional safety check - make sure we're not processing our own messages
    if (messageSenderPsid === recipientPageId) {
        console.log('Detected bot message by sender PSID, ignoring');
        return;
    }

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
                } catch (error) {
                    console.error(`Failed to send unsupported attachment type notice to ${messageSenderPsid}:`, error);
                }
            }
        }
    } else if (fbMessage.message?.text) {
        const text = fbMessage.message.text;
        const platformMessageId = fbMessage.message.mid; // Facebook's message ID

        try {
            const messageContent: Omit<typeof messages.$inferInsert, 'messageId' | 'chatId' | 'timestamp' > = {
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
                channel.business!.businessId
            );
            if (AIResponse) {
                try {
                    
                    const content = typeof AIResponse === 'string' ? AIResponse : JSON.stringify(AIResponse);
                    await messagingClient.sendTextMessage(messageSenderPsid, content);
                    await chatsService.handleNewMessage(
                        { content, senderType: 'BOT', contentType: 'TEXT', platformMessageId: undefined }, // No platformMessageId for bot messages
                        chat.chatId,
                    );
