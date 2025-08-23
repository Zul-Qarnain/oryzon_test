import { connectedChannels, users, customers as customersSchema, orders as ordersSchema, chats as chatsSchema, platformTypeEnum, businesses } from '@/db/schema';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { User } from '@/backend/services/users/users.types';
import { Customer } from '@/backend/services/customers/customers.types';
import { Order } from '@/backend/services/orders/orders.types';
import { Chat } from '@/backend/services/chats/chats.types';
import { Product } from '@/backend/services/products/products.types';
import { Business } from '@/backend/services/businesses/businesses.types'; // Import Business type

// Base ConnectedChannel type from schema
export type ConnectedChannel = InferSelectModel<typeof connectedChannels>;
export type NewConnectedChannel = InferInsertModel<typeof connectedChannels>;

// Options for including related entities
export interface ChannelIncludeOptions {
  business?: boolean; // Channel now belongs to a Business
  userViaProviderId?: boolean; // For the denormalized user link
  customers?: { limit?: number; offset?: number , platformCustomerId?: Customer['platformCustomerId']} | boolean;
  orders?: { limit?: number; offset?: number } | boolean;
  chats?: { limit?: number; offset?: number , platformCustomerId?: Customer["customerId"]} | boolean;
  products?: { limit?: number; offset?: number } | boolean;
}

// Options for GetById
export interface GetChannelByIdOptions {
  include?: ChannelIncludeOptions;
}

// Options for GetAll
export interface GetAllChannelsOptions {
  limit?: number;
  offset?: number;
  filter?: ChannelFilterOptions;
  orderBy?: keyof ConnectedChannel;
  include?: ChannelIncludeOptions;
}

// Data for creating a new channel
export type CreateChannelData = Omit<NewConnectedChannel, 'channelId' | 'createdAt' | 'updatedAt' | 'providerUserId'> & {
  businessId: Business['businessId']; // Must belong to a business
  providerUserId?: User['providerUserId'] | null; // Optional, as it's nullable and denormalized
};

// Data for updating an existing channel
// businessId should generally not be updatable for an existing channel.
// providerUserId can be updated if needed.
export type UpdateChannelData = Partial<Omit<NewConnectedChannel, 'channelId' | 'businessId' | 'createdAt' | 'updatedAt'>>;

// Data for updating many channels
export interface UpdateManyChannelsData {
  isActive?: ConnectedChannel['isActive'];
  // Add other fields suitable for bulk update
}

// Filter options for operations like updateMany or deleteMany
export interface ChannelFilterOptions {
  ids?: ConnectedChannel['channelId'][];
  businessId?: Business['businessId'];
  providerUserId?: User['providerUserId'] | null;
  platformType?: ConnectedChannel['platformType'];
  isActive?: ConnectedChannel['isActive'];
  channelName?: ConnectedChannel['channelName'];
  description?: ConnectedChannel['description'];
  platformSpecificId?: ConnectedChannel['platformSpecificId'] | ConnectedChannel['platformSpecificId'][];
  createdAtBefore?: Date;
  createdAtAfter?: Date;
}

// --- Related entity types for inclusion ---
export type ConnectedChannelWithIncludes = ConnectedChannel & {
  business?: Business; // Relation to Business
  userViaProviderId?: User | null; // Denormalized user
  customers?: Customer[];
  orders?: Order[];
  chats?: Chat[];
  products?: Product[];
};
