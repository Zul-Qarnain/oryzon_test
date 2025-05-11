import { db } from '@/db';
import { customers, connectedChannels, orders, chats } from '@/db/schema';
import {
  Customer,
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
    const [newCustomer] = await db.insert(customers).values(data).returning();
    return newCustomer;
  }

  async getCustomerById(customerId: string, options?: GetCustomerByIdOptions): Promise<CustomerWithIncludes | null> {
    const query = db.query.customers.findFirst({
      where: eq(customers.customerId, customerId),
      with: {
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

    const filter = options?.filter as CustomerFilterOptions | undefined; // Use the more comprehensive filter type
    const conditions = [];

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
      where: and(...conditions),
      limit: page,
      offset: offset,
      with: {
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

    const totalQuery = db.select({ value: count() }).from(customers).where(and(...conditions));

    const [data, totalResult] = await Promise.all([customersQuery, totalQuery]);
    
    return { data, total: totalResult[0]?.value ?? 0 };
  }

  async updateCustomer(customerId: string, data: UpdateCustomerData): Promise<Customer | null> {
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
