import { users, connectedChannels, products, orders, businesses as businessesSchema } from '@/db/schema'; // Added businessesSchema
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { Business } from '@/backend/services/businesses/businesses.types'; // Import Business type

// Base User type from schema
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

// Options for including related entities
export interface UserIncludeOptions {
  businesses?: { limit?: number; offset?: number; } | boolean; // Added businesses relation
  // The following are direct relations from user to other entities if they exist,
  // or could represent the denormalized relations via providerUserId.
  // For now, focusing on the primary 'businesses' relation.
  // connectedChannels?: { limit?: number; offset?: number; } | boolean; // This might be denormalizedConnectedChannels
  // products?: { limit?: number; offset?: number; } | boolean; // This might be denormalizedProducts
  // orders?: { limit?: number; offset?: number; } | boolean; // This might be denormalizedOrders
}

// Options for GetById
export interface GetUserByIdOptions {
  include?: UserIncludeOptions;
}

// Options for GetAll
export interface GetAllUsersOptions {
  limit?: number;
  offset?: number;
  // businessName removed, providerUserId could be added if direct filtering on it is needed
  filter?: Partial<Pick<User, 'email' | 'loginProvider' | 'providerUserId' | 'name' | 'phone'>>;
  include?: UserIncludeOptions;
}

// Data for creating a new user
// providerUserId is crucial and should be included.
export type CreateUserData = Omit<NewUser, 'userId' | 'createdAt' | 'updatedAt'>;

// Data for updating an existing user
// providerUserId might be updatable in some scenarios (e.g. linking accounts), but usually fixed.
export type UpdateUserData = Partial<Omit<NewUser, 'userId' | 'createdAt' | 'updatedAt' | 'providerUserId'>>;

// Data for updating many users (specific fields)
// eslint-disable-next-line @typescript-eslint/no-empty-interface


// Filter options for operations like updateMany or deleteMany
export interface UserFilterOptions {
  ids?: User['userId'][];
  email?: User['email'];
  loginProvider?: User['loginProvider'];
  providerUserId?: User['providerUserId']; // Added providerUserId
  // businessName removed
  createdAtBefore?: Date;
  createdAtAfter?: Date;
}

// --- Related entity types for inclusion ---
export type UserWithIncludes = User & {
  businesses?: Business[]; // Changed to use Business type
  // connectedChannels?: InferSelectModel<typeof connectedChannels>[];
  // products?: InferSelectModel<typeof products>[];
  // orders?: InferSelectModel<typeof orders>[];
};
