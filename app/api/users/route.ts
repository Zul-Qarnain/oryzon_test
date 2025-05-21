import { NextRequest, NextResponse } from 'next/server';
import { usersService } from '@/backend/services/users/users.service';
import { UserIncludeOptions, GetAllUsersOptions, CreateUserData, User } from '@/backend/services/users/users.types'; // Added User
import { parseIncludeQuery, parsePaginationParams, getStringFilterParam } from '@/app/api/utils'; // Corrected import path
import { loginProviderEnum } from '@/db/schema';

// Updated valid includes for a user
const VALID_USER_INCLUDES: (keyof UserIncludeOptions)[] = [
  'businesses',
];

type LoginProvider = typeof loginProviderEnum.enumValues[number];

function isLoginProvider(value: string): value is LoginProvider {
  return loginProviderEnum.enumValues.includes(value as LoginProvider);
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const includeQuery = searchParams.get('include');
    const { limit, offset } = parsePaginationParams(searchParams, 10, 0, 100);

    const email = getStringFilterParam(searchParams, 'email');
    const loginProvider = getStringFilterParam(searchParams, 'loginProvider');
    const providerUserId = getStringFilterParam(searchParams, 'providerUserId'); // New filter
    const name = getStringFilterParam(searchParams, 'name'); // New filter
    const phone = getStringFilterParam(searchParams, 'phone'); // New filter
    // businessName filter removed

    const includeOptions = parseIncludeQuery<UserIncludeOptions, keyof UserIncludeOptions>(
      includeQuery,
      VALID_USER_INCLUDES
    );

    const options: GetAllUsersOptions = {
      include: includeOptions,
      limit,
      offset,
      filter: {} as Partial<Pick<User, 'email' | 'loginProvider' | 'providerUserId' | 'name' | 'phone'>>, // Initialize filter
    };

    if (email) options.filter!.email = email;
    if (loginProvider && isLoginProvider(loginProvider)) {
      options.filter!.loginProvider = loginProvider;
    }
    if (providerUserId) options.filter!.providerUserId = providerUserId;
    if (name) options.filter!.name = name;
    if (phone) options.filter!.phone = phone;

    const result = await usersService.getAllUsers(options);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CreateUserData;
    // TODO: Add validation for body (e.g. with Zod)
    // Basic validation for required fields
    if (!body.name || (!body.email && !body.providerUserId)) {
      return NextResponse.json({ message: 'Name and either Email or Provider User ID are required' }, { status: 400 });
    }

    const newUser = await usersService.createUser(body);
    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    // Check for unique constraint errors (e.g., email or providerUserId already exists)
    if (errorMessage.includes('unique constraint')) { // Basic check, can be more specific
        return NextResponse.json({ message: 'User with this email or provider ID already exists.', error: errorMessage }, { status: 409 });
    }
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}
