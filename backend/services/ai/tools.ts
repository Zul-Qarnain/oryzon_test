import { tool } from 'ai';
import { z } from 'zod';
import { productsService } from '@/backend/services/products/products.service';
import { ordersService } from '@/backend/services/orders/orders.service';
import { channelsService } from '@/backend/services/channels/channels.service';
import { CreateProductData, UpdateProductData } from '@/backend/services/products/products.types';
import { CreateOrderData, UpdateOrderData, CreateOrderItemData } from '@/backend/services/orders/orders.types';
import { orderStatusEnum } from '@/db/schema'; // For order status enum

// Helper to format service responses into a structured string .2
function formatObjectToString(obj: unknown, title: string): string {
  if (obj === null || obj === undefined) {
    return `${title}: Not found or no data.`;
  }
  if (typeof obj === 'object' && obj !== null && 'error' in obj) {
    return `${title} Error: ${(obj).error}`;
  }
  if (Array.isArray(obj)) {
    if (obj.length === 0) return `${title}: No items found.`;
    return `${title}:\n${obj.map((item, index) => `${index + 1}. ${formatObjectToString(item, '').replace(title + ':\n', '')}`).join('\n---\n')}`;
  }

  let result = title ? `${title}:\n` : '';
  const formatValue = (value: unknown, indentLevel = 1): string => {
    const indent = '  '.repeat(indentLevel);
    if (Array.isArray(value)) {
      if (value.length === 0) return '[]';
      return `[\n${value.map(v => `${indent}  ${formatValue(v, indentLevel + 1).trimStart()}`).join(',\n')}\n${indent}]`;
    } else if (typeof value === 'object' && value !== null) {
      let subResult = '{\n';
      const keys = Object.keys(value);
      if (keys.length === 0) return '{}';
      subResult += keys.map(k => `${indent}  "${k}": ${formatValue((value as Record<string, unknown>)[k], indentLevel + 1).trimStart()}`).join(',\n');
      subResult += `\n${indent}}`;
      return subResult;
    } else if (typeof value === 'string') {
      return `"${value}"`;
    }
    return String(value);
  };

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = (obj as Record<string, unknown>)[key];
      result += `  ${key}: ${formatValue(value).trimStart()}\n`;
    }
  }
  return result.trim();
}


// Helper to get userId from connectedPageID (channelId)
async function getUserIdFromChannel(channelId: string): Promise<string | null> {
  const channel = await channelsService.getChannelById(channelId);
  return channel?.userId || null;
}

// Define OrderItemSchema for AI tool parameters
const OrderItemSchemaForTool = z.object({
  productId: z.string().describe("ID of the product being ordered."),
  quantity: z.number().min(1).describe("Quantity of the product."),
  priceAtPurchase: z.string().describe("Price of the product at the time of purchase (e.g., \"29.99\")."),
  currencyAtPurchase: z.string().length(3).describe("Currency of the priceAtPurchase (e.g., \"USD\").")
});


