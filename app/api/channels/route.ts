import { channelsService } from '@/backend/services/channels/channels.service';
import { ChannelIncludeOptions, GetAllChannelsOptions, CreateChannelData, ConnectedChannel } from '@/backend/services/channels/channels.types';
import { parseIncludeQuery, parsePaginationParams, getStringFilterParam } from '@/app/api/utils'; // Corrected import path
import { platformTypeEnum } from '@/db/schema';

// Updated valid includes for a channel
const VALID_CHANNEL_INCLUDES: (keyof ChannelIncludeOptions)[] = [
  'business',
  'userViaProviderId',
  'customers',
  'orders',
  'chats',
  // 'products' is no longer a direct relation
];

type PlatformType = typeof platformTypeEnum.enumValues[number]; // This type might not be used in this file anymore

function isPlatformType(value: string): value is PlatformType {
  return platformTypeEnum.enumValues.includes(value as PlatformType);
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const includeQuery = searchParams.get('include');
    const { limit, offset } = parsePaginationParams(searchParams, 10, 0, 100);

    const businessId = getStringFilterParam(searchParams, 'businessId'); // Add businessId filter
    const providerUserId = getStringFilterParam(searchParams, 'providerUserId'); // For denormalized field
    const platformType = getStringFilterParam(searchParams, 'platformType');
    const isActive = getStringFilterParam(searchParams, 'isActive');
    const channelName = getStringFilterParam(searchParams, 'channelName');
    const description = getStringFilterParam(searchParams, 'description');

    const includeOptions = parseIncludeQuery<ChannelIncludeOptions, keyof ChannelIncludeOptions>(
      includeQuery,
      VALID_CHANNEL_INCLUDES
    );

    const options: GetAllChannelsOptions = {
      include: includeOptions,
      limit,
      offset,
      filter: {} as Partial<Pick<ConnectedChannel, 'businessId' | 'providerUserId' | 'platformType' | 'isActive' | 'channelName'| 'platformSpecificId' | 'description'>>, // Initialize filter
    };

    if (businessId) options.filter!.businessId = businessId;
    if (providerUserId) options.filter!.providerUserId = providerUserId;
    if (platformType && isPlatformType(platformType)) options.filter!.platformType = platformType;
    if (isActive !== null && isActive !== undefined) options.filter!.isActive = isActive === 'true';
    if (channelName) options.filter!.channelName = channelName;
    if (description) options.filter!.description = description;
    // Add other filters from GetAllChannelsOptions.filter if needed, e.g., platformSpecificId

    const result = await channelsService.getAllChannels(options);
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ message: 'Internal server error' }), { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as CreateChannelData;
    // TODO: Add validation for body (e.g. with Zod)
    // Ensure businessId is provided, as it's mandatory in CreateChannelData
    if (!body.businessId || !body.platformType || !body.platformSpecificId) {
      return new Response(JSON.stringify({ message: 'businessId, platformType, and platformSpecificId are required' }), { status: 400 });
    }
    // providerUserId is optional in CreateChannelData

    const newChannel = await channelsService.createChannel(body);
    return new Response(JSON.stringify(newChannel), { status: 201 });
  } catch (error) {
    console.error('Error creating channel:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ message: 'Internal server error', error: errorMessage }), { status: 500 });
  }
}
