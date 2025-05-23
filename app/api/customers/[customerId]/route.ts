import { customersService } from '@/backend/services/customers/customers.service';
import { CustomerIncludeOptions, UpdateCustomerData } from '@/backend/services/customers/customers.types';
import { parseIncludeQuery } from '@/app/api/utils'; // Corrected import path

// Updated valid includes for a customer
const VALID_CUSTOMER_INCLUDES: (keyof CustomerIncludeOptions)[] = [
  'business',
  'userViaProviderId',
  'connectedChannel',
  'orders',
  'chats',
];

export async function GET(
  request: Request,
  context: { params: Promise<{ customerId: string }> }
) {
  const params = await context.params;
  const { customerId } = params;

  if (!customerId) {
    return new Response(JSON.stringify({ message: 'Customer ID is required' }), { status: 400 });
  }

  try {
    const url = new URL(request.url);
    const includeQuery = url.searchParams.get('include');
    const includeOptions = parseIncludeQuery<CustomerIncludeOptions, keyof CustomerIncludeOptions>(
      includeQuery,
      VALID_CUSTOMER_INCLUDES
    );

    const customer = await customersService.getCustomerById(customerId, { include: includeOptions });

    if (!customer) {
      return new Response(JSON.stringify({ message: 'Customer not found' }), { status: 404 });
    }
    return new Response(JSON.stringify(customer), { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ message: 'Internal server error' }), { status: 500 });
  }
}

export async function PUT(request: Request, props: { params: Promise<{ customerId: string }> }) {
  const params = await props.params;
  const { customerId } = params;

  if (!customerId) {
    return new Response(JSON.stringify({ message: 'Customer ID is required' }), { status: 400 });
  }

  try {
    const body = await request.json() as UpdateCustomerData;
    // TODO: Add validation for body (e.g. with Zod)
    const updatedCustomer = await customersService.updateCustomer(customerId, body);

    if (!updatedCustomer) {
      return new Response(JSON.stringify({ message: 'Customer not found' }), { status: 404 });
    }
    return new Response(JSON.stringify(updatedCustomer), { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ message: 'Internal server error' }), { status: 500 });
  }
}

export async function DELETE(request: Request, props: { params: Promise<{ customerId: string }> }) {
  const params = await props.params;
  const { customerId } = params;

  if (!customerId) {
    return new Response(JSON.stringify({ message: 'Customer ID is required' }), { status: 400 });
  }

  try {
    const deleted = await customersService.deleteCustomer(customerId);

    if (!deleted) {
      return new Response(JSON.stringify({ message: 'Customer not found' }), { status: 404 });
    }
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ message: 'Internal server error' }), { status: 500 });
  }
}
