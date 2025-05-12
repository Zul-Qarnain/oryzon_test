import { products, orderItems, connectedChannels } from '@/db/schema'; // Removed unused 'users', added connectedChannels
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { User } from '@/backend/services/users/users.types'; // Assuming User type is needed
import { ConnectedChannel } from '@/backend/services/channels/channels.types'; // Assuming ConnectedChannel type

// Base Product type from schema
export type Product = InferSelectModel<typeof products>;
export type NewProduct = InferInsertModel<typeof products>;

// Options for including related entities
export interface ProductIncludeOptions {
  user?: boolean; // Include the User who defined the product
  connectedChannel?: boolean; // Include the ConnectedChannel
  orderItems?: { limit?: number; offset?: number; include?: { order?: boolean } } | boolean; // Include order items related to this product
}

// Options for GetById
export interface GetProductByIdOptions {
  include?: ProductIncludeOptions;
}

// Options for GetAll
export interface GetAllProductsOptions {
  limit?: number;
  offset?: number;
  filter?: Partial<Pick<Product, 'name' | 'currency' | 'isAvailable' | 'userId' | 'channelId' | 'imageId' | 'shortId'>>;
  include?: ProductIncludeOptions;
}

// Data for creating a new product
// userId is mandatory for creating a product
export type CreateProductData = Omit<NewProduct, 'productId' | 'createdAt' | 'updatedAt'> & {
  userId: User['userId'];
  channelId?: Product['channelId']; // channelId is optional
};

// Data for updating an existing product
export type UpdateProductData = Partial<Omit<NewProduct, 'productId' | 'userId' | 'createdAt' | 'updatedAt'>>;

// Data for updating many products
export interface UpdateManyProductsData {
  price?: Product['price'];
  isAvailable?: Product['isAvailable'];
  // Add other fields suitable for bulk update
}

// Filter options for operations like updateMany or deleteMany
export interface ProductFilterOptions {
  ids?: Product['productId'][];
  userId?: User['userId'];
  channelId?: Product['channelId'];
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
  user?: User;
  connectedChannel?: ConnectedChannel | null; // Allow null for connectedChannel
  orderItems?: (InferSelectModel<typeof orderItems> & { order?: InferSelectModel<typeof import('@/db/schema').orders> })[];
};
