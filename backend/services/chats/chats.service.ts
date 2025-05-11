import { db } from '@/db';
import { chats, messages, customers, connectedChannels, users } from '@/db/schema';
import {
  Chat,
  CreateChatData,
  UpdateChatData,
  GetChatByIdOptions,
  GetAllChatsOptions,
  ChatFilterOptions,
  UpdateManyChatsData,
  ChatWithIncludes,
} from './chats.types';
import { and, count, eq, ilike, inArray, desc, asc, gte, lte } from 'drizzle-orm';

export class ChatsService {
  constructor() {}

  async createChat(data: CreateChatData): Promise<Chat> {
    const [newChat] = await db
      .insert(chats)
      .values({
        ...data,
        status: data.status || 'OPEN', // Default status
      })
      .returning();
    return newChat;
  }

  async getChatById(chatId: string, options?: GetChatByIdOptions): Promise<ChatWithIncludes | null> {
    const query = db.query.chats.findFirst({
      where: eq(chats.chatId, chatId),
      with: {
        customer: options?.include?.customer ? true : undefined,
        connectedChannel: options?.include?.connectedChannel ? true : undefined,
        user: options?.include?.user ? true : undefined,
        messages: options?.include?.messages 
          ? { 
              limit: typeof options.include.messages === 'boolean' ? undefined : options.include.messages.limit,
              orderBy: (messagesTable, { asc, desc }) => {
                if (typeof options.include?.messages === 'object' && options.include.messages.orderBy) {
                  const { field, direction } = options.include.messages.orderBy;
                  // Ensure field is a valid column of messagesTable
                  if (field in messagesTable) {
                    return [direction === 'asc' ? asc(messagesTable[field]) : desc(messagesTable[field])];
                  }
                }
                return [desc(messagesTable.timestamp)]; // Default order for messages
              }
            } 
          : undefined,
      }
    });
    const chat = await query;
    return chat || null;
  }

  async getAllChats(options?: GetAllChatsOptions): Promise<{ data: ChatWithIncludes[]; total: number }> {
    const page = options?.limit ?? 10;
    const offset = options?.offset ?? 0;

    const filter = options?.filter as ChatFilterOptions | undefined;
    const conditions = [];

    if (filter?.customerId) {
      conditions.push(eq(chats.customerId, filter.customerId));
    }
    if (filter?.channelId) {
      conditions.push(eq(chats.channelId, filter.channelId));
    }
    if (filter?.userId) {
      conditions.push(eq(chats.userId, filter.userId));
    }
    if (filter?.status) {
      conditions.push(eq(chats.status, filter.status));
    }
    if (filter?.startedAtBefore) {
      conditions.push(lte(chats.startedAt, filter.startedAtBefore));
    }
    if (filter?.startedAtAfter) {
      conditions.push(gte(chats.startedAt, filter.startedAtAfter));
    }
    if (filter?.lastMessageAtBefore) {
      conditions.push(lte(chats.lastMessageAt, filter.lastMessageAtBefore));
    }
    if (filter?.lastMessageAtAfter) {
      conditions.push(gte(chats.lastMessageAt, filter.lastMessageAtAfter));
    }

    const chatsQuery = db.query.chats.findMany({
      where: and(...conditions),
      limit: page,
      offset: offset,
      with: {
        customer: options?.include?.customer ? true : undefined,
        connectedChannel: options?.include?.connectedChannel ? true : undefined,
        user: options?.include?.user ? true : undefined,
        messages: options?.include?.messages 
          ? { 
              limit: typeof options.include.messages === 'boolean' ? undefined : options.include.messages.limit,
               orderBy: (messagesTable, { asc, desc }) => {
                if (typeof options.include?.messages === 'object' && options.include.messages.orderBy) {
                  const { field, direction } = options.include.messages.orderBy;
                   if (field in messagesTable) {
                    return [direction === 'asc' ? asc(messagesTable[field]) : desc(messagesTable[field])];
                  }
                }
                return [desc(messagesTable.timestamp)];
              }
            } 
          : undefined,
      },
      orderBy: [desc(chats.lastMessageAt), desc(chats.startedAt)]
    });

    const totalQuery = db.select({ value: count() }).from(chats).where(and(...conditions));

    const [data, totalResult] = await Promise.all([chatsQuery, totalQuery]);
    
    return { data, total: totalResult[0]?.value ?? 0 };
  }

  async updateChat(chatId: string, data: UpdateChatData): Promise<Chat | null> {
    const [updatedChat] = await db
      .update(chats)
      .set({ ...data }) // Removed updatedAt as it's not in the schema
      .where(eq(chats.chatId, chatId))
      .returning();
    return updatedChat || null;
  }

  async updateManyChats(filter: ChatFilterOptions, data: UpdateManyChatsData): Promise<{ count: number }> {
    if (!filter.ids || filter.ids.length === 0) {
      return { count: 0 };
    }
    const result = await db
      .update(chats)
      .set({ ...data }) // Removed updatedAt as it's not in the schema
      .where(inArray(chats.chatId, filter.ids as string[]));
      
    return { count: result.rowCount ?? 0 };
  }

  async deleteChat(chatId: string): Promise<boolean> {
    // Consider implications: what happens to messages in this chat?
    // Soft delete might be preferable.
    const result = await db.delete(chats).where(eq(chats.chatId, chatId));
    return (result.rowCount ?? 0) > 0;
  }

  async deleteManyChats(filter: ChatFilterOptions): Promise<{ count: number }> {
    if (!filter.ids || filter.ids.length === 0) {
      return { count: 0 };
    }
    const result = await db.delete(chats).where(inArray(chats.chatId, filter.ids as string[]));
    return { count: result.rowCount ?? 0 };
  }
}

export const chatsService = new ChatsService();
