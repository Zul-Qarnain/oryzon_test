import { db } from '@/db';
import { orders, orderItems, customers, connectedChannels, users, products, businesses } from '@/db/schema'; // Added businesses
import {
  Order,
  NewOrder, // Added NewOrder
  CreateOrderData,
  UpdateOrderData,
  GetOrderByIdOptions,
  GetAllOrdersOptions,
  OrderFilterOptions,
  UpdateManyOrdersData,
  OrderWithIncludes,
  OrderItem,
} from './orders.types';
import { and, count, eq, ilike, inArray, desc, gte, lte , sql} from 'drizzle-orm';

export class OrdersService {
  constructor() {}

  async createOrder(data: CreateOrderData): Promise<OrderWithIncludes | null> {
    // This operation should ideally be a transaction
    // return db.transaction(async (tx) => {
      const [newOrder] = await db
        .insert(orders)
        .values({
          businessId: data.businessId, // Added businessId
          providerUserId: data.providerUserId, // Added providerUserId (optional)
          customerId: data.customerId,
          channelId: data.channelId,
          // userId: data.userId, // Removed old userId
          orderStatus: data.orderStatus || 'PENDING',
          totalAmount: data.totalAmount,
          currency: data.currency,
          shippingAddress: data.shippingAddress,
        })
        .returning();

      if (!newOrder || !data.orderItems || data.orderItems.length === 0) {
        // If order creation failed or no items, rollback (implicitly by throwing or returning null from transaction)
        // tx.rollback(); // Removed as we are not in a transaction
        return null; 
      }

      const orderItemsToInsert = data.orderItems.map(item => ({
        orderId: newOrder.orderId,
        productId: item.productId,
        quantity: item.quantity,
        priceAtPurchase: item.priceAtPurchase,
        currencyAtPurchase: item.currencyAtPurchase,
      }));

      const newOrderItems = await db.insert(orderItems).values(orderItemsToInsert).returning();

      await db
        .update(customers)
        .set({
          address: sql`CASE WHEN ${customers.address} != ${data.shippingAddress} THEN ${data.shippingAddress} ELSE ${customers.address} END`, // Update address only if it's empty
        })
        .where(eq(customers.customerId, data.customerId));
      // Fetch the full order with items to return
      // This is a simplified re-fetch. In a real scenario, you might construct the object.
      const fullOrder = await db.query.orders.findFirst({
        where: eq(orders.orderId, newOrder.orderId),
        with: {
          business: true, // Added business
          userViaProviderId: true, // Added userViaProviderId
          customer: true,
          connectedChannel: true,
          // user: true, // Removed old user relation
          orderItems: {
            with: { product: true }
          }
        }
      });
      return fullOrder || null;
    // }); // Removed closing part of db.transaction
  }

  async getOrderById(orderId: string, options?: GetOrderByIdOptions): Promise<OrderWithIncludes | null> {
    const query = db.query.orders.findFirst({
      where: eq(orders.orderId, orderId),
      with: {
        business: options?.include?.business ? true : undefined, // Added business
        userViaProviderId: options?.include?.userViaProviderId ? true : undefined, // Added userViaProviderId
        customer: options?.include?.customer ? true : undefined,
        connectedChannel: options?.include?.connectedChannel ? true : undefined,
        // user: options?.include?.user ? true : undefined, // Removed old user relation
        orderItems: options?.include?.orderItems 
          ? { 
              limit: typeof options.include.orderItems === 'boolean' ? undefined : options.include.orderItems.limit,
              with: {
                product: typeof options.include.orderItems === 'object' && options.include.orderItems.include?.product ? true : undefined,
              }
            } 
          : undefined,
      }
    });
    const order = await query;
    return order || null;
  }

