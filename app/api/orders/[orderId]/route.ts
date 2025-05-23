import { ordersService } from '@/backend/services/orders/orders.service';
import { OrderIncludeOptions, UpdateOrderData } from '@/backend/services/orders/orders.types';
import { parseIncludeQuery } from '@/app/api/utils'; // Corrected import path

// Updated valid includes for an order
const VALID_ORDER_INCLUDES: (keyof OrderIncludeOptions)[] = [
  'business',
  'userViaProviderId',
  'customer',
  'connectedChannel',
  'orderItems',
  // 'user' (direct business user link) is removed
];

export async function GET(request: Request, props: { params: Promise<{ orderId: string }> }) {
  const params = await props.params;
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
    console.error('Error:', error);
    return new Response(JSON.stringify({ message: 'Internal server error' }), { status: 500 });
  }
}

export async function PUT(request: Request, props: { params: Promise<{ orderId: string }> }) {
  const params = await props.params;
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
    console.error('Error:', error);
    return new Response(JSON.stringify({ message: 'Internal server error' }), { status: 500 });
  }
}

export async function DELETE(request: Request, props: { params: Promise<{ orderId: string }> }) {
  const params = await props.params;
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
    console.error('Error:', error);
    return new Response(JSON.stringify({ message: 'Internal server error' }), { status: 500 });
  }
}
