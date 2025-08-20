import { chats, customers, connectedChannels, users, messages, chatStatusEnum, businesses } from '@/db/schema';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { Customer } from '@/backend/services/customers/customers.types';
import { ConnectedChannel } from '@/backend/services/channels/channels.types';
import { User } from '@/backend/services/users/users.types';
import { Message } from '@/backend/services/messages/messages.types';
import { Business } from '@/backend/services/businesses/businesses.types';

// Base Chat type from schema
export type Chat = InferSelectModel<typeof chats>;
export type NewChat = InferInsertModel<typeof chats>;

// Options for including related entities for a Chat
export interface ChatIncludeOptions {
  business?: boolean; // Chat now belongs to a Business
  userViaProviderId?: boolean; // For the denormalized user link
  customer?: boolean;
  connectedChannel?: boolean;
  messages?: { limit?: number; offset?: number; orderBy?: { field: keyof Message; direction: 'asc' | 'desc' } } | boolean;
}

// Options for GetChatById
export interface GetChatByIdOptions {
  include?: ChatIncludeOptions;
}

// Options for GetAllChats
export interface GetAllChatsOptions {
  limit?: number;
  offset?: number;
  filter?: Partial<Pick<Chat, 'businessId' | 'providerUserId' | 'platformCustomerId' | 'channelId' | 'status' | 'chatType'>>;
  include?: ChatIncludeOptions;
}

// Data for creating a new Chat
export type CreateChatData = Omit<NewChat, 'chatId' | 'startedAt' | 'lastMessageAt' | 'providerUserId' | 'customerId'> & { // customerId removed as it's not in NewChat anymore
  businessId: Business['businessId'];
  platformCustomerId: Customer['platformCustomerId']; // Changed from customerId
  channelId: ConnectedChannel['channelId'];
  providerUserId?: User['providerUserId'] | null; // Optional, as it's nullable and denormalized
};

// Data for updating an existing Chat
// businessId, customerId, channelId should generally not be updatable.
export type UpdateChatData = Partial<Pick<NewChat, 'status' | 'lastMessageAt' | 'providerUserId'>>;

// Data for updating many Chats
export interface UpdateManyChatsData {
  status?: Chat['status'];
  // Add other fields suitable for bulk update
}

// Filter options for operations like updateMany or deleteMany Chats
export interface ChatFilterOptions {
  ids?: Chat['chatId'][];
  businessId?: Business['businessId'];
  providerUserId?: User['providerUserId'] | null;
  platformCustomerId?: Customer['platformCustomerId']; // Changed from customerId
  channelId?: ConnectedChannel['channelId'];
  status?: Chat['status'];
  chatType?: Chat['chatType'];
  startedAtBefore?: Date;
  startedAtAfter?: Date;
  lastMessageAtBefore?: Date;
  lastMessageAtAfter?: Date;
}

// --- Related entity types for inclusion ---
export type ChatWithIncludes = Chat & {
  business?: Business;
  userViaProviderId?: User | null;
  customer?: Customer;
  connectedChannel?: ConnectedChannel | null; // Assuming connectedChannel can be null like in Orders
  messages?: Message[];
};
