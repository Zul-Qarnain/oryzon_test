import { db } from '@/db';
import { connectedChannels, users, customers, orders, chats, products, businesses } from '@/db/schema'; // Added businesses
import {
  ConnectedChannel,
  NewConnectedChannel, // Added import for NewConnectedChannel
  CreateChannelData,
  UpdateChannelData,
  GetChannelByIdOptions,
  GetAllChannelsOptions,
  ChannelFilterOptions,
  UpdateManyChannelsData,
  ConnectedChannelWithIncludes,
} from './channels.types';
import { and, count, eq, ilike, inArray, desc } from 'drizzle-orm';

export class ChannelsService {
  constructor() {}

  async createChannel(data: CreateChannelData): Promise<ConnectedChannel> {
    // Note: access_token and refresh_token should be encrypted before saving
    const newChannelData: NewConnectedChannel = {
      businessId: data.businessId,
      platformType: data.platformType,
      platformSpecificId: data.platformSpecificId,
      providerUserId: data.providerUserId, // Can be null or undefined
      // Optional fields from CreateChannelData
      description: data.description,
      channelName: data.channelName,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      tokenExpiresAt: data.tokenExpiresAt,
      isActive: data.isActive,
    };
    const [newChannel] = await db.insert(connectedChannels).values(newChannelData).returning();
    return newChannel;
  }

  async getChannelById(channelId: string, options?: GetChannelByIdOptions): Promise<ConnectedChannelWithIncludes | null> {
    const query = db.query.connectedChannels.findFirst({
      where: eq(connectedChannels.channelId, channelId),
      with: {
        business: options?.include?.business ? true : undefined,
        userViaProviderId: options?.include?.userViaProviderId ? true : undefined, // For denormalized user
        customers: options?.include?.customers 
          ? { 
              limit: typeof options.include.customers === 'boolean' ? undefined : options.include.customers.limit,
            } 
          : undefined,
        orders: options?.include?.orders 
          ? { 
              limit: typeof options.include.orders === 'boolean' ? undefined : options.include.orders.limit,
            } 
          : undefined,
        chats: options?.include?.chats 
          ? { 
              limit: typeof options.include.chats === 'boolean' ? undefined : options.include.chats.limit,
            } 
          : undefined,
        // products: relation not directly on connectedChannels in schema, will be undefined if requested via this type
      }
    });
    const channel = await query;
    return channel || null;
  }

  async getAllChannels(options?: GetAllChannelsOptions): Promise<{ data: ConnectedChannelWithIncludes[]; total: number }> {
    const page = options?.limit ?? 10;
    const offset = options?.offset ?? 0;

    const filter = options?.filter as ChannelFilterOptions | undefined; // Type is Partial<Pick<ConnectedChannel, ...>>
    const conditions = [];

    if (filter?.businessId) {
      conditions.push(eq(connectedChannels.businessId, filter.businessId));
    }
    if (filter?.providerUserId) { // This filters the denormalized providerUserId on connectedChannels
      conditions.push(eq(connectedChannels.providerUserId, filter.providerUserId));
    }
    if (filter?.platformType) {
      conditions.push(eq(connectedChannels.platformType, filter.platformType));
    }
    if (filter?.isActive !== undefined) {
      conditions.push(eq(connectedChannels.isActive, filter.isActive));
    }
    if (filter?.channelName) {
      conditions.push(ilike(connectedChannels.channelName, `%${filter.channelName}%`));
    }
    if (filter?.description) {
      conditions.push(ilike(connectedChannels.description, `%${filter.description}%`));
    }
    if (filter?.platformSpecificId) {
        conditions.push(eq(connectedChannels.platformSpecificId, filter.platformSpecificId));
    }
     if (filter?.createdAtBefore) {
      conditions.push(eq(connectedChannels.createdAt, filter.createdAtBefore));
    }
    if (filter?.createdAtAfter) {
      conditions.push(eq(connectedChannels.createdAt, filter.createdAtAfter));
    }


    const channelsQuery = db.query.connectedChannels.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      limit: page,
      offset: offset,
      with: {
        business: options?.include?.business ? true : undefined,
        userViaProviderId: options?.include?.userViaProviderId ? true : undefined,
        customers: options?.include?.customers 
          ? { 
              limit: typeof options.include.customers === 'boolean' ? undefined : options.include.customers.limit,
            } 
          : undefined,
        orders: options?.include?.orders 
          ? { 
              limit: typeof options.include.orders === 'boolean' ? undefined : options.include.orders.limit,
            } 
          : undefined,
        chats: options?.include?.chats 
          ? { 
              limit: typeof options.include.chats === 'boolean' ? undefined : options.include.chats.limit,
            } 
          : undefined,
        // products: relation not directly on connectedChannels in schema
      },
      orderBy: [desc(connectedChannels.createdAt)]
    });

    const totalQuery = db.select({ value: count() }).from(connectedChannels).where(conditions.length > 0 ? and(...conditions) : undefined);
    // Removed duplicate totalQuery declaration

    const [data, totalResult] = await Promise.all([channelsQuery, totalQuery]);
    
    return { data, total: totalResult[0]?.value ?? 0 };
  }

  async updateChannel(channelId: string, data: UpdateChannelData): Promise<ConnectedChannel | null> {
    // businessId is not part of UpdateChannelData and should not be updated here.
    // providerUserId can be updated if present in data.
    const [updatedChannel] = await db
      .update(connectedChannels)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(connectedChannels.channelId, channelId))
      .returning();
    return updatedChannel || null;
  }

  async updateManyChannels(filter: ChannelFilterOptions, data: UpdateManyChannelsData): Promise<{ count: number }> {
    if (!filter.ids || filter.ids.length === 0) {
      return { count: 0 };
    }
    const result = await db
      .update(connectedChannels)
      .set({ ...data, updatedAt: new Date() })
      .where(inArray(connectedChannels.channelId, filter.ids as string[]));
      
    return { count: result.rowCount ?? 0 };
  }

  async deleteChannel(channelId: string): Promise<boolean> {
    // Consider implications: what happens to customers, orders, chats on this channel?
    // Soft delete might be preferable, or cascading deletes if handled by DB.
    const result = await db.delete(connectedChannels).where(eq(connectedChannels.channelId, channelId));
    return (result.rowCount ?? 0) > 0;
  }

  async deleteManyChannels(filter: ChannelFilterOptions): Promise<{ count: number }> {
    if (!filter.ids || filter.ids.length === 0) {
      return { count: 0 };
    }
    const result = await db.delete(connectedChannels).where(inArray(connectedChannels.channelId, filter.ids as string[]));
    return { count: result.rowCount ?? 0 };
  }
}

export const channelsService = new ChannelsService();
