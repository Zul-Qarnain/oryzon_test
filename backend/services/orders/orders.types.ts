import { orders, customers, connectedChannels, users, orderItems, products, orderStatusEnum, businesses } from '@/db/schema';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { Customer } from '@/backend/services/customers/customers.types';
import { ConnectedChannel } from '@/backend/services/channels/channels.types';
import { User } from '@/backend/services/users/users.types';
import { Product } from '@/backend/services/products/products.types';
import { Business } from '@/backend/services/businesses/businesses.types';

// Base Order type from schema
export type Order = InferSelectModel<typeof orders>;
export type NewOrder = InferInsertModel<typeof orders>;

// Base OrderItem type from schema
export type OrderItem = InferSelectModel<typeof orderItems>;
export type NewOrderItem = InferInsertModel<typeof orderItems>;

// Options for including related entities for an Order
export interface OrderIncludeOptions {
  business?: boolean; // Order now belongs to a Business
  userViaProviderId?: boolean; // For the denormalized user link
  customer?: boolean;
  connectedChannel?: boolean;
  orderItems?: { limit?: number; offset?: number; include?: { product?: boolean } } | boolean;
  // user (direct link to business user) is removed, use business and userViaProviderId
}

// Options for GetOrderById
export interface GetOrderByIdOptions {
  include?: OrderIncludeOptions;
}

// Options for GetAllOrders
export interface GetAllOrdersOptions {
  limit?: number;
  offset?: number;
  filter?: Partial<Pick<Order, 'businessId' | 'providerUserId' | 'customerId' | 'channelId' | 'orderStatus' | 'currency'>>;
  include?: OrderIncludeOptions;
}

// Data for creating a new OrderItem (part of CreateOrderData)
export type CreateOrderItemData = Omit<NewOrderItem, 'orderItemId' | 'orderId'> & {
  productId: Product['productId']; // Ensure productId is provided
};

// Data for creating a new Order
export type CreateOrderData = Omit<NewOrder, 'orderId' | 'createdAt' | 'updatedAt' | 'providerUserId'> & {
  businessId: Business['businessId'];
  customerId: Customer['customerId'];
  channelId: ConnectedChannel['channelId'];
  providerUserId?: User['providerUserId'] | null; // Optional, as it's nullable and denormalized
  orderItems: CreateOrderItemData[]; // Array of order items
};

// Data for updating an existing Order
// businessId, customerId, channelId should generally not be updatable.
export type UpdateOrderData = Partial<Pick<NewOrder, 'orderStatus' | 'shippingAddress' | 'billingAddress' | 'providerUserId'>>;

// Data for updating many Orders
export interface UpdateManyOrdersData {
  orderStatus?: Order['orderStatus'];
  // Add other fields suitable for bulk update
}

// Filter options for operations like updateMany or deleteMany Orders
// This is where more complex filters like date ranges and amount ranges are defined.
export interface OrderFilterOptions {
  ids?: Order['orderId'][];
  businessId?: Business['businessId'];
  providerUserId?: User['providerUserId'] | null;
  customerId?: Customer['customerId'];
  channelId?: ConnectedChannel['channelId'];
  orderStatus?: Order['orderStatus'];
  minTotalAmount?: number; // For range filtering
  maxTotalAmount?: number; // For range filtering
  currency?: Order['currency'];
  createdAtBefore?: Date; // For date range filtering
  createdAtAfter?: Date; // For date range filtering
}

// --- Related entity types for inclusion ---
export type OrderWithIncludes = Order & {
  business?: Business;
  userViaProviderId?: User | null;
  customer?: Customer;
  connectedChannel?: ConnectedChannel | null; // Allow null for connectedChannel
  orderItems?: (OrderItem & { product?: Product })[];
};
