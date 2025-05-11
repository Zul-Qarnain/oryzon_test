import { connectedChannels, users, customers, orders, chats, platformTypeEnum } from '@/db/schema';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { User } from '@/backend/services/users/users.types';
import { Customer } from '@/backend/services/customers/customers.types'; // Placeholder, will be created
import { Order } from '@/backend/services/orders/orders.types';       // Placeholder, will be created
import { Chat } from '@/backend/services/chats/chats.types';          // Placeholder, will be created

// Base ConnectedChannel type from schema
export type ConnectedChannel = InferSelectModel<typeof connectedChannels>;
export type NewConnectedChannel = InferInsertModel<typeof connectedChannels>;

// Options for including related entities
export interface ChannelIncludeOptions {
  user?: boolean;
  customers?: { limit?: number; offset?: number } | boolean;
  orders?: { limit?: number; offset?: number } | boolean;
  chats?: { limit?: number; offset?: number } | boolean;
}

// Options for GetById
export interface GetChannelByIdOptions {
  include?: ChannelIncludeOptions;
}

// Options for GetAll
export interface GetAllChannelsOptions {
  limit?: number;
  offset?: number;
  filter?: Partial<Pick<ConnectedChannel, 'userId' | 'platformType' | 'isActive' | 'channelName'>>;
  include?: ChannelIncludeOptions;
}

// Data for creating a new channel
export type CreateChannelData = Omit<NewConnectedChannel, 'channelId' | 'createdAt' | 'updatedAt'> & {
  userId: User['userId']; // Ensure userId is provided
};

// Data for updating an existing channel
export type UpdateChannelData = Partial<Omit<NewConnectedChannel, 'channelId' | 'userId' | 'createdAt' | 'updatedAt'>>;

// Data for updating many channels
export interface UpdateManyChannelsData {
  isActive?: ConnectedChannel['isActive'];
  // Add other fields suitable for bulk update
}

// Filter options for operations like updateMany or deleteMany
export interface ChannelFilterOptions {
  ids?: ConnectedChannel['channelId'][];
  userId?: User['userId'];
  platformType?: ConnectedChannel['platformType'];
  isActive?: ConnectedChannel['isActive'];
  platformSpecificId?: ConnectedChannel['platformSpecificId'];
  createdAtBefore?: Date;
  createdAtAfter?: Date;
}

// --- Related entity types for inclusion ---
export type ConnectedChannelWithIncludes = ConnectedChannel & {
  user?: User;
  customers?: Customer[]; // Placeholder
  orders?: Order[];       // Placeholder
  chats?: Chat[];         // Placeholder
};
