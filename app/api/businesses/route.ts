import { businessesService } from '@/backend/services/businesses/businesses.service';
import { CreateBusinessPayload } from '@/backend/services/businesses/businesses.types';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CreateBusinessPayload;

    // TODO: Add validation for body (e.g., with Zod)
    // TODO: Add authentication and authorization - ensure the user creating the business is valid
    // For example, extract userId from authenticated session instead of relying on payload for it.

    if (!body.userId || !body.name) {
      return NextResponse.json({ message: 'User ID and business name are required' }, { status: 400 });
    }

    const newBusiness = await businessesService.createBusiness(body);
    return NextResponse.json(newBusiness, { status: 201 });
  } catch (error) {
    console.error('Error creating business:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const providerUserId = url.searchParams.get('providerUserId');

    // TODO: Implement proper authentication and authorization.
    // For now, allows fetching by userId or providerUserId if provided, otherwise fetches all (not recommended for production).
    // In a real app, you'd likely get the authenticated user's ID and filter by that.

    let businessesList;
    if (userId) {
      businessesList = await businessesService.getBusinessesByUserId(userId);
    } else if (providerUserId) {
      businessesList = await businessesService.getBusinessesByProviderUserId(providerUserId);
    } else {
      // Potentially list all businesses - consider if this is desired or if auth should always be required.
      // For now, let's assume it requires some form of user identification for listing.
      // Returning an empty array or an error if no user identifier is provided might be safer.
      // businessesList = await db.query.businesses.findMany(); // Example: fetch all if allowed
      return NextResponse.json({ message: 'User identifier (userId or providerUserId) is required for listing businesses' }, { status: 400 });
    }

    return NextResponse.json(businessesList, { status: 200 });
  } catch (error) {
    console.error('Error fetching businesses:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ message: 'Internal server error', error: errorMessage }, { status: 500 });
  }
}
