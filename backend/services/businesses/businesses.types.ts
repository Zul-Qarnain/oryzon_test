import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { businesses, users, connectedChannels, products, customers, orders } from '@/db/schema';

// Base Business type from the database schema
export type Business = InferSelectModel<typeof businesses>;
export type NewBusiness = InferInsertModel<typeof businesses>;

// Business with its relations
export type BusinessWithRelations = Business & {
  user?: InferSelectModel<typeof users> | null; // The primary user owning the business
  userViaProviderId?: InferSelectModel<typeof users> | null; // Denormalized user link
  connectedChannels?: InferSelectModel<typeof connectedChannels>[];
  products?: InferSelectModel<typeof products>[];
  customers?: InferSelectModel<typeof customers>[];
  orders?: InferSelectModel<typeof orders>[];
};

// Specific types for API requests or responses if needed, e.g.:
export interface CreateBusinessPayload {
  userId: string; // UUID of the user creating the business
  providerUserId?: string | null; // Optional providerUserId
  name: string;
  description?: string | null;
}

export interface UpdateBusinessPayload {
  name?: string;
  description?: string | null;
  // Add other updatable fields as necessary
}
