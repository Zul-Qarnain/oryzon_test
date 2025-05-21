import { db } from '@/db'; // Using @ alias, points to db/index.ts
import { users, businesses } from '@/db/schema'; // Using @ alias, added businesses
import {
  User,
  CreateUserData,
  UpdateUserData,
  GetUserByIdOptions,
  GetAllUsersOptions,
  UserFilterOptions,
  // UpdateManyUsersData, // Removed as per user's edit in users.types.ts
  UserWithIncludes,
} from './users.types';
import { and, count, eq, ilike, inArray, desc } from 'drizzle-orm'; // Added desc
// Removed unused: sql, alias

export class UsersService {
  constructor() {}

  async createUser(data: CreateUserData): Promise<User> {
    const [newUser] = await db.insert(users).values(data).returning();
    return newUser;
  }

  async getUserById(userId: string, options?: GetUserByIdOptions): Promise<UserWithIncludes | null> {
    // Basic query
    const query = db.query.users.findFirst({
      where: eq(users.userId, userId),
      with: {
        businesses: options?.include?.businesses ? (typeof options.include.businesses === 'boolean' ? true : { limit: options.include.businesses.limit ?? 10 /* offset not supported here */ }) : undefined,
        // connectedChannels, products, orders were placeholders for direct relations or denormalized ones.
        // Focusing on 'businesses' as per UserIncludeOptions.
      }
    });
    const user = await query;
    return user || null;
  }

  async getAllUsers(options?: GetAllUsersOptions): Promise<{ data: UserWithIncludes[]; total: number }> {
    const page = options?.limit ?? 10;
    const offset = options?.offset ?? 0;

    const conditions = [];
    if (options?.filter?.email) {
      conditions.push(ilike(users.email, `%${options.filter.email}%`));
    }
    // businessName filter removed as it's no longer on the user model
    if (options?.filter?.loginProvider) {
      conditions.push(eq(users.loginProvider, options.filter.loginProvider));
    }
    if (options?.filter?.providerUserId) {
      conditions.push(eq(users.providerUserId, options.filter.providerUserId));
    }
    if (options?.filter?.name) {
      conditions.push(ilike(users.name, `%${options.filter.name}%`));
    }
    if (options?.filter?.phone) {
      conditions.push(ilike(users.phone, `%${options.filter.phone}%`));
    }


    const usersQuery = db.query.users.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      limit: page,
      offset: offset,
      with: {
        businesses: options?.include?.businesses ? (typeof options.include.businesses === 'boolean' ? true : { limit: options.include.businesses.limit ?? 10 /* offset not supported here */ }) : undefined,
        // connectedChannels, products, orders were placeholders.
      },
      orderBy: [desc(users.createdAt)] // Default order
    });

    const totalQuery = db.select({ value: count() }).from(users).where(conditions.length > 0 ? and(...conditions) : undefined);

    const [data, totalResult] = await Promise.all([usersQuery, totalQuery]);
    
    return { data, total: totalResult[0]?.value ?? 0 };
  }

  async updateUser(userId: string, data: UpdateUserData): Promise<User | null> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.userId, userId))
      .returning();
    return updatedUser || null;
  }

  // TODO: updateManyUsers method needs to be re-evaluated.
  // UpdateManyUsersData was removed from users.types.ts.
  // If bulk updates are needed, define the data structure and implement accordingly.
  // For now, commenting out to avoid type errors.
  /*
  async updateManyUsers(filter: UserFilterOptions, data: UpdateManyUsersData): Promise<{ count: number }> {
    if (!filter.ids || filter.ids.length === 0) {
        // Or handle other filters if ids is not the primary way to updateMany
        return { count: 0 }; 
    }
    // This is a simplified updateMany. Drizzle doesn't have a direct .updateMany().returningRowCount()
    // You might need to select then update, or use a raw query for more complex scenarios.
    // For now, we'll update based on IDs and assume the operation affects rows if IDs are matched.
    const result = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() }) // data would be UpdateManyUsersData
      .where(inArray(users.userId, filter.ids as string[])); 
      
    return { count: result.rowCount ?? 0 }; // Placeholder count, actual rowCount depends on driver and Drizzle version
  }
  */

  async deleteUser(userId: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.userId, userId));
    // For pg driver, result.rowCount > 0 indicates success
    return (result.rowCount ?? 0) > 0; 
  }

  async deleteManyUsers(filter: UserFilterOptions): Promise<{ count: number }> {
    if (!filter.ids || filter.ids.length === 0) {
      return { count: 0 };
    }
    const result = await db.delete(users).where(inArray(users.userId, filter.ids as string[]));
    return { count: result.rowCount ?? 0 };
  }
}

// Export an instance of the service
export const usersService = new UsersService();
