import { businessesService } from '@/backend/services/businesses/businesses.service';
import { BusinessWithRelations, UpdateBusinessPayload } from '@/backend/services/businesses/businesses.types';
import { parseIncludeQuery } from '@/app/api/utils'; // Using path alias

// Define which relations can be included for a business
const VALID_BUSINESS_INCLUDES: (keyof BusinessWithRelations)[] = [
  'user',
  'userViaProviderId',
  'connectedChannels',
  'products',
  'customers',
  'orders',
];

export async function GET(
  request: Request,
  { params }: { params: { businessId: string } }
) {
  const { businessId } = params;

  if (!businessId) {
    return new Response(JSON.stringify({ message: 'Business ID is required' }), { status: 400 });
  }

  try {
    const url = new URL(request.url);
    const includeQuery = url.searchParams.get('include');
    
    // Determine if relations should be included based on the query or a simple boolean flag for now
    // The parseIncludeQuery utility might need adjustment if BusinessWithRelations keys differ significantly
    // For simplicity, we'll use a boolean flag derived from the presence of 'include' for now.
    // A more robust solution would adapt parseIncludeQuery or use a similar utility tailored for businesses.
    const shouldIncludeRelations = !!includeQuery; // Basic check, can be refined

    const business = await businessesService.getBusinessById(businessId, shouldIncludeRelations);

    if (!business) {
      return new Response(JSON.stringify({ message: 'Business not found' }), { status: 404 });
    }
    return new Response(JSON.stringify(business), { status: 200 });
  } catch (error) {
    console.error('Error fetching business:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ message: 'Internal server error', error: errorMessage }), { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { businessId: string } }
) {
  const { businessId } = params;

  if (!businessId) {
    return new Response(JSON.stringify({ message: 'Business ID is required' }), { status: 400 });
  }

  try {
    const body = await request.json() as UpdateBusinessPayload;
    // TODO: Add validation for body (e.g., with Zod)
    const updatedBusiness = await businessesService.updateBusiness(businessId, body);

    if (!updatedBusiness) {
      return new Response(JSON.stringify({ message: 'Business not found or update failed' }), { status: 404 });
    }
    return new Response(JSON.stringify(updatedBusiness), { status: 200 });
  } catch (error) {
    console.error('Error updating business:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ message: 'Internal server error', error: errorMessage }), { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { businessId: string } }
) {
  const { businessId } = params;

  if (!businessId) {
    return new Response(JSON.stringify({ message: 'Business ID is required' }), { status: 400 });
  }

  try {
    const result = await businessesService.deleteBusiness(businessId);

    if (!result.success) {
      // Distinguish between "not found" and other deletion errors if possible
      return new Response(JSON.stringify({ message: 'Business not found or could not be deleted' }), { status: 404 });
    }
    return new Response(null, { status: 204 }); // No content on successful deletion
  } catch (error) {
    console.error('Error deleting business:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ message: 'Internal server error', error: errorMessage }), { status: 500 });
  }
}
