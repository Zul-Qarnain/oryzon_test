import { db } from '@/db';
import { orders, orderItems, customers, connectedChannels, users, products } from '@/db/schema';
import {
  Order,
  CreateOrderData,
  UpdateOrderData,
  GetOrderByIdOptions,
  GetAllOrdersOptions,
  OrderFilterOptions,
  UpdateManyOrdersData,
  OrderWithIncludes,
  OrderItem,
} from './orders.types';
import { and, count, eq, ilike, inArray, desc, gte, lte } from 'drizzle-orm';

export class OrdersService {
  constructor() {}

  async createOrder(data: CreateOrderData): Promise<OrderWithIncludes | null> {
    // This operation should ideally be a transaction
    return db.transaction(async (tx) => {
      const [newOrder] = await tx
        .insert(orders)
        .values({
          customerId: data.customerId,
          channelId: data.channelId,
          userId: data.userId,
          orderStatus: data.orderStatus || 'PENDING',
          totalAmount: data.totalAmount,
          currency: data.currency,
          shippingAddress: data.shippingAddress,
          billingAddress: data.billingAddress,
        })
        .returning();

      if (!newOrder || !data.orderItems || data.orderItems.length === 0) {
        // If order creation failed or no items, rollback (implicitly by throwing or returning null from transaction)
        tx.rollback(); 
        return null; 
      }

      const orderItemsToInsert = data.orderItems.map(item => ({
        orderId: newOrder.orderId,
        productId: item.productId,
        quantity: item.quantity,
        priceAtPurchase: item.priceAtPurchase,
        currencyAtPurchase: item.currencyAtPurchase,
      }));

      const newOrderItems = await tx.insert(orderItems).values(orderItemsToInsert).returning();

      // Fetch the full order with items to return
      // This is a simplified re-fetch. In a real scenario, you might construct the object.
      const fullOrder = await tx.query.orders.findFirst({
        where: eq(orders.orderId, newOrder.orderId),
        with: {
          customer: true,
          connectedChannel: true,
          user: true,
          orderItems: {
            with: { product: true }
          }
        }
      });
      return fullOrder || null;
    });
  }

  async getOrderById(orderId: string, options?: GetOrderByIdOptions): Promise<OrderWithIncludes | null> {
    const query = db.query.orders.findFirst({
      where: eq(orders.orderId, orderId),
      with: {
        customer: options?.include?.customer ? true : undefined,
        connectedChannel: options?.include?.connectedChannel ? true : undefined,
        user: options?.include?.user ? true : undefined,
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

    const filter = options?.filter as OrderFilterOptions | undefined;
    const conditions = [];

    if (filter?.customerId) {
      conditions.push(eq(orders.customerId, filter.customerId));
    }
    if (filter?.channelId) {
      conditions.push(eq(orders.channelId, filter.channelId));
    }
    if (filter?.userId) {
      conditions.push(eq(orders.userId, filter.userId));
    }
    if (filter?.orderStatus) {
      conditions.push(eq(orders.orderStatus, filter.orderStatus));
    }
    if (filter?.currency) {
      conditions.push(eq(orders.currency, filter.currency));
    }
    if (filter?.minTotalAmount !== undefined) {
      conditions.push(gte(orders.totalAmount, filter.minTotalAmount.toString()));
    }
    if (filter?.maxTotalAmount !== undefined) {
      conditions.push(lte(orders.totalAmount, filter.maxTotalAmount.toString()));
    }
    if (filter?.createdAtBefore) {
      conditions.push(lte(orders.createdAt, filter.createdAtBefore));
    }
    if (filter?.createdAtAfter) {
      conditions.push(gte(orders.createdAt, filter.createdAtAfter));
    }
    
    const ordersQuery = db.query.orders.findMany({
      where: and(...conditions),
      limit: page,
      offset: offset,
      with: {
        customer: options?.include?.customer ? true : undefined,
        connectedChannel: options?.include?.connectedChannel ? true : undefined,
        user: options?.include?.user ? true : undefined,
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

    const totalQuery = db.select({ value: count() }).from(orders).where(and(...conditions));

    const [data, totalResult] = await Promise.all([ordersQuery, totalQuery]);
    
    return { data, total: totalResult[0]?.value ?? 0 };
  }

  async updateOrder(orderId: string, data: UpdateOrderData): Promise<Order | null> {
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
