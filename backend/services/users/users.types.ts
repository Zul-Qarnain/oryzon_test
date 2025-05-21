import { users, connectedChannels, products, orders, chats } from '@/db/schema';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

// Base User type from schema
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

// Options for including related entities
export interface UserIncludeOptions {
  connectedChannels?: { limit?: number; offset?: number; } | boolean;
  products?: { limit?: number; offset?: number; } | boolean;
  orders?: { limit?: number; offset?: number; } | boolean;
}

// Options for GetById
export interface GetUserByIdOptions {
  include?: UserIncludeOptions;
}

// Options for GetAll
export interface GetAllUsersOptions {
  limit?: number;
  offset?: number;
  filter?: Partial<Pick<User, 'email' | 'businessName' | 'loginProvider'>>; // More specific filtering
  include?: UserIncludeOptions;
}

// Data for creating a new user
export type CreateUserData = Omit<NewUser, 'createdAt' | 'updatedAt'>; // Exclude auto-generated fields

// Data for updating an existing user
export type UpdateUserData = Partial<Omit<NewUser, 'userId' | 'createdAt' | 'updatedAt'>>;

// Data for updating many users (specific fields)
export interface UpdateManyUsersData {
  businessName?: User['businessName'];
  // Add other fields that are suitable for bulk update
  // For example, if you had a status field:
  // status?: User['status'];
}

// Filter options for operations like updateMany or deleteMany
export interface UserFilterOptions {
  ids?: User['userId'][];
  email?: User['email'];
  loginProvider?: User['loginProvider'];
  businessName?: User['businessName'];
  createdAtBefore?: Date;
  createdAtAfter?: Date;
}

// --- Related entity types for inclusion (simplified for now) ---
export type UserWithIncludes = User & {
  connectedChannels?: InferSelectModel<typeof connectedChannels>[];
  products?: InferSelectModel<typeof products>[];
  orders?: InferSelectModel<typeof orders>[];
};
