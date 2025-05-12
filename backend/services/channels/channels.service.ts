import { db } from '@/db';
import { connectedChannels, users, customers, orders, chats, products } from '@/db/schema'; // Added products
import {
  ConnectedChannel,
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
    // This service assumes they are already encrypted if they need to be.
    const [newChannel] = await db.insert(connectedChannels).values(data).returning();
    return newChannel;
  }

  async getChannelById(channelId: string, options?: GetChannelByIdOptions): Promise<ConnectedChannelWithIncludes | null> {
    const query = db.query.connectedChannels.findFirst({
      where: eq(connectedChannels.channelId, channelId),
      with: {
        user: options?.include?.user ? true : undefined,
        customers: options?.include?.customers 
          ? { 
              limit: typeof options.include.customers === 'boolean' ? undefined : options.include.customers.limit,
              // offset not directly supported in nested 'with'
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
        products: options?.include?.products // Add products include
          ? {
              limit: typeof options.include.products === 'boolean' ? undefined : options.include.products.limit,
            }
          : undefined,
      }
    });
    const channel = await query;
    return channel || null;
  }

  async getAllChannels(options?: GetAllChannelsOptions): Promise<{ data: ConnectedChannelWithIncludes[]; total: number }> {
    const page = options?.limit ?? 10;
    const offset = options?.offset ?? 0;

    const filter = options?.filter as ChannelFilterOptions | undefined;
    const conditions = [];

    if (filter?.userId) {
      conditions.push(eq(connectedChannels.userId, filter.userId));
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
      where: and(...conditions),
      limit: page,
      offset: offset,
      with: {
        user: options?.include?.user ? true : undefined,
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
        products: options?.include?.products // Add products include
          ? {
              limit: typeof options.include.products === 'boolean' ? undefined : options.include.products.limit,
            }
          : undefined,
      },
      orderBy: [desc(connectedChannels.createdAt)]
    });

    const totalQuery = db.select({ value: count() }).from(connectedChannels).where(and(...conditions));

    const [data, totalResult] = await Promise.all([channelsQuery, totalQuery]);
    
    return { data, total: totalResult[0]?.value ?? 0 };
  }

  async updateChannel(channelId: string, data: UpdateChannelData): Promise<ConnectedChannel | null> {
    // Ensure userId is not updated this way
    const { ...updateData } = data;
    const [updatedChannel] = await db
      .update(connectedChannels)
      .set({ ...updateData, updatedAt: new Date() })
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
