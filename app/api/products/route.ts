import { productsService } from '@/backend/services/products/products.service';
import { ProductIncludeOptions, GetAllProductsOptions, CreateProductData, Product } from '@/backend/services/products/products.types'; // Added Product
import { parseIncludeQuery, parsePaginationParams, getStringFilterParam } from '@/app/api/utils'; // Corrected import path

// Updated valid includes for a product
const VALID_PRODUCT_INCLUDES: (keyof ProductIncludeOptions)[] = [
  'business',
  'userViaProviderId',
  'orderItems',
  // 'user' and 'connectedChannel' are removed
];

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const includeQuery = searchParams.get('include');
    const { limit, offset } = parsePaginationParams(searchParams, 10, 0, 100);

    const name = getStringFilterParam(searchParams, 'name');
    const currency = getStringFilterParam(searchParams, 'currency');
    const isAvailable = getStringFilterParam(searchParams, 'isAvailable');
    const businessId = getStringFilterParam(searchParams, 'businessId'); // New filter
    const providerUserId = getStringFilterParam(searchParams, 'providerUserId'); // New filter for denormalized field
    const imageId = getStringFilterParam(searchParams, 'imageId');
    const shortId = getStringFilterParam(searchParams, 'shortId');
    // Removed userId and channelId filters

    const includeOptions = parseIncludeQuery<ProductIncludeOptions, keyof ProductIncludeOptions>(
      includeQuery,
      VALID_PRODUCT_INCLUDES
    );

    const options: GetAllProductsOptions = {
      include: includeOptions,
      limit,
      offset,
      filter: {} as Partial<Pick<Product, 'name' | 'currency' | 'isAvailable' | 'businessId' | 'providerUserId' | 'imageId' | 'shortId'>>, // Initialize filter
    };

    if (name) options.filter!.name = name;
    if (currency) options.filter!.currency = currency;
    if (isAvailable !== null && isAvailable !== undefined) options.filter!.isAvailable = isAvailable === 'true';
    if (businessId) options.filter!.businessId = businessId;
    if (providerUserId) options.filter!.providerUserId = providerUserId;
    if (imageId) options.filter!.imageId = imageId;
    if (shortId) options.filter!.shortId = shortId;

    const result = await productsService.getAllProducts(options);
    return new Response(JSON.stringify(result), { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ message: 'Internal server error' }), { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as CreateProductData;
    // TODO: Add validation for body (e.g. with Zod)
    // Ensure businessId is provided, as it's mandatory in CreateProductData
    if (!body.businessId || !body.name || !body.price || !body.currency) {
      return new Response(JSON.stringify({ message: 'businessId, name, price, and currency are required' }), { status: 400 });
    }
    // providerUserId is optional in CreateProductData

    const newProduct = await productsService.createProduct(body);
    return new Response(JSON.stringify(newProduct), { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ message: 'Internal server error', error: errorMessage }), { status: 500 });
  }
}
