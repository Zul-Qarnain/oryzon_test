import { ordersService } from '@/backend/services/orders/orders.service';
import { OrderIncludeOptions, GetAllOrdersOptions, CreateOrderData } from '@/backend/services/orders/orders.types';
import { parseIncludeQuery, parsePaginationParams, getStringFilterParam } from '../utils';
import { orderStatusEnum } from '@/db/schema';

const VALID_ORDER_INCLUDES: (keyof OrderIncludeOptions)[] = [
  'customer',
  'connectedChannel',
  'user',
  'orderItems',
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

    const customerId = getStringFilterParam(searchParams, 'customerId');
    const channelId = getStringFilterParam(searchParams, 'channelId');
    const userId = getStringFilterParam(searchParams, 'userId');
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
      filter: {},
    };

    if (customerId) options.filter!.customerId = customerId;
    if (channelId) options.filter!.channelId = channelId;
    if (userId) options.filter!.userId = userId;
    if (orderStatus && isOrderStatus(orderStatus)) options.filter!.orderStatus = orderStatus;
    if (currency) options.filter!.currency = currency;

    const result = await ordersService.getAllOrders(options);
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ message: 'Internal server error' }), { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as CreateOrderData;
    // TODO: Add validation for body (e.g. with Zod)
    const newOrder = await ordersService.createOrder(body);
    return new Response(JSON.stringify(newOrder), { status: 201 });
  } catch (error) {
    return new Response(JSON.stringify({ message: 'Internal server error' }), { status: 500 });
  }
}
