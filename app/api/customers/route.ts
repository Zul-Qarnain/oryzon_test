import { customersService } from '@/backend/services/customers/customers.service';
import { CustomerIncludeOptions, GetAllCustomersOptions, CreateCustomerData } from '@/backend/services/customers/customers.types';
import { parseIncludeQuery, parsePaginationParams, getStringFilterParam } from '../utils';

const VALID_CUSTOMER_INCLUDES: (keyof CustomerIncludeOptions)[] = [
  'connectedChannel',
  'orders',
  'chats',
];

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const includeQuery = searchParams.get('include');
    const { limit, offset } = parsePaginationParams(searchParams, 10, 0, 100);

    const channelId = getStringFilterParam(searchParams, 'channelId');
    const platformCustomerId = getStringFilterParam(searchParams, 'platformCustomerId');
    const fullName = getStringFilterParam(searchParams, 'fullName');

    const includeOptions = parseIncludeQuery<CustomerIncludeOptions, keyof CustomerIncludeOptions>(
      includeQuery,
      VALID_CUSTOMER_INCLUDES
    );

    const options: GetAllCustomersOptions = {
      include: includeOptions,
      limit,
      offset,
      filter: {},
    };

    if (channelId) options.filter!.channelId = channelId;
    if (platformCustomerId) options.filter!.platformCustomerId = platformCustomerId;
    if (fullName) options.filter!.fullName = fullName;

    const result = await customersService.getAllCustomers(options);
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ message: 'Internal server error' }), { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as CreateCustomerData;
    // TODO: Add validation for body (e.g. with Zod)
    const newCustomer = await customersService.createCustomer(body);
    return new Response(JSON.stringify(newCustomer), { status: 201 });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ message: 'Internal server error' }), { status: 500 });
  }
}
