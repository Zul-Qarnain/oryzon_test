import { orders, customers, connectedChannels, users, orderItems, products, orderStatusEnum } from '@/db/schema';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { Customer } from '@/backend/services/customers/customers.types';
import { ConnectedChannel } from '@/backend/services/channels/channels.types';
import { User } from '@/backend/services/users/users.types';
import { Product } from '@/backend/services/products/products.types';

// Base Order type from schema
export type Order = InferSelectModel<typeof orders>;
export type NewOrder = InferInsertModel<typeof orders>;

// Base OrderItem type from schema
export type OrderItem = InferSelectModel<typeof orderItems>;
export type NewOrderItem = InferInsertModel<typeof orderItems>;

// Options for including related entities for an Order
export interface OrderIncludeOptions {
  customer?: boolean;
  connectedChannel?: boolean;
  user?: boolean; // The business user
  orderItems?: { limit?: number; offset?: number; include?: { product?: boolean } } | boolean;
}

// Options for GetOrderById
export interface GetOrderByIdOptions {
  include?: OrderIncludeOptions;
}

// Options for GetAllOrders
export interface GetAllOrdersOptions {
  limit?: number;
  offset?: number;
  filter?: Partial<Pick<Order, 'customerId' | 'channelId' | 'userId' | 'orderStatus' | 'currency'>>;
  include?: OrderIncludeOptions;
}

// Data for creating a new OrderItem (part of CreateOrderData)
export type CreateOrderItemData = Omit<NewOrderItem, 'orderItemId' | 'orderId'> & {
  productId: Product['productId']; // Ensure productId is provided
};

// Data for creating a new Order
export type CreateOrderData = Omit<NewOrder, 'orderId' | 'createdAt' | 'updatedAt'> & {
  customerId: Customer['customerId'];
  channelId: ConnectedChannel['channelId'];
  userId: User['userId'];
  orderItems: CreateOrderItemData[]; // Array of order items
};

// Data for updating an existing Order
export type UpdateOrderData = Partial<Pick<NewOrder, 'orderStatus' | 'shippingAddress' | 'billingAddress'>>;

// Data for updating many Orders
export interface UpdateManyOrdersData {
  orderStatus?: Order['orderStatus'];
  // Add other fields suitable for bulk update
}

// Filter options for operations like updateMany or deleteMany Orders
export interface OrderFilterOptions {
  ids?: Order['orderId'][];
  customerId?: Customer['customerId'];
  channelId?: ConnectedChannel['channelId'];
  userId?: User['userId'];
  orderStatus?: Order['orderStatus'];
  minTotalAmount?: number;
  maxTotalAmount?: number;
  currency?: Order['currency'];
  createdAtBefore?: Date;
  createdAtAfter?: Date;
}

// --- Related entity types for inclusion ---
export type OrderWithIncludes = Order & {
  customer?: Customer;
  connectedChannel?: ConnectedChannel;
  user?: User;
  orderItems?: (OrderItem & { product?: Product })[];
};
