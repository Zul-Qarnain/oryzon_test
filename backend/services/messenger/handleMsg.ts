import { channelsService } from '../channels/channels.service';
import { customersService } from '../customers/customers.service';
import { chatsService } from '../chats/chats.service';
// Assuming these are the correct imports from your Facebook Messenger library
import { FacebookMessageParser, FacebookMessagePayloadMessagingEntry as FacebookMessageObject, FacebookMessagingAPIClient } from 'fb-messenger-bot-api';
import { Customer } from '../customers/customers.types';
import { ConnectedChannelWithIncludes } from '../channels/channels.types';

// Define the structure for message content for chatsService.handleNewMessage
// This should align with the Omit<> type in chatsService.handleNewMessage signature
type ChatMessageContent = {
    content: string;
    senderType: 'CUSTOMER' | 'AGENT' | 'BOT'; // Or your specific enum values
    contentType: 'TEXT' | 'IMAGE' | 'VIDEO'; // Or your specific enum values
    // platformMessageId is omitted as per chatsService.handleNewMessage signature
    // direction?: 'INBOUND' | 'OUTBOUND'; // If your schema supports it and it's not omitted
};


export async function handleNewMessageFromPlatform(
    recipientPageId: string, // The Facebook Page ID for which the message is intended
    fbMessage: FacebookMessageObject, // The parsed message object from Facebook
    senderPlatformId: string // The PSID of the user who sent the message
): Promise<void> {

    // 1. Find ConnectedChannel using recipientPageId
    let channel: ConnectedChannelWithIncludes | undefined;
    try {
        const { data } = await channelsService.getAllChannels({
            filter: { platformSpecificId: recipientPageId },
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

    let customer: Customer | null = null;
    try {
        const { data: [existingCustomer] } = await customersService.getAllCustomers({
            filter: { platformCustomerId: senderPlatformId, channelId: connectedChannelId },
            limit: 1,
        });

        if (existingCustomer) {
            customer = existingCustomer;
        } else {
            customer = await customersService.createCustomer({
                platformCustomerId: senderPlatformId,
                channelId: connectedChannelId,
                fullName: `User ${senderPlatformId}`, // Basic default name
                // email, phone can be added if available later
                // firstSeenAt and lastSeenAt are typically handled by the service/DB
            });
        }
    } catch (error) {
        console.error(`Error finding or creating customer for senderPlatformId ${senderPlatformId}:`, error);
        return;
    }

    if (!customer) {
        console.error(`Failed to find or create customer for senderPlatformId: ${senderPlatformId}`);
        return;
    }
    const internalCustomerId = customer.customerId;

    // 3. Initialize Messaging Client
    // This instantiation depends on the actual Facebook Messenger library being used.
    const messagingClient = new FacebookMessagingAPIClient(accessToken);


    const messageSenderPsid = fbMessage.sender.id; // PSID from the specific message

    if (fbMessage.message?.attachments) {
        for (const attachment of fbMessage.message.attachments) {
            if (attachment.type === 'image' && attachment.payload && 'url' in attachment.payload) {
                const imageUrl = attachment.payload.url;

                try {
                    //handleImageMessage
                    const messageContent: ChatMessageContent = {
                        content: imageUrl,
                        senderType: 'CUSTOMER', // Assuming message from platform user is 'CUSTOMER'
                        contentType: 'IMAGE',
                        // platformMessageId is intentionally not included here if omitted by chatsService.handleNewMessage
                    };
        
                    // If your chatsService.handleNewMessage was updated to accept platformMessageId in its first argument:
                    // (messageContent as any).platformMessageId = platformMessageId; 
                    // Or adjust ChatMessageContent and the Omit in chatsService.
        
                    await chatsService.handleNewMessage(
                        messageContent,
                        internalCustomerId,
                        connectedChannelId
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
            const messageContent: ChatMessageContent = {
                content: text,
                senderType: 'CUSTOMER', // Assuming message from platform user is 'CUSTOMER'
                contentType: 'TEXT',
                // platformMessageId is intentionally not included here if omitted by chatsService.handleNewMessage
            };

            // If your chatsService.handleNewMessage was updated to accept platformMessageId in its first argument:
            // (messageContent as any).platformMessageId = platformMessageId; 
            // Or adjust ChatMessageContent and the Omit in chatsService.

            await chatsService.handleNewMessage(
                messageContent,
                internalCustomerId,
                connectedChannelId
            );
        } catch (error) {
            console.error(`Failed to handle new text message via chatsService for customer ${internalCustomerId}:`, error);
            try {
                await messagingClient.sendTextMessage(messageSenderPsid, "Sorry, we couldn't process your message at this time.");
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
        } catch (error) {
            console.error(`Failed to send unhandled message type notice to ${messageSenderPsid}:`, error);
        }
    }
}

