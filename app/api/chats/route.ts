import { chatsService } from '@/backend/services/chats/chats.service';
import { ChatIncludeOptions, GetAllChatsOptions, CreateChatData, Chat } from '@/backend/services/chats/chats.types'; // Added Chat
import { parseIncludeQuery, parsePaginationParams, getStringFilterParam } from '@/app/api/utils'; // Corrected import path
import { chatStatusEnum } from '@/db/schema';

// Updated valid includes for a chat
const VALID_CHAT_INCLUDES: (keyof ChatIncludeOptions)[] = [
  'business',
  'userViaProviderId',
  'customer',
  'connectedChannel',
  'messages',
];

type ChatStatus = typeof chatStatusEnum.enumValues[number];

function isChatStatus(value: string): value is ChatStatus {
  return chatStatusEnum.enumValues.includes(value as ChatStatus);
}


export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const includeQuery = searchParams.get('include');
    const { limit, offset } = parsePaginationParams(searchParams, 10, 0, 100);

    const businessId = getStringFilterParam(searchParams, 'businessId'); // New filter
    const providerUserId = getStringFilterParam(searchParams, 'providerUserId'); // New filter
    const platformCustomerId = getStringFilterParam(searchParams, 'platformCustomerId'); // Changed from customerId
    const channelId = getStringFilterParam(searchParams, 'channelId');
    const status = getStringFilterParam(searchParams, 'status');

    const includeOptions = parseIncludeQuery<ChatIncludeOptions, keyof ChatIncludeOptions>(
      includeQuery,
      VALID_CHAT_INCLUDES
    );

    const options: GetAllChatsOptions = {
      include: includeOptions,
      limit,
      offset,
      filter: {} as Partial<Pick<Chat, 'businessId' | 'providerUserId' | 'platformCustomerId' | 'channelId' | 'status'>>, // Initialize filter
    };

    if (businessId) options.filter!.businessId = businessId;
    if (providerUserId) options.filter!.providerUserId = providerUserId;
    if (platformCustomerId) options.filter!.platformCustomerId = platformCustomerId; // Changed from customerId
    if (channelId) options.filter!.channelId = channelId;
    if (status && isChatStatus(status)) options.filter!.status = status;


    const result = await chatsService.getAllChats(options);
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ message: 'Internal server error' }), { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as CreateChatData;
    // TODO: Add validation for body (e.g. with Zod)
    // Ensure businessId, platformCustomerId, and channelId are provided
    if (!body.businessId || !body.platformCustomerId || !body.channelId) { // Changed from customerId
      return new Response(JSON.stringify({ message: 'businessId, platformCustomerId, and channelId are required' }), { status: 400 });
    }
    // providerUserId is optional

    const newChat = await chatsService.createChat(body);
    return new Response(JSON.stringify(newChat), { status: 201 });
  } catch (error) {
    console.error('Error creating chat:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ message: 'Internal server error', error: errorMessage }), { status: 500 });
  }
}
