import { chatsService } from '@/backend/services/chats/chats.service';
import { ChatIncludeOptions, GetAllChatsOptions, CreateChatData } from '@/backend/services/chats/chats.types';
import { parseIncludeQuery, parsePaginationParams, getStringFilterParam } from '../utils';
import { chatStatusEnum } from '@/db/schema';

const VALID_CHAT_INCLUDES: (keyof ChatIncludeOptions)[] = [
  'customer',
  'connectedChannel',
  // 'user', // userId removed from chats
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

    const customerId = getStringFilterParam(searchParams, 'customerId');
    const channelId = getStringFilterParam(searchParams, 'channelId');
    // const userId = getStringFilterParam(searchParams, 'userId'); // userId removed from chats
    const status = getStringFilterParam(searchParams, 'status');

    const includeOptions = parseIncludeQuery<ChatIncludeOptions, keyof ChatIncludeOptions>(
      includeQuery,
      VALID_CHAT_INCLUDES
    );

    const options: GetAllChatsOptions = {
      include: includeOptions,
      limit,
      offset,
      filter: {},
    };

    if (customerId) options.filter!.customerId = customerId;
    if (channelId) options.filter!.channelId = channelId;
    // if (userId) options.filter!.userId = userId; // userId removed from chats
    if (status) options.filter!.status = status as ChatStatus;

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
    const newChat = await chatsService.createChat(body);
    return new Response(JSON.stringify(newChat), { status: 201 });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ message: 'Internal server error' }), { status: 500 });
  }
}
