import { db } from '@/db';
import { products,} from '@/db/schema'; // users and orderItems might be needed by Drizzle for relational queries
import {
  Product,
  CreateProductData,
  UpdateProductData,
  GetProductByIdOptions,
  GetAllProductsOptions,
  ProductFilterOptions, // Ensure this is the one being used for filter type
  UpdateManyProductsData,
  ProductWithIncludes,
} from './products.types';
import { and, count, eq, ilike, inArray, gte, lte, desc } from 'drizzle-orm';

export class ProductsService {
  constructor() {}

  async createProduct(data: CreateProductData): Promise<Product> {
    const [newProduct] = await db.insert(products).values(data).returning();
    return newProduct;
  }

  async getProductById(productId: string, options?: GetProductByIdOptions): Promise<ProductWithIncludes | null> {
    const query = db.query.products.findFirst({
      where: eq(products.productId, productId),
      with: {
        user: options?.include?.user ? true : undefined,
        connectedChannel: options?.include?.connectedChannel ? true : undefined,
        orderItems: options?.include?.orderItems
          ? {
              limit: typeof options.include.orderItems === 'boolean' ? undefined : options.include.orderItems.limit,
              // offset is not directly supported in nested 'with' like this for eager loading
              with: {
                order: typeof options.include.orderItems === 'object' && options.include.orderItems.include?.order ? true : undefined,
              },
            }
          : undefined,
      }
    });
    const product = await query;
    return product || null;
  }

  async getAllProducts(options?: GetAllProductsOptions): Promise<{ data: ProductWithIncludes[]; total: number }> {
    const page = options?.limit ?? 10;
    const offset = options?.offset ?? 0;

    // Explicitly type the filter object using ProductFilterOptions
    const filter: ProductFilterOptions | undefined = options?.filter as ProductFilterOptions | undefined;
    const conditions = [];

    if (filter?.name) {
      conditions.push(ilike(products.name, `%${filter.name}%`));
    }
    if (filter?.userId) {
      conditions.push(eq(products.userId, filter.userId));
    }
    if (filter?.channelId) {
      conditions.push(eq(products.channelId, filter.channelId));
    }
    if (filter?.isAvailable !== undefined) {
      conditions.push(eq(products.isAvailable, filter.isAvailable));
    }
    if (filter?.currency) {
      conditions.push(eq(products.currency, filter.currency));
    }
    if (filter?.minPrice !== undefined) {
      conditions.push(gte(products.price, filter.minPrice.toString()));
    }
    if (filter?.maxPrice !== undefined) {
      conditions.push(lte(products.price, filter.maxPrice.toString()));
    }
    if (filter?.createdAtBefore) {
      conditions.push(lte(products.createdAt, filter.createdAtBefore));
    }
    if (filter?.createdAtAfter) {
      conditions.push(gte(products.createdAt, filter.createdAtAfter));
    }
    if (filter?.imageId) {
      conditions.push(eq(products.imageId, filter.imageId));
    }
    if (filter?.shortId) {
      conditions.push(eq(products.shortId, filter.shortId));
    }

    const productsQuery = db.query.products.findMany({
      where: and(...conditions),
      limit: page,
      offset: offset,
      with: {
        user: options?.include?.user ? true : undefined,
        connectedChannel: options?.include?.connectedChannel ? true : undefined,
        orderItems: options?.include?.orderItems
          ? {
              limit: typeof options.include.orderItems === 'boolean' ? undefined : options.include.orderItems.limit,
              // offset is not directly supported in nested 'with' like this for eager loading
              with: {
                order: typeof options.include.orderItems === 'object' && options.include.orderItems.include?.order ? true : undefined,
              },
            }
          : undefined,
      },
      orderBy: [desc(products.createdAt)] // Default order
    });

    const totalQuery = db.select({ value: count() }).from(products).where(and(...conditions));

    const [data, totalResult] = await Promise.all([productsQuery, totalQuery]);
    
    return { data, total: totalResult[0]?.value ?? 0 };
  }

  async updateProduct(productId: string, data: UpdateProductData): Promise<Product | null> {
    // Ensure userId is not updated this way
    const { ...updateData } = data; 
    const [updatedProduct] = await db
      .update(products)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(products.productId, productId))
      .returning();
    return updatedProduct || null;
  }

  async updateManyProducts(filter: ProductFilterOptions, data: UpdateManyProductsData): Promise<{ count: number }> {
    if (!filter.ids || filter.ids.length === 0) {
      // Consider other filters if applicable for bulk update
      return { count: 0 };
    }
    const result = await db
      .update(products)
      .set({ ...data, updatedAt: new Date() })
      .where(inArray(products.productId, filter.ids as string[]));
      
    return { count: result.rowCount ?? 0 }; // rowCount is specific to pg driver, may need adjustment for Neon HTTP
  }

  async deleteProduct(productId: string): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.productId, productId));
    return (result.rowCount ?? 0) > 0; // rowCount is specific to pg driver, may need adjustment for Neon HTTP
  }

  async deleteManyProducts(filter: ProductFilterOptions): Promise<{ count: number }> {
    if (!filter.ids || filter.ids.length === 0) {
      return { count: 0 };
    }
    const result = await db.delete(products).where(inArray(products.productId, filter.ids as string[]));
    return { count: result.rowCount ?? 0 }; // rowCount is specific to pg driver, may need adjustment for Neon HTTP
  }
}

export const productsService = new ProductsService();
