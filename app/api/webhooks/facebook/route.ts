import { NextRequest, NextResponse } from 'next/server';
import {
    FacebookMessagingAPIClient,
    FacebookMessageParser,
    FacebookMessagePayloadMessagingEntry as FacebookMessageObject,
} from 'fb-messenger-bot-api';
import { handleNewMessageFromPlatform } from '@/backend/services/messenger/handleMsg';

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
        const messages: FacebookMessageObject[] = FacebookMessageParser.parsePayload(body);

        for (const message of messages) {
            console.log("loll recip sender")
            console.log(message.recipient.id)
            console.log(message.sender.id)
            const jsonString = JSON.stringify(message); 
            console.log(jsonString); 
            if(message.sender.id != message.recipient.id && !message!.message!.is_echo){
          await handleNewMessageFromPlatform(
            message.recipient.id,
            message,
            message.sender.id
          )
            }

        }

        return new Response('EVENT_RECEIVED', { status: 200 });
    } catch (error) {
        console.error('Error handling message:', error);
        return new Response('Internal Server Error', { status: 500 });
    }
}
