import { NextRequest, NextResponse } from 'next/server';
import { usersService } from '@/backend/services/users/users.service';
import { UserIncludeOptions, GetAllUsersOptions, CreateUserData } from '@/backend/services/users/users.types';
import { parseIncludeQuery, parsePaginationParams, getStringFilterParam } from '../utils';
import { loginProviderEnum } from '@/db/schema';

const VALID_USER_INCLUDES: (keyof UserIncludeOptions)[] = [
  'connectedChannels',
  'products',
  'orders',
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
    const businessName = getStringFilterParam(searchParams, 'businessName');
    const loginProvider = getStringFilterParam(searchParams, 'loginProvider');

    const includeOptions = parseIncludeQuery<UserIncludeOptions, keyof UserIncludeOptions>(
      includeQuery,
      VALID_USER_INCLUDES
    );

    const options: GetAllUsersOptions = {
      include: includeOptions,
      limit,
      offset,
      filter: {},
    };

    if (email) options.filter!.email = email;
    if (businessName) options.filter!.businessName = businessName;
    if (loginProvider && isLoginProvider(loginProvider)) {
      options.filter!.loginProvider = loginProvider;
    }

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
    const newUser = await usersService.createUser(body);
    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
