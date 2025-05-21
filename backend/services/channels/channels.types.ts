import { connectedChannels, users, customers as customersSchema, orders as ordersSchema, chats as chatsSchema, platformTypeEnum } from '@/db/schema'; // Aliased schema imports to avoid name clashes if types are also named the same
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { User } from '@/backend/services/users/users.types';
import { Customer } from '@/backend/services/customers/customers.types';
import { Order } from '@/backend/services/orders/orders.types';
import { Chat } from '@/backend/services/chats/chats.types';
import { Product } from '@/backend/services/products/products.types'; // Import Product type

// Base ConnectedChannel type from schema
export type ConnectedChannel = InferSelectModel<typeof connectedChannels>;
export type NewConnectedChannel = InferInsertModel<typeof connectedChannels>;

// Options for including related entities
export interface ChannelIncludeOptions {
  user?: boolean;
  customers?: { limit?: number; offset?: number } | boolean;
  orders?: { limit?: number; offset?: number } | boolean;
  chats?: { limit?: number; offset?: number } | boolean;
  products?: { limit?: number; offset?: number } | boolean; // Add products include option
}

// Options for GetById
export interface GetChannelByIdOptions {
  include?: ChannelIncludeOptions;
}

// Options for GetAll
export interface GetAllChannelsOptions {
  limit?: number;
  offset?: number;
  filter?: Partial<Pick<ConnectedChannel, 'providerUserId' | 'platformType' | 'isActive' | 'channelName'| 'platformSpecificId' | 'description'>>;
  orderBy?: keyof ConnectedChannel;
  include?: ChannelIncludeOptions;
}

// Data for creating a new channel
export type CreateChannelData = Omit<NewConnectedChannel, 'channelId' | 'createdAt' | 'updatedAt'> & {
  providerUserId: User['providerUserId']; // Ensure providerUserId is provided
};

// Data for updating an existing channel
export type UpdateChannelData = Partial<Omit<NewConnectedChannel, 'channelId' | 'providerUserId' | 'createdAt' | 'updatedAt'>>;

// Data for updating many channels
export interface UpdateManyChannelsData {
  isActive?: ConnectedChannel['isActive'];
  // Add other fields suitable for bulk update
}

// Filter options for operations like updateMany or deleteMany
export interface ChannelFilterOptions {
  ids?: ConnectedChannel['channelId'][];
  providerUserId?: User['providerUserId'];
  platformType?: ConnectedChannel['platformType'];
  isActive?: ConnectedChannel['isActive'];
  channelName?: ConnectedChannel['channelName']; // Added channelName for filtering
  description?: ConnectedChannel['description']; // Added description for filtering
  platformSpecificId?: ConnectedChannel['platformSpecificId'];
  createdAtBefore?: Date;
  createdAtAfter?: Date;
}

// --- Related entity types for inclusion ---
export type ConnectedChannelWithIncludes = ConnectedChannel & {
  user?: User;
  customers?: Customer[];
  orders?: Order[];
  chats?: Chat[];
  products?: Product[]; // Add products to related entity types
};
