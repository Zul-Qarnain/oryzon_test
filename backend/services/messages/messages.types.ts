import { messages, chats, messageSenderTypeEnum, messageContentTypeEnum } from '@/db/schema';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { Chat } from '@/backend/services/chats/chats.types';

// Base Message type from schema
export type Message = InferSelectModel<typeof messages>;
export type NewMessage = InferInsertModel<typeof messages>;

// Options for including related entities for a Message
export interface MessageIncludeOptions {
  chat?: boolean;
}

// Options for GetMessageById
export interface GetMessageByIdOptions {
  include?: MessageIncludeOptions;
}

// Options for GetAllMessages (usually filtered by chatId)
export interface GetAllMessagesOptions {
  limit?: number;
  offset?: number;
  filter: { // chatId is mandatory for fetching messages
    chatId: Chat['chatId'];
    senderType?: Message['senderType'];
    contentType?: Message['contentType'];
    timestampBefore?: Date;
    timestampAfter?: Date;
  };
  include?: MessageIncludeOptions;
  orderBy?: { field: keyof Message; direction: 'asc' | 'desc' };
}

// Data for creating a new Message
export type CreateMessageData = Omit<NewMessage, 'messageId' | 'timestamp'> & {
  chatId: Chat['chatId']; // Ensure chatId is provided
};

// Data for updating an existing Message (Messages are often immutable)
export type UpdateMessageData = Partial<Pick<NewMessage, 'content'>>; // Example: only content updatable

// Filter options for operations like updateMany or deleteMany Messages
export interface MessageFilterOptions {
  ids?: Message['messageId'][];
  chatId?: Chat['chatId'];
  senderType?: Message['senderType'];
  contentType?: Message['contentType'];
  timestampBefore?: Date;
  timestampAfter?: Date;
}

// --- Related entity types for inclusion ---
export type MessageWithIncludes = Message & {
  chat?: Chat;
};
