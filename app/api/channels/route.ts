import { channelsService } from '@/backend/services/channels/channels.service';
import { ChannelIncludeOptions, GetAllChannelsOptions, CreateChannelData } from '@/backend/services/channels/channels.types';
import { parseIncludeQuery, parsePaginationParams, getStringFilterParam } from '../utils';
import { platformTypeEnum } from '@/db/schema';

const VALID_CHANNEL_INCLUDES: (keyof ChannelIncludeOptions)[] = [
  'user',
  'customers',
  'orders',
  'chats',
];

type PlatformType = typeof platformTypeEnum.enumValues[number];

function isPlatformType(value: string): value is PlatformType {
  return platformTypeEnum.enumValues.includes(value as PlatformType);
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const includeQuery = searchParams.get('include');
    const { limit, offset } = parsePaginationParams(searchParams, 10, 0, 100);

    const userId = getStringFilterParam(searchParams, 'userId');
    const platformType = getStringFilterParam(searchParams, 'platformType');
    const isActive = getStringFilterParam(searchParams, 'isActive');
    const channelName = getStringFilterParam(searchParams, 'channelName');

    const includeOptions = parseIncludeQuery<ChannelIncludeOptions, keyof ChannelIncludeOptions>(
      includeQuery,
      VALID_CHANNEL_INCLUDES
    );

    const options: GetAllChannelsOptions = {
      include: includeOptions,
      limit,
      offset,
      filter: {},
    };

    if (userId) options.filter!.userId = userId;
    if (platformType && isPlatformType(platformType)) options.filter!.platformType = platformType;
    if (isActive !== null && isActive !== undefined) options.filter!.isActive = isActive === 'true';
    if (channelName) options.filter!.channelName = channelName;

    const result = await channelsService.getAllChannels(options);
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ message: 'Internal server error' }), { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as CreateChannelData;
    // TODO: Add validation for body (e.g. with Zod)
    const newChannel = await channelsService.createChannel(body);
    return new Response(JSON.stringify(newChannel), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ message: 'Internal server error' }), { status: 500 });
  }
}
