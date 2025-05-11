import { customers, connectedChannels, orders, chats } from '@/db/schema';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { ConnectedChannel } from '@/backend/services/channels/channels.types';
import { Order } from '@/backend/services/orders/orders.types';
import { Chat } from '@/backend/services/chats/chats.types';

// Base Customer type from schema
export type Customer = InferSelectModel<typeof customers>;
export type NewCustomer = InferInsertModel<typeof customers>;

// Options for including related entities
export interface CustomerIncludeOptions {
  connectedChannel?: boolean;
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
  filter?: Partial<Pick<Customer, 'channelId' | 'platformCustomerId' | 'fullName'>>;
  include?: CustomerIncludeOptions;
}

// Data for creating a new customer
export type CreateCustomerData = Omit<NewCustomer, 'customerId' | 'firstSeenAt' | 'lastSeenAt'> & {
  channelId: ConnectedChannel['channelId']; // Use type from ConnectedChannel
};

// Data for updating an existing customer
export type UpdateCustomerData = Partial<Omit<NewCustomer, 'customerId' | 'channelId' | 'firstSeenAt' | 'lastSeenAt'>>;

// Data for updating many customers
export interface UpdateManyCustomersData {
  fullName?: Customer['fullName'];
  // Add other fields suitable for bulk update
}

// Filter options for operations like updateMany or deleteMany
export interface CustomerFilterOptions {
  ids?: Customer['customerId'][];
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
  connectedChannel?: ConnectedChannel;
  orders?: Order[];
  chats?: Chat[];
};
