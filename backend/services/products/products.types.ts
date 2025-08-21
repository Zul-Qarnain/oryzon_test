import { products, orderItems, users, businesses } from '@/db/schema';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { User } from '@/backend/services/users/users.types';
import { Business } from '@/backend/services/businesses/businesses.types'; // Import Business type

// Base Product type from schema
export type Product = InferSelectModel<typeof products>;
export type NewProduct = InferInsertModel<typeof products>;

// Options for including related entities
export interface ProductIncludeOptions {
  business?: boolean; // Product now belongs to a Business
  userViaProviderId?: boolean; // For the denormalized user link
  orderItems?: { limit?: number; offset?: number; include?: { order?: boolean } } | boolean;
  // connectedChannel is removed as products are now business-wide
}

// Options for GetById
export interface GetProductByIdOptions {
  include?: ProductIncludeOptions;

}

// Options for GetAll
export interface GetAllProductsOptions {
  limit?: number;
  offset?: number;
  filter?: ProductFilterOptions; // Changed to use the more comprehensive ProductFilterOptions
  include?: ProductIncludeOptions;
}

// Data for creating a new product
// businessId is mandatory for creating a product
export type CreateProductData = Omit<NewProduct, 'productId' | 'createdAt' | 'updatedAt' | 'providerUserId'> & {
  businessId: Business['businessId']; // Must belong to a business
  providerUserId?: User['providerUserId'] | null; // Optional, as it's nullable and denormalized
};

// Data for updating an existing product
// businessId should generally not be updatable. providerUserId can be.
export type UpdateProductData = Partial<Omit<NewProduct, 'productId' | 'businessId' | 'createdAt' | 'updatedAt'>>;

// Data for updating many products
export interface UpdateManyProductsData {
  price?: Product['price'];
  isAvailable?: Product['isAvailable'];
  // Add other fields suitable for bulk update
}

// Filter options for operations like updateMany or deleteMany
export interface ProductFilterOptions {
  id?: Product['productId'];
  ids?: Product['productId'][];

  businessId?: Business['businessId'];
  providerUserId?: User['providerUserId'] | null;
  name?: Product['name'];
  isAvailable?: Product['isAvailable'];
  imageId?: Product['imageId'];
  shortId?: Product['shortId'];
  minPrice?: number;
  maxPrice?: number;
  currency?: Product['currency'];
  createdAtBefore?: Date;
  createdAtAfter?: Date;
}

// --- Related entity types for inclusion ---
export type ProductWithIncludes = Product & {
  business?: Business; // Relation to Business
  userViaProviderId?: User | null; // Denormalized user
  orderItems?: (InferSelectModel<typeof orderItems> & { order?: InferSelectModel<typeof import('@/db/schema').orders> })[];
  // connectedChannel removed
};