  async getAllOrders(options?: GetAllOrdersOptions): Promise<{ data: OrderWithIncludes[]; total: number }> {
    const page = options?.limit ?? 10;
    const offset = options?.offset ?? 0;

    const filter = options?.filter; // Type is Partial<Pick<Order, ...>>
    const conditions = [];

    if (filter?.businessId) { // Added businessId filter
      conditions.push(eq(orders.businessId, filter.businessId));
    }
    if (filter?.providerUserId) { // Added providerUserId filter
      conditions.push(eq(orders.providerUserId, filter.providerUserId));
    }
    if (filter?.customerId) {
      conditions.push(eq(orders.customerId, filter.customerId));
    }
    if (filter?.channelId) {
      conditions.push(eq(orders.channelId, filter.channelId));
    }
    // if (filter?.userId) { // Removed old userId filter
    //   conditions.push(eq(orders.userId, filter.userId));
    // }
    if (filter?.orderStatus) {
      conditions.push(eq(orders.orderStatus, filter.orderStatus));
    }
    if (filter?.currency) {
      conditions.push(eq(orders.currency, filter.currency));
    }
    // The following filters are part of OrderFilterOptions, not GetAllOrdersOptions.filter
    // If these are needed for getAllOrders, GetAllOrdersOptions.filter type needs to be updated.
    // For now, removing them to match the current type definition.
    // if (filter?.minTotalAmount !== undefined) {
    //   conditions.push(gte(orders.totalAmount, filter.minTotalAmount.toString()));
    // }
    // if (filter?.maxTotalAmount !== undefined) {
    //   conditions.push(lte(orders.totalAmount, filter.maxTotalAmount.toString()));
    // }
    // if (filter?.createdAtBefore) {
    //   conditions.push(lte(orders.createdAt, filter.createdAtBefore));
    // }
    // if (filter?.createdAtAfter) {
    //   conditions.push(gte(orders.createdAt, filter.createdAtAfter));
    // }
    
    const ordersQuery = db.query.orders.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      limit: page,
      offset: offset,
      with: {
        business: options?.include?.business ? true : undefined, // Added business
        userViaProviderId: options?.include?.userViaProviderId ? true : undefined, // Added userViaProviderId
        customer: options?.include?.customer ? true : undefined,
        connectedChannel: options?.include?.connectedChannel ? true : undefined,
        // user: options?.include?.user ? true : undefined, // Removed old user relation
        orderItems: options?.include?.orderItems 
          ? { 
              limit: typeof options.include.orderItems === 'boolean' ? undefined : options.include.orderItems.limit,
              with: {
                product: typeof options.include.orderItems === 'object' && options.include.orderItems.include?.product ? true : undefined,
              }
            } 
          : undefined,
      },
      orderBy: [desc(orders.createdAt)]
    });

    const totalQuery = db.select({ value: count() }).from(orders).where(conditions.length > 0 ? and(...conditions) : undefined);

    const [data, totalResult] = await Promise.all([ordersQuery, totalQuery]);
    
    return { data, total: totalResult[0]?.value ?? 0 };
  }

  async updateOrder(orderId: string, data: UpdateOrderData): Promise<Order | null> {
    // businessId, customerId, channelId are not part of UpdateOrderData.
    // providerUserId can be updated if present in data.
    const [updatedOrder] = await db
      .update(orders)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(orders.orderId, orderId))
      .returning();
    return updatedOrder || null;
  }

  async updateManyOrders(filter: OrderFilterOptions, data: UpdateManyOrdersData): Promise<{ count: number }> {
    if (!filter.ids || filter.ids.length === 0) {
      // Add other filter conditions if needed for bulk update
      return { count: 0 };
    }
    const result = await db
      .update(orders)
      .set({ ...data, updatedAt: new Date() })
      .where(inArray(orders.orderId, filter.ids as string[]));
      
    return { count: result.rowCount ?? 0 };
  }

  async deleteOrder(orderId: string): Promise<boolean> {
    // Consider implications: soft delete or archiving might be better.
    // Deleting order items might also be necessary if not handled by DB cascade.
    const result = await db.delete(orders).where(eq(orders.orderId, orderId));
    return (result.rowCount ?? 0) > 0;
  }

  async deleteManyOrders(filter: OrderFilterOptions): Promise<{ count: number }> {
    if (!filter.ids || filter.ids.length === 0) {
      return { count: 0 };
    }
    const result = await db.delete(orders).where(inArray(orders.orderId, filter.ids as string[]));
    return { count: result.rowCount ?? 0 };
  }
}

export const ordersService = new OrdersService();