export const getAITools = (customerId: string, connectedPageID: string) => {
  const tools = {
    // --- Product Tools ---
    getProductById: tool({
      description: 'Get detailed information about a specific product by its short ID. Ask the user for the Product Short ID.',
      parameters: z.object({
        shortId: z.string().describe('The short ID of the product to retrieve.'),
      }),
      execute: async ({ shortId }) => {
        const productsResult = await productsService.getAllProducts({
          filter: { shortId, channelId: connectedPageID },
          limit: 1,
          include: { user: false, connectedChannel: true }
        });

        const product = productsResult.data[0];
        if (!product || product.channelId !== connectedPageID) {
          return formatObjectToString({ error: 'Product not found or access denied for this channel.' }, 'Product Information');
        }
        return formatObjectToString(product, 'Product Information');
      },
    }),

    getProductByImageUrl: tool({
      description: 'Get product information by its image URL for the current channel. Ask the user for the Image URL.',
      parameters: z.object({
        imageUrl: z.string().url().describe('The URL of the product image to search for.'),
      }),
      execute: async ({ imageUrl }) => {
        // Fetching userId here is mainly for consistency if other tools need it,
        // but the primary filter for productsService will be channelId.

        const productsResult = await productsService.getAllProducts({
          filter: { channelId: connectedPageID, imageId: imageUrl }, // Filter primarily by current channelId and imageId
          limit: 1,
          include: { user: false, connectedChannel: true }
        });
        // Post-filter check for userId if necessary, though product service should handle this.
        if (!productsResult.data.length) {
          return formatObjectToString({ error: 'Product not found for this image URL in this channel or access denied.' }, 'Product Information');
        }
        return formatObjectToString(productsResult.data[0], 'Product Information');
      },
    }),

    createProduct: tool({
      description: `Create a new product, associating it with the current channel. Ask the user for the following details:
        - name (string, required): Name of the product.
        - description (string, optional): Detailed description.
        - price (string, required): Price of the product (e.g., "49.99").
        - currency (string, required, 3 letters): Currency code (e.g., "USD").
        - stock (number, optional): Available stock quantity.
        - isAvailable (boolean, optional, default: true): Is the product available for sale?
        - imageId (string, optional): ID or URL of the product image.
        - shortId (string, optional): A short identifier for the product.`,
      parameters: z.object({
        name: z.string().describe('Name of the product.'),
        description: z.string().optional().describe('Detailed description of the product.'),
        price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Price must be a valid number string, e.g., '29.99'.").describe('Price of the product (e.g., "49.99").'),
        currency: z.string().length(3).describe('Currency code (e.g., "USD").'),
        stock: z.number().int().min(0).optional().describe('Available stock quantity.'),
        isAvailable: z.boolean().optional().default(true).describe('Is the product available for sale?'),
        imageId: z.string().optional().describe('ID or URL of the product image.'),
        shortId: z.string().optional().describe('A short identifier for the product.'),
      }),
      execute: async (productParams) => {
        const userIdForProduct = await getUserIdFromChannel(connectedPageID);
        if (!userIdForProduct) return formatObjectToString({ error: 'Invalid channel context. Cannot create product.' }, 'Create Product Result');

        const productData: CreateProductData = {
          ...productParams,
          userId: userIdForProduct, // userId is required by DB schema
          channelId: connectedPageID,
          // Associate with the current channel
        };
        const newProduct = await productsService.createProduct(productData);
        return formatObjectToString(newProduct, 'Create Product Result');
      },
    }),

    updateProductInfo: tool({
      description: `Update an existing product associated with the current channel. Ask the user for the Product ID and the fields they want to update from the following:
        - name (string): New name of the product.
        - description (string): New detailed description.
        - price (string): New price (e.g., "49.99").
        - currency (string, 3 letters): New currency code (e.g., "USD").
        - stock (number): New stock quantity.
        - isAvailable (boolean): New availability status.
        - imageId (string): New ID or URL of the product image.
        - shortId (string): New short identifier.

        Note: This tool only updates products within the current channel context.Not all fields are required. Only provide the fields you want to update.`,
      parameters: z.object({
        productId: z.string().describe('The ID of the product to update.'),
        name: z.string().optional().describe('New name of the product.'),
        description: z.string().optional().describe('New detailed description.'),
        price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Price must be a valid number string, e.g., '29.99'.").optional().describe('New price (e.g., "49.99").'),
        currency: z.string().length(3).optional().describe('New currency code (e.g., "USD").'),
        stock: z.number().int().min(0).optional().describe('New stock quantity.'),
        isAvailable: z.boolean().optional().describe('New availability status.'),
        imageId: z.string().optional().describe('New ID or URL of the product image.'),
        shortId: z.string().optional().describe('New short identifier.'),
      }),
      execute: async ({ productId, ...updateData }) => {
        const product = await productsService.getProductById(productId);

        // Product must exist AND be associated with the current channel.
        if (!product || product.channelId !== connectedPageID) {
          // Secondary check for user integrity
          return formatObjectToString({ error: 'Product not found in this channel or permission denied.' }, 'Update Product Result');
        }

        const definedUpdateData = Object.fromEntries(Object.entries(updateData).filter(([_, v]) => v !== undefined)) as UpdateProductData;

        if (Object.keys(definedUpdateData).length === 0) {
          return formatObjectToString({ info: 'No update data provided.' }, 'Update Product Result');
        }
        // Ensure channelId is not accidentally changed by this tool if it's part of updateData
        if ('channelId' in definedUpdateData) {
          delete definedUpdateData.channelId;
        }

        const updatedProduct = await productsService.updateProduct(productId, definedUpdateData);
        return formatObjectToString(updatedProduct, 'Update Product Result');
      },
    }),

    // --- Order Tools ---
    getOrderById: tool({
      description: 'Get detailed information about a specific order by its ID for the current customer and channel. Ask the user for the Order ID.',
      parameters: z.object({
        orderId: z.string().describe('The unique ID of the order to retrieve.'),
      }),
      execute: async ({ orderId }) => {
        const userId = await getUserIdFromChannel(connectedPageID);
        if (!userId) return formatObjectToString({ error: 'User not found for this channel.' }, 'Order Information');

        const order = await ordersService.getOrderById(orderId, {
          include: { customer: true, connectedChannel: true, user: false, orderItems: { include: { product: true } } }
        });
        if (!order || order.customerId !== customerId || order.channelId !== connectedPageID || order.userId !== userId) {
          return formatObjectToString({ error: 'Order not found or access denied.' }, 'Order Information');
        }
        return formatObjectToString(order, 'Order Information');
      },
    }),

    createOrder: tool({
      description: `Create a new order for the current customer and channel. Ask the user for the following details:
        - orderItems (array of objects): Each object needs:
            - productId (string, required): ID of the product.
            - quantity (number, required, min 1): Quantity of the product.
            - priceAtPurchase (string, required): Price of one unit at purchase (e.g., "29.99").
            - currencyAtPurchase (string, required, 3 letters): Currency of priceAtPurchase (e.g., "USD").
        - totalAmount (string, required): Total amount for the order (e.g., "100.50").
        - currency (string, required, 3 letters): Currency code for the totalAmount (e.g., "USD").
        - orderStatus (optional, default 'PENDING'): Can be 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'CANCELLED'.
        - shippingAddress (string, optional): Full shipping address.
        - billingAddress (string, optional): Full billing address.`,
      parameters: z.object({
        orderItems: z.array(OrderItemSchemaForTool).min(1).describe('Array of items in the order.'),
        totalAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Total amount must be a valid number string.").describe('Total amount for the order (e.g., "100.50").'),
        currency: z.string().length(3).describe('Currency code for the order (e.g., "USD").'),
        orderStatus: z.enum(orderStatusEnum.enumValues).optional().default('PENDING').describe('Status of the order.'),
        shippingAddress: z.string().optional().describe('Shipping address for the order.'),
        billingAddress: z.string().optional().describe('Billing address for the order.'),
      }),
      execute: async (orderParams) => {
        const userId = await getUserIdFromChannel(connectedPageID);
        if (!userId) return formatObjectToString({ error: 'User not found. Cannot create order.' }, 'Create Order Result');

        const orderData: CreateOrderData = {
          ...orderParams,
          orderItems: orderParams.orderItems.map(item => ({ ...item }) as CreateOrderItemData), // Ensure type compatibility
          customerId,
          channelId: connectedPageID,
          userId,
        };
        const newOrder = await ordersService.createOrder(orderData);
        return formatObjectToString(newOrder, 'Create Order Result');
      },
    }),

    updateOrderInfo: tool({
      description: `Update an existing order for the current customer on this channel. Ask the user for the Order ID and the fields to update:
        - orderStatus: New status ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'CANCELLED').
        - shippingAddress (string): New shipping address.
        - billingAddress (string): New billing address.`,
      parameters: z.object({
        orderId: z.string().describe('The ID of the order to update.'),
        orderStatus: z.enum(orderStatusEnum.enumValues).optional().describe('New status of the order.'),
        shippingAddress: z.string().optional().describe('New shipping address.'),
        billingAddress: z.string().optional().describe('New billing address.'),
      }),
      execute: async ({ orderId, ...updateData }) => {
        const userId = await getUserIdFromChannel(connectedPageID);
        if (!userId) return formatObjectToString({ error: 'User not found.' }, 'Update Order Result');

        const order = await ordersService.getOrderById(orderId);
        if (!order || order.customerId !== customerId || order.channelId !== connectedPageID || order.userId !== userId) {
          return formatObjectToString({ error: 'Order not found or permission denied.' }, 'Update Order Result');
        }

        const definedUpdateData = Object.fromEntries(Object.entries(updateData).filter(([_, v]) => v !== undefined)) as UpdateOrderData;

        if (Object.keys(definedUpdateData).length === 0) {
          return formatObjectToString({ info: 'No update data provided.' }, 'Update Order Result');
        }

        const updatedOrder = await ordersService.updateOrder(orderId, definedUpdateData);
        return formatObjectToString(updatedOrder, 'Update Order Result');
      },
    }),
  };

  return tools;
};
