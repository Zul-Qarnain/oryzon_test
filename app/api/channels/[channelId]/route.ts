import { channelsService } from '@/backend/services/channels/channels.service';
import { ChannelIncludeOptions, UpdateChannelData, ConnectedChannelWithIncludes } from '@/backend/services/channels/channels.types';
import { parseIncludeQuery } from '@/app/api/utils'; // Corrected import path
import { platformTypeEnum } from '@/db/schema';

// Updated valid includes for a channel
const VALID_CHANNEL_INCLUDES: (keyof ChannelIncludeOptions)[] = [
  'business',
  'userViaProviderId', // For the denormalized user link
  'customers',
  'orders',
  'chats',
  // 'products' is no longer a direct relation of connectedChannels for include via service method
];

type PlatformType = typeof platformTypeEnum.enumValues[number]; // This type might not be used in this file anymore

function isPlatformType(value: string): value is PlatformType {
  return platformTypeEnum.enumValues.includes(value as PlatformType);
}

export async function GET(
  request: Request,
  context: { params: Promise<{ channelId: string }> }
) {
  const params = await context.params;
  const { channelId } = params;
  if (!channelId) {
    return new Response(JSON.stringify({ message: 'Channel ID is required' }), { status: 400 });
  }

  try {
    const url = new URL(request.url);
    const includeQuery = url.searchParams.get('include');
    const includeOptions = parseIncludeQuery<ChannelIncludeOptions, keyof ChannelIncludeOptions>(
      includeQuery,
      VALID_CHANNEL_INCLUDES
    );

    const channel = await channelsService.getChannelById(channelId, { include: includeOptions });

    if (!channel) {
      return new Response(JSON.stringify({ message: 'Channel not found' }), { status: 404 });
    }
    return new Response(JSON.stringify(channel), { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ message: 'Internal server error' }), { status: 500 });
  }
}

export async function PUT(request: Request, props: { params: Promise<{ channelId: string }> }) {
  const params = await props.params;
  const { channelId } = params;

  if (!channelId) {
    return new Response(JSON.stringify({ message: 'Channel ID is required' }), { status: 400 });
  }

  try {
    const body = await request.json() as UpdateChannelData;
    // TODO: Add validation for body (e.g. with Zod)
    const updatedChannel = await channelsService.updateChannel(channelId, body);

    if (!updatedChannel) {
      return new Response(JSON.stringify({ message: 'Channel not found' }), { status: 404 });
    }
    return new Response(JSON.stringify(updatedChannel), { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ message: 'Internal server error' }), { status: 500 });
  }
}

export async function DELETE(request: Request, props: { params: Promise<{ channelId: string }> }) {
  const params = await props.params;
  const { channelId } = params;

  if (!channelId) {
    return new Response(JSON.stringify({ message: 'Channel ID is required' }), { status: 400 });
  }

  try {
    const deleted = await channelsService.deleteChannel(channelId);

    if (!deleted) {
      return new Response(JSON.stringify({ message: 'Channel not found' }), { status: 404 });
    }
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ message: 'Internal server error' }), { status: 500 });
  }
}
