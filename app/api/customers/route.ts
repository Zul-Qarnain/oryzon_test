import { customersService } from '@/backend/services/customers/customers.service';
import { CustomerIncludeOptions, GetAllCustomersOptions, CreateCustomerData, Customer } from '@/backend/services/customers/customers.types'; // Added Customer
import { parseIncludeQuery, parsePaginationParams, getStringFilterParam } from '@/app/api/utils'; // Corrected import path

// Updated valid includes for a customer
const VALID_CUSTOMER_INCLUDES: (keyof CustomerIncludeOptions)[] = [
  'business',
  'userViaProviderId',
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

    const businessId = getStringFilterParam(searchParams, 'businessId'); // New filter
    const providerUserId = getStringFilterParam(searchParams, 'providerUserId'); // New filter
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
      filter: {} as Partial<Pick<Customer, 'businessId' | 'providerUserId' | 'channelId' | 'platformCustomerId' | 'fullName'>>, // Initialize filter
    };

    if (businessId) options.filter!.businessId = businessId;
    if (providerUserId) options.filter!.providerUserId = providerUserId;
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
    // Ensure businessId, channelId, and platformCustomerId are provided
    if (!body.businessId || !body.channelId || !body.platformCustomerId) {
      return new Response(JSON.stringify({ message: 'businessId, channelId, and platformCustomerId are required' }), { status: 400 });
    }
    // providerUserId is optional

    const newCustomer = await customersService.createCustomer(body);
    return new Response(JSON.stringify(newCustomer), { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ message: 'Internal server error', error: errorMessage }), { status: 500 });
  }
}
