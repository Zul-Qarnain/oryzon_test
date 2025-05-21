import { db } from '@/db';
import { customers, connectedChannels, orders, chats, businesses, users } from '@/db/schema'; // Added businesses and users
import {
  Customer,
  NewCustomer, // Added import for NewCustomer
  CreateCustomerData,
  UpdateCustomerData,
  GetCustomerByIdOptions,
  GetAllCustomersOptions,
  CustomerFilterOptions,
  UpdateManyCustomersData,
  CustomerWithIncludes,
} from './customers.types';
import { and, count, eq, ilike, inArray, desc, gte, lte } from 'drizzle-orm';

export class CustomersService {
  constructor() {}

  async createCustomer(data: CreateCustomerData): Promise<Customer> {
    const newCustomerData: NewCustomer = {
      businessId: data.businessId,
      channelId: data.channelId,
      providerUserId: data.providerUserId, // Can be null or undefined
      platformCustomerId: data.platformCustomerId,
      fullName: data.fullName,
      // email: data.email, // Property 'email' does not exist on type 'CreateCustomerData'.
      // phone: data.phone, // Property 'phone' does not exist on type 'CreateCustomerData'.
      profilePictureUrl: data.profilePictureUrl, // Renamed from avatarUrl, ensure CreateCustomerData has this
      // firstSeenAt and lastSeenAt are handled by DB defaults or updated separately
    };
    const [newCustomer] = await db.insert(customers).values(newCustomerData).returning();
    return newCustomer;
  }

  async getCustomerById(customerId: string, options?: GetCustomerByIdOptions): Promise<CustomerWithIncludes | null> {
    const query = db.query.customers.findFirst({
      where: eq(customers.customerId, customerId),
      with: {
        business: options?.include?.business ? true : undefined,
        userViaProviderId: options?.include?.userViaProviderId ? true : undefined,
        connectedChannel: options?.include?.connectedChannel ? true : undefined,
        orders: options?.include?.orders 
          ? { 
              limit: typeof options.include.orders === 'boolean' ? undefined : options.include.orders.limit,
            } 
          : undefined,
        chats: options?.include?.chats 
          ? { 
              limit: typeof options.include.chats === 'boolean' ? undefined : options.include.chats.limit,
            } 
          : undefined,
      }
    });
    const customer = await query;
    return customer || null;
  }

  async getAllCustomers(options?: GetAllCustomersOptions): Promise<{ data: CustomerWithIncludes[]; total: number }> {
    const page = options?.limit ?? 10;
    const offset = options?.offset ?? 0;

    const filter = options?.filter as CustomerFilterOptions | undefined; // Type is Partial<Pick<Customer, ...>>
    const conditions = [];

    if (filter?.businessId) {
      conditions.push(eq(customers.businessId, filter.businessId));
    }
    if (filter?.providerUserId) { // Filter by denormalized providerUserId
      conditions.push(eq(customers.providerUserId, filter.providerUserId));
    }
    if (filter?.channelId) {
      conditions.push(eq(customers.channelId, filter.channelId));
    }
    if (filter?.platformCustomerId) {
      conditions.push(eq(customers.platformCustomerId, filter.platformCustomerId));
    }
    if (filter?.fullName) {
      conditions.push(ilike(customers.fullName, `%${filter.fullName}%`));
    }
    if (filter?.firstSeenBefore) {
      conditions.push(lte(customers.firstSeenAt, filter.firstSeenBefore));
    }
    if (filter?.firstSeenAfter) {
      conditions.push(gte(customers.firstSeenAt, filter.firstSeenAfter));
    }
    if (filter?.lastSeenBefore) {
      conditions.push(lte(customers.lastSeenAt, filter.lastSeenBefore));
    }
    if (filter?.lastSeenAfter) {
      conditions.push(gte(customers.lastSeenAt, filter.lastSeenAfter));
    }


    const customersQuery = db.query.customers.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      limit: page,
      offset: offset,
      with: {
        business: options?.include?.business ? true : undefined,
        userViaProviderId: options?.include?.userViaProviderId ? true : undefined,
        connectedChannel: options?.include?.connectedChannel ? true : undefined,
        orders: options?.include?.orders 
          ? { 
              limit: typeof options.include.orders === 'boolean' ? undefined : options.include.orders.limit,
            } 
          : undefined,
        chats: options?.include?.chats 
          ? { 
              limit: typeof options.include.chats === 'boolean' ? undefined : options.include.chats.limit,
            } 
          : undefined,
      },
      orderBy: [desc(customers.lastSeenAt)] 
    });

    const totalQuery = db.select({ value: count() }).from(customers).where(conditions.length > 0 ? and(...conditions) : undefined);

    const [data, totalResult] = await Promise.all([customersQuery, totalQuery]);
    
    return { data, total: totalResult[0]?.value ?? 0 };
  }

  async updateCustomer(customerId: string, data: UpdateCustomerData): Promise<Customer | null> {
    // businessId and channelId are not part of UpdateCustomerData and should not be updated here.
    // providerUserId can be updated if present in data.
    const [updatedCustomer] = await db
      .update(customers)
      .set({ ...data, lastSeenAt: new Date() }) // Also update lastSeenAt on any update
      .where(eq(customers.customerId, customerId))
      .returning();
    return updatedCustomer || null;
  }

  async updateManyCustomers(filter: CustomerFilterOptions, data: UpdateManyCustomersData): Promise<{ count: number }> {
    if (!filter.ids || filter.ids.length === 0) {
      // Add other filter conditions if needed for bulk update
      return { count: 0 };
    }
    const result = await db
      .update(customers)
      .set({ ...data, lastSeenAt: new Date() })
      .where(inArray(customers.customerId, filter.ids as string[]));
      
    return { count: result.rowCount ?? 0 };
  }

  async deleteCustomer(customerId: string): Promise<boolean> {
    // Consider implications: what happens to orders, chats for this customer?
    // Soft delete or anonymization might be preferable.
    const result = await db.delete(customers).where(eq(customers.customerId, customerId));
    return (result.rowCount ?? 0) > 0;
  }

  async deleteManyCustomers(filter: CustomerFilterOptions): Promise<{ count: number }> {
    if (!filter.ids || filter.ids.length === 0) {
      return { count: 0 };
    }
    const result = await db.delete(customers).where(inArray(customers.customerId, filter.ids as string[]));
    return { count: result.rowCount ?? 0 };
  }
}

export const customersService = new CustomersService();
