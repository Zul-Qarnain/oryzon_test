import { productsService } from '@/backend/services/products/products.service';
import { parseIncludeQuery, parsePaginationParams, getStringFilterParam } from '@/app/api/utils'; // Corrected import path

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const searchParams = url.searchParams;
        const imageUrl = getStringFilterParam(searchParams, 'imageUrl');
        const keywords = getStringFilterParam(searchParams, 'keywords');
        const businessId = getStringFilterParam(searchParams, 'businessId');
        console.log('Search parameters:', { keywords, imageUrl, businessId });
        if (keywords) {
            const products = await productsService.getProductByKeyword(keywords, { filter: { businessId: businessId } });
            console.log(products)
            return new Response(JSON.stringify(products), { status: 200 });
        }
        if (imageUrl) {
            const products = await productsService.getProductsByImageURL(imageUrl, businessId!);
            if (products) {
            console.log(products)
                return new Response(JSON.stringify({ total: products.length, data: products }), { status: 200 });
            }
            return new Response(JSON.stringify({ total: 0, data: [] }), { status: 200 });
        }
    }
    catch (error) {
        console.error('Error:', error);
        return new Response(JSON.stringify({ message: 'Internal server error' }), { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { imageUrl, businessId } = body;
        
        console.log('POST Search parameters:', { imageUrl: imageUrl , businessId });
        
        if (!imageUrl) {
            return new Response(JSON.stringify({ message: 'imageUrl is required' }), { status: 400 });
        }
        
        const products = await productsService.getProductsByImageURL(imageUrl, businessId!);
        if (products) {
            console.log(`Found ${products.length} products`);
            return new Response(JSON.stringify({ total: products.length, data: products }), { status: 200 });
        }
        return new Response(JSON.stringify({ total: 0, data: [] }), { status: 200 });
    }
    catch (error) {
        console.error('POST Error:', error);
        return new Response(JSON.stringify({ message: 'Internal server error' }), { status: 500 });
    }
}

