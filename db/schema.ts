import {
  pgTable,
  uuid,
  text,
  timestamp,
  varchar,
  boolean,
  integer,
  decimal,
  jsonb,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ENUMs
export const loginProviderEnum = pgEnum('login_provider', ['EMAIL', 'GOOGLE', 'FACEBOOK_AUTH', 'LINKEDIN_AUTH']);
export const platformTypeEnum = pgEnum('platform_type', ['FACEBOOK_PAGE', 'INSTAGRAM_BUSINESS', 'LINKEDIN_PAGE', 'TWITTER_PROFILE']);
export const orderStatusEnum = pgEnum('order_status', ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'CANCELLED']);
export const chatStatusEnum = pgEnum('chat_status', ['OPEN', 'CLOSED_BY_BOT', 'CLOSED_BY_AGENT', 'ARCHIVED']);
export const messageSenderTypeEnum = pgEnum('message_sender_type', ['BOT', 'CUSTOMER', 'AGENT']);
export const messageContentTypeEnum = pgEnum('message_content_type', ['TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'FILE', 'QUICK_REPLY', 'CAROUSEL']);

// Tables
export const users = pgTable('users', {
  userId: uuid('user_id').primaryKey().defaultRandom(),
  email: text('email').unique(), // Nullable as per plan if OAuth provider doesn't supply it
  passwordHash: text('password_hash'), // Nullable
  businessName: text('business_name'),
  loginProvider: loginProviderEnum('login_provider'),
  providerUserId: text('provider_user_id'), // Nullable
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const connectedChannels = pgTable('connected_channels', {
  channelId: uuid('channel_id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.userId),
  platformType: platformTypeEnum('platform_type').notNull(),
  platformSpecificId: text('platform_specific_id').notNull(),
  channelName: text('channel_name'),
  accessToken: text('access_token'), // Should be encrypted in application logic
  refreshToken: text('refresh_token'), // Should be encrypted, Nullable
  tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }), // Nullable
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const customers = pgTable('customers', {
  customerId: uuid('customer_id').primaryKey().defaultRandom(),
  channelId: uuid('channel_id').notNull().references(() => connectedChannels.channelId),
  platformCustomerId: text('platform_customer_id').notNull(), // Unique per channel
  fullName: text('full_name'), // Optional
  profilePictureUrl: text('profile_picture_url'), // Optional
  firstSeenAt: timestamp('first_seen_at', { withTimezone: true }).defaultNow().notNull(),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).defaultNow().notNull(),
});

export const products = pgTable('products', {
  productId: uuid('product_id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.userId),
  name: text('name').notNull(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull(), // e.g., 'USD'
  sku: text('sku'), // Optional
  imageUrl: text('image_url'), // Optional
  imageId: text('image_id'), // Optional
  shortId: text('short_id'), // Optional, could be used for short links or easier references
  isAvailable: boolean('is_available').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const orders = pgTable('orders', {
  orderId: uuid('order_id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id').notNull().references(() => customers.customerId),
  channelId: uuid('channel_id').notNull().references(() => connectedChannels.channelId),
  userId: uuid('user_id').notNull().references(() => users.userId), // Denormalized
  orderStatus: orderStatusEnum('order_status').default('PENDING').notNull(),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull(),
  shippingAddress: jsonb('shipping_address'), // Can store structured address data
  billingAddress: jsonb('billing_address'), // Can store structured address data
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const orderItems = pgTable('order_items', {
  orderItemId: uuid('order_item_id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').notNull().references(() => orders.orderId),
  productId: uuid('product_id').notNull().references(() => products.productId),
  quantity: integer('quantity').notNull(),
  priceAtPurchase: decimal('price_at_purchase', { precision: 10, scale: 2 }).notNull(),
  currencyAtPurchase: varchar('currency_at_purchase', { length: 3 }).notNull(),
});

export const chats = pgTable('chats', {
  chatId: uuid('chat_id').primaryKey().defaultRandom(),
  customerId: uuid('customer_id').notNull().references(() => customers.customerId),
  channelId: uuid('channel_id').notNull().references(() => connectedChannels.channelId),
  startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
  lastMessageAt: timestamp('last_message_at', { withTimezone: true }).defaultNow().notNull(),
  status: chatStatusEnum('status').default('OPEN'), // Optional
});

export const messages = pgTable('messages', {
  messageId: uuid('message_id').primaryKey().defaultRandom(),
  chatId: uuid('chat_id').notNull().references(() => chats.chatId),
  senderType: messageSenderTypeEnum('sender_type').notNull(),
  contentType: messageContentTypeEnum('content_type').notNull(),
  content: text('content').notNull(), // TEXT for simple, or stringified JSON for complex
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
  platformMessageId: text('platform_message_id'), // Optional
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  connectedChannels: many(connectedChannels),
  products: many(products),
  orders: many(orders), // For easier querying of all orders by a user
  // chats: many(chats), // For easier querying of all chats by a user // userId was removed from chats
}));

export const connectedChannelsRelations = relations(connectedChannels, ({ one, many }) => ({
  user: one(users, {
    fields: [connectedChannels.userId],
    references: [users.userId],
  }),
  customers: many(customers),
  orders: many(orders),
  chats: many(chats),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  connectedChannel: one(connectedChannels, {
    fields: [customers.channelId],
    references: [connectedChannels.channelId],
  }),
  orders: many(orders),
  chats: many(chats),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  user: one(users, {
    fields: [products.userId],
    references: [users.userId],
  }),
  orderItems: many(orderItems),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.customerId],
  }),
  connectedChannel: one(connectedChannels, {
    fields: [orders.channelId],
    references: [connectedChannels.channelId],
  }),
  user: one(users, { // For the denormalized user_id
    fields: [orders.userId],
    references: [users.userId],
  }),
  orderItems: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.orderId],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.productId],
  }),
}));

export const chatsRelations = relations(chats, ({ one, many }) => ({
  customer: one(customers, {
    fields: [chats.customerId],
    references: [customers.customerId],
  }),
  connectedChannel: one(connectedChannels, {
    fields: [chats.channelId],
    references: [connectedChannels.channelId],
  }),
  // user: one(users, { // For the denormalized user_id // userId was removed from chats
  //   fields: [chats.userId],
  //   references: [users.userId],
  // }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.chatId],
  }),
}));
