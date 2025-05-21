import { ordersService } from '@/backend/services/orders/orders.service';
import { OrderIncludeOptions, GetAllOrdersOptions, CreateOrderData, Order } from '@/backend/services/orders/orders.types'; // Added Order
import { parseIncludeQuery, parsePaginationParams, getStringFilterParam } from '@/app/api/utils'; // Corrected import path
import { orderStatusEnum } from '@/db/schema';

// Updated valid includes for an order
const VALID_ORDER_INCLUDES: (keyof OrderIncludeOptions)[] = [
  'business',
  'userViaProviderId',
  'customer',
  'connectedChannel',
  'orderItems',
  // 'user' (direct business user link) is removed
];

type OrderStatus = typeof orderStatusEnum.enumValues[number];

function isOrderStatus(value: string): value is OrderStatus {
  return orderStatusEnum.enumValues.includes(value as OrderStatus);
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const includeQuery = searchParams.get('include');
    const { limit, offset } = parsePaginationParams(searchParams, 10, 0, 100);

    const businessId = getStringFilterParam(searchParams, 'businessId'); // New filter
    const providerUserId = getStringFilterParam(searchParams, 'providerUserId'); // New filter
    const customerId = getStringFilterParam(searchParams, 'customerId');
    const channelId = getStringFilterParam(searchParams, 'channelId');
    // const userId = getStringFilterParam(searchParams, 'userId'); // Old userId filter removed
    const orderStatus = getStringFilterParam(searchParams, 'orderStatus');
    const currency = getStringFilterParam(searchParams, 'currency');

    const includeOptions = parseIncludeQuery<OrderIncludeOptions, keyof OrderIncludeOptions>(
      includeQuery,
      VALID_ORDER_INCLUDES
    );

    const options: GetAllOrdersOptions = {
      include: includeOptions,
      limit,
      offset,
      filter: {} as Partial<Pick<Order, 'businessId' | 'providerUserId' | 'customerId' | 'channelId' | 'orderStatus' | 'currency'>>, // Initialize filter
    };

    if (businessId) options.filter!.businessId = businessId;
    if (providerUserId) options.filter!.providerUserId = providerUserId;
    if (customerId) options.filter!.customerId = customerId;
    if (channelId) options.filter!.channelId = channelId;
    // if (userId) options.filter!.userId = userId; // Old userId filter removed
    if (orderStatus && isOrderStatus(orderStatus)) options.filter!.orderStatus = orderStatus;
    if (currency) options.filter!.currency = currency;

    const result = await ordersService.getAllOrders(options);
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ message: 'Internal server error' }), { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as CreateOrderData;
    // TODO: Add validation for body (e.g. with Zod)
    // Ensure businessId, customerId, channelId, totalAmount, currency, and orderItems are provided
    if (!body.businessId || !body.customerId || !body.channelId || !body.totalAmount || !body.currency || !body.orderItems || body.orderItems.length === 0) {
      return new Response(JSON.stringify({ message: 'businessId, customerId, channelId, totalAmount, currency, and at least one orderItem are required' }), { status: 400 });
    }
    // providerUserId is optional

    const newOrder = await ordersService.createOrder(body);
    if (!newOrder) { // Handle case where order creation might fail (e.g., transaction rollback)
        return new Response(JSON.stringify({ message: 'Failed to create order' }), { status: 500 });
    }
    return new Response(JSON.stringify(newOrder), { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ message: 'Internal server error', error: errorMessage }), { status: 500 });
  }
}
