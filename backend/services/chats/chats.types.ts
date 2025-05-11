import { chats, customers, connectedChannels, users, messages, chatStatusEnum } from '@/db/schema';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { Customer } from '@/backend/services/customers/customers.types';
import { ConnectedChannel } from '@/backend/services/channels/channels.types';
import { User } from '@/backend/services/users/users.types';
import { Message } from '@/backend/services/messages/messages.types'; // Will be created next

// Base Chat type from schema
export type Chat = InferSelectModel<typeof chats>;
export type NewChat = InferInsertModel<typeof chats>;

// Options for including related entities for a Chat
export interface ChatIncludeOptions {
  customer?: boolean;
  connectedChannel?: boolean;
  // user?: boolean; // The business user // userId removed from chats
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
  filter?: Partial<Pick<Chat, 'customerId' | 'channelId' | 'status'>>; // userId removed from chats
  include?: ChatIncludeOptions;
}

// Data for creating a new Chat
export type CreateChatData = Omit<NewChat, 'chatId' | 'startedAt' | 'lastMessageAt' | 'userId'> & { // userId removed from chats
  customerId: Customer['customerId'];
  channelId: ConnectedChannel['channelId'];
  // userId: User['userId']; // userId removed from chats
};

// Data for updating an existing Chat
export type UpdateChatData = Partial<Pick<NewChat, 'status' | 'lastMessageAt'>>;

// Data for updating many Chats
export interface UpdateManyChatsData {
  status?: Chat['status'];
  // Add other fields suitable for bulk update
}

// Filter options for operations like updateMany or deleteMany Chats
export interface ChatFilterOptions {
  ids?: Chat['chatId'][];
  customerId?: Customer['customerId'];
  channelId?: ConnectedChannel['channelId'];
  // userId?: User['userId']; // userId removed from chats
  status?: Chat['status'];
  startedAtBefore?: Date;
  startedAtAfter?: Date;
  lastMessageAtBefore?: Date;
  lastMessageAtAfter?: Date;
}

// --- Related entity types for inclusion ---
export type ChatWithIncludes = Chat & {
  customer?: Customer;
  connectedChannel?: ConnectedChannel;
  // user?: User; // userId removed from chats
  messages?: Message[];
};
