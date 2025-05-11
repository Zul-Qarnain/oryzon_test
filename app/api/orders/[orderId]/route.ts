import { ordersService } from '@/backend/services/orders/orders.service';
import { OrderIncludeOptions, UpdateOrderData } from '@/backend/services/orders/orders.types';
import { parseIncludeQuery } from '../../utils';

const VALID_ORDER_INCLUDES: (keyof OrderIncludeOptions)[] = [
  'customer',
  'connectedChannel',
  'user',
  'orderItems',
];

export async function GET(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  const { orderId } = params;

  if (!orderId) {
    return new Response(JSON.stringify({ message: 'Order ID is required' }), { status: 400 });
  }

  try {
    const url = new URL(request.url);
    const includeQuery = url.searchParams.get('include');
    const includeOptions = parseIncludeQuery<OrderIncludeOptions, keyof OrderIncludeOptions>(
      includeQuery,
      VALID_ORDER_INCLUDES
    );

    const order = await ordersService.getOrderById(orderId, { include: includeOptions });

    if (!order) {
      return new Response(JSON.stringify({ message: 'Order not found' }), { status: 404 });
    }
    return new Response(JSON.stringify(order), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ message: 'Internal server error' }), { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  const { orderId } = params;

  if (!orderId) {
    return new Response(JSON.stringify({ message: 'Order ID is required' }), { status: 400 });
  }

  try {
    const body = await request.json() as UpdateOrderData;
    // TODO: Add validation for body (e.g. with Zod)
    const updatedOrder = await ordersService.updateOrder(orderId, body);

    if (!updatedOrder) {
      return new Response(JSON.stringify({ message: 'Order not found' }), { status: 404 });
    }
    return new Response(JSON.stringify(updatedOrder), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ message: 'Internal server error' }), { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  const { orderId } = params;

  if (!orderId) {
    return new Response(JSON.stringify({ message: 'Order ID is required' }), { status: 400 });
  }

  try {
    const deleted = await ordersService.deleteOrder(orderId);

    if (!deleted) {
      return new Response(JSON.stringify({ message: 'Order not found' }), { status: 404 });
    }
    return new Response(null, { status: 204 });
  } catch (error) {
    return new Response(JSON.stringify({ message: 'Internal server error' }), { status: 500 });
  }
}
