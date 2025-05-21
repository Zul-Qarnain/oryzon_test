import { productsService } from '@/backend/services/products/products.service';
import { ProductIncludeOptions, GetAllProductsOptions, CreateProductData } from '@/backend/services/products/products.types';
import { parseIncludeQuery, parsePaginationParams, getStringFilterParam } from '../utils';

const VALID_PRODUCT_INCLUDES: (keyof ProductIncludeOptions)[] = [
  'user',
  'orderItems',
  'connectedChannel', // Add connectedChannel
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
    const userId = getStringFilterParam(searchParams, 'userId');
    const channelId = getStringFilterParam(searchParams, 'channelId'); // Add channelId
    const imageId = getStringFilterParam(searchParams, 'imageId');
    const shortId = getStringFilterParam(searchParams, 'shortId');

    const includeOptions = parseIncludeQuery<ProductIncludeOptions, keyof ProductIncludeOptions>(
      includeQuery,
      VALID_PRODUCT_INCLUDES
    );

    const options: GetAllProductsOptions = {
      include: includeOptions,
      limit,
      offset,
      filter: {},
    };

    if (name) options.filter!.name = name;
    if (currency) options.filter!.currency = currency;
    if (isAvailable !== null && isAvailable !== undefined) options.filter!.isAvailable = isAvailable === 'true';
    if (userId) options.filter!.userId = userId;
    if (channelId) options.filter!.channelId = channelId; // Add channelId to filter
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
    const newProduct = await productsService.createProduct(body);
    return new Response(JSON.stringify(newProduct), { status: 201 });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ message: 'Internal server error' }), { status: 500 });
  }
}
