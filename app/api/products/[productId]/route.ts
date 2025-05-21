import { productsService } from '@/backend/services/products/products.service';
import { ProductIncludeOptions, UpdateProductData } from '@/backend/services/products/products.types';
import { parseIncludeQuery } from '@/app/api/utils'; // Corrected import path

// Updated valid includes for a product
const VALID_PRODUCT_INCLUDES: (keyof ProductIncludeOptions)[] = [
  'business',
  'userViaProviderId', // For the denormalized user link
  'orderItems',
  // 'user' and 'connectedChannel' are removed as direct relations for include
];

export async function GET(
  request: Request,
  { params }: { params: { productId: string } }
) {
  const { productId } = params;

  if (!productId) {
    return new Response(JSON.stringify({ message: 'Product ID is required' }), { status: 400 });
  }

  try {
    const url = new URL(request.url);
    const includeQuery = url.searchParams.get('include');
    const includeOptions = parseIncludeQuery<ProductIncludeOptions, keyof ProductIncludeOptions>(
      includeQuery,
      VALID_PRODUCT_INCLUDES
    );

    const product = await productsService.getProductById(productId, { include: includeOptions });

    if (!product) {
      return new Response(JSON.stringify({ message: 'Product not found' }), { status: 404 });
    }
    return new Response(JSON.stringify(product), { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ message: 'Internal server error' }), { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { productId: string } }
) {
  const { productId } = params;

  if (!productId) {
    return new Response(JSON.stringify({ message: 'Product ID is required' }), { status: 400 });
  }

  try {
    const body = await request.json() as UpdateProductData;
    // TODO: Add validation for body (e.g. with Zod)
    const updatedProduct = await productsService.updateProduct(productId, body);

    if (!updatedProduct) {
      return new Response(JSON.stringify({ message: 'Product not found' }), { status: 404 });
    }
    return new Response(JSON.stringify(updatedProduct), { status: 200 });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ message: 'Internal server error' }), { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { productId: string } }
) {
  const { productId } = params;

  if (!productId) {
    return new Response(JSON.stringify({ message: 'Product ID is required' }), { status: 400 });
  }

  try {
    const deleted = await productsService.deleteProduct(productId);

    if (!deleted) {
      return new Response(JSON.stringify({ message: 'Product not found' }), { status: 404 });
    }
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ message: 'Internal server error' }), { status: 500 });
  }
}
