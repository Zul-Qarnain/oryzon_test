import { customers, connectedChannels, orders, chats, businesses, users } from '@/db/schema';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { ConnectedChannel } from '@/backend/services/channels/channels.types';
import { Order } from '@/backend/services/orders/orders.types';
import { Chat } from '@/backend/services/chats/chats.types';
import { Business } from '@/backend/services/businesses/businesses.types';
import { User } from '@/backend/services/users/users.types';

// Base Customer type from schema
export type Customer = InferSelectModel<typeof customers>;
export type NewCustomer = InferInsertModel<typeof customers>;

// Options for including related entities
export interface CustomerIncludeOptions {
  business?: boolean; // Customer now belongs to a Business
  userViaProviderId?: boolean; // For the denormalized user link
  connectedChannel?: boolean; // Still linked to a specific channel
  orders?: { limit?: number; offset?: number } | boolean;
  chats?: { limit?: number; offset?: number } | boolean;
}

// Options for GetById
export interface GetCustomerByIdOptions {
  include?: CustomerIncludeOptions;
}

// Options for GetAll
export interface GetAllCustomersOptions {
  limit?: number;
  offset?: number;
  filter?: Partial<Pick<Customer, 'businessId' | 'providerUserId' | 'channelId' | 'platformCustomerId' | 'fullName'>>;
  include?: CustomerIncludeOptions;
}

// Data for creating a new customer
export type CreateCustomerData = Omit<NewCustomer, 'customerId' | 'firstSeenAt' | 'lastSeenAt' | 'providerUserId'> & {
  businessId: Business['businessId'];
  channelId: ConnectedChannel['channelId'];
  providerUserId?: User['providerUserId'] | null; // Optional, as it's nullable and denormalized
};

// Data for updating an existing customer
// businessId and channelId should generally not be updatable for an existing customer.
export type UpdateCustomerData = Partial<Omit<NewCustomer, 'customerId' | 'businessId' | 'channelId' | 'firstSeenAt' | 'lastSeenAt'>>;

// Data for updating many customers
export interface UpdateManyCustomersData {
  fullName?: Customer['fullName'];
  // Add other fields suitable for bulk update
}

// Filter options for operations like updateMany or deleteMany
export interface CustomerFilterOptions {
  ids?: Customer['customerId'][];
  businessId?: Business['businessId'];
  providerUserId?: User['providerUserId'] | null;
  channelId?: Customer['channelId'];
  platformCustomerId?: Customer['platformCustomerId'];
  fullName?: Customer['fullName'];
  firstSeenBefore?: Date;
  firstSeenAfter?: Date;
  lastSeenBefore?: Date;
  lastSeenAfter?: Date;
}

// --- Related entity types for inclusion ---
export type CustomerWithIncludes = Customer & {
  business?: Business;
  userViaProviderId?: User | null;
  connectedChannel?: ConnectedChannel;
  orders?: Order[];
  chats?: Chat[];
};
