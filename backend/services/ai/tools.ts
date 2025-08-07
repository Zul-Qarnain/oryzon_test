import { tool } from "@langchain/core/tools";
import { z } from 'zod';
import { productsService } from '@/backend/services/products/products.service';
import { ordersService } from '@/backend/services/orders/orders.service';
// channelsService is imported but not used, consider removing if not needed elsewhere or for future use.
// import { channelsService } from '@/backend/services/channels/channels.service'; 
import { CreateProductData, UpdateProductData, ProductFilterOptions } from '@/backend/services/products/products.types'; // Added ProductFilterOptions
import { CreateOrderData, UpdateOrderData, CreateOrderItemData } from '@/backend/services/orders/orders.types';
import { orderStatusEnum } from '@/db/schema'; // For order status enum

// Helper to format service responses into a structured string .2
function formatObjectToString(obj: unknown, title: string): string {
  if (obj === null || obj === undefined) {
    return `${title}: Not found or no data.`;
  }
  if (typeof obj === 'object' && obj !== null && 'error' in obj) {
    // Ensure obj.error is a string or can be converted to one safely
    const errorVal = (obj as { error: unknown }).error;
    return `${title} Error: ${String(errorVal)}`;
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
      if(key == 'businessId') continue ;
      const value = (obj as Record<string, unknown>)[key];
      result += `  ${key == 'shortId' ? 'shortTag' : key}: ${formatValue(value).trimStart()}\n`;
    }
  }
  return result.trim();
}

// Define OrderItemSchema for AI tool parameters
const OrderItemSchemaForTool = z.object({
  productId: z.string().describe("ID of the product being ordered. IT IS DIFFERENT FROM shortId , IT IS THE ACTUAL ID OF PRODUCT IN DATABASE. You may find it in previous chat messages , may be the previous message contains product info which might have the id.If you dont have it,  find it by using other product getting tool like getProductByKeywords getProductByid etc. BUT NEVER ASK USER FOR IT. it is internal id in database."),
  quantity: z.number().min(1).describe("Quantity of the product."),
  priceAtPurchase: z.string().describe("Price of the product at the time of purchase (e.g., \"29.99\")."),
  currencyAtPurchase: z.string().length(3).describe("Currency of the priceAtPurchase (e.g., \"USD\").")
});

export const getAITools = (customerId: string, connectedPageID: string, businessId: string,address:string) => {
  // --- Schemas ---
  const getProductByIdSchema = z.object({
    shortId: z.string().describe('The short ID of the product to retrieve.'),
  });

  const calculatorSchema = z.object({
    expression: z.string().describe('The mathematical expression to evaluate (e.g., "2 + 3", "10 * 5", "20% of 50", "100 / 4")'),
  });

  const getProductByImageUrlSchema = z.object({
    imageUrl: z.string().describe('The URL of the product image to search for.'),
  });

  const createProductSchema = z.object({
    name: z.string().describe('Name of the product.'),
    description: z.string().optional().describe('Detailed description of the product.'),
    price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Price must be a valid number string, e.g., '29.99'.").describe('Price of the product (e.g., "49.99").'),
    currency: z.string().length(3).describe('Currency code (e.g., "USD").'),
    stock: z.number().int().min(0).optional().describe('Available stock quantity.'),
    isAvailable: z.boolean().optional().default(true).describe('Is the product available for sale?'),
    imageId: z.string().optional().describe('ID or URL of the product image.'),
    shortId: z.string().optional().describe('A short identifier for the product.'),
  });

  const updateProductInfoSchema = z.object({
    productId: z.string().describe('The ID of the product to update.'),
    name: z.string().optional().describe('New name of the product.'),
    description: z.string().optional().describe('New detailed description.'),
    price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Price must be a valid number string, e.g., '29.99'.").optional().describe('New price (e.g., "49.99").'),
    currency: z.string().length(3).optional().describe('New currency code (e.g., "USD").'),
    stock: z.number().int().min(0).optional().describe('New stock quantity.'),
    isAvailable: z.boolean().optional().describe('New availability status.'),
    imageId: z.string().optional().describe('New ID or URL of the product image.'),
    shortId: z.string().optional().describe('New short identifier.'),
  });

  const getOrderByIdSchema = z.object({
    orderId: z.string().describe('The unique ID of the order to retrieve.'),
  });

  const createOrderSchema = z.object({
    orderItems: z.array(OrderItemSchemaForTool).min(1).describe('Array of items in the order.'),
    totalAmount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Total amount must be a valid number string.").describe('Total amount for the order (e.g., "100.50").'),
    currency: z.string().length(3).describe('Currency code for the order (e.g., "USD").'),
    orderStatus: z.enum(orderStatusEnum.enumValues).optional().default('PENDING').describe('Status of the order.'),
    shippingAddress: z.string().optional().describe('Shipping address for the order.'),
    billingAddress: z.string().optional().describe('Billing address for the order.'),
  });

  const updateOrderInfoSchema = z.object({
    orderId: z.string().describe('The ID of the order to update.'),
    orderStatus: z.enum(orderStatusEnum.enumValues).optional().describe('New status of the order.'),
    shippingAddress: z.string().optional().describe('New shipping address.'),
    billingAddress: z.string().optional().describe('New billing address.'),
  });

  const getProductByKeywordSchema = z.object({
    keyword: z.string().describe('The keyword to search for in product names and descriptions.'),
    limit: z.number().int().min(1).max(50).optional().default(10).describe('Number of products to return.'),
    offset: z.number().int().min(0).optional().default(0).describe('Offset for pagination.'),
  });

  const getProductByKeywordWithMaxPriceSchema = z.object({
    keyword: z.string().describe('The keyword to search for in product names and descriptions.'),
    maxPrice: z.number().positive().describe('The maximum price for the products.'),
    limit: z.number().int().min(1).max(50).optional().default(10).describe('Number of products to return.'),
    offset: z.number().int().min(0).optional().default(0).describe('Offset for pagination.'),
  });

  const getProductByKeywordWithMinPriceSchema = z.object({
    keyword: z.string().describe('The keyword to search for in product names and descriptions.'),
    minPrice: z.number().nonnegative().describe('The minimum price for the products.'),
    limit: z.number().int().min(1).max(50).optional().default(10).describe('Number of products to return.'),
    offset: z.number().int().min(0).optional().default(0).describe('Offset for pagination.'),
  });

  // --- Tool Implementations ---
  const getProductByIdExecute = async ({ shortId }: z.infer<typeof getProductByIdSchema>) => {
    console.log(`getProductById is being called with params: ${JSON.stringify({ shortId })} and businessId: ${businessId}`);
    try {
      const productsResult = await productsService.getAllProducts({
        filter: { shortId:shortId, businessId:businessId },
        limit: 1,
        include: {}
      });
      console.log(`Products found: ${JSON.stringify(productsResult)}`);
      const product = productsResult.data[0];
      if (!product) {
        return formatObjectToString({ error: 'Product not found or access denied for this channel.' }, 'Product Information');
      }
      return formatObjectToString(product,"Product Info"); // Return product details as a formatted string
    } catch (error) {
      console.error(`Error fetching product by ID ${shortId}:`, error);
      return formatObjectToString({
        error: `Could not retrieve product: ${(error as Error).message}`
      }, 'Product Information');
    }
  };

  const calculatorExecute = async ({ expression }: z.infer<typeof calculatorSchema>) => {
    console.log(`calculator is being called with params: ${JSON.stringify({ expression })}`);
    try {
      const normalizedExpression = expression.toLowerCase().trim();
      if (normalizedExpression.includes('% of')) {
        const parts = normalizedExpression.split('% of');
        if (parts.length === 2) {
          const percentage = parseFloat(parts[0].trim());
          const value = parseFloat(parts[1].trim());
          if (!isNaN(percentage) && !isNaN(value)) {
            const result = (percentage / 100) * value;
            return formatObjectToString({ result }, 'Calculation Result');
          }
        }
      }
      const sanitizedExpression = normalizedExpression
        .replace(/[^0-9+\-*/.()\s]/g, '')
        .replace(/\s+/g, '');
      // Ensure sanitizedExpression is not empty to prevent errors with Function constructor
      if (!sanitizedExpression) {
        throw new Error('Invalid or empty expression after sanitization.');
      }
      const result = new Function(`return ${sanitizedExpression}`)();
      if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
        throw new Error('Invalid calculation result');
      }
      return formatObjectToString({ result }, 'Calculation Result');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown calculation error';
      return formatObjectToString({ 
        error: `Could not perform the calculation: ${errorMessage}. Please check your expression and try again.`
      }, 'Calculation Error');
    }
  };

  const getProductByImageUrlExecute = async ({ imageUrl }: z.infer<typeof getProductByImageUrlSchema>) => {
    console.log(`getProductByImageUrl is being called with params: ${JSON.stringify({ imageUrl })}`);
    const productsResult = await productsService.getAllProducts({
      filter: { businessId, imageId: imageUrl },
      limit: 1,
      include: {}
    });
    if (!productsResult.data.length) {
      return formatObjectToString({ error: 'Product not found for this image URL in this channel or access denied.' }, 'Product Information');
    }
    return formatObjectToString(productsResult.data[0], 'Product Information');
  };

  const createProductExecute = async (productParams: z.infer<typeof createProductSchema>) => {
    console.log(`createProduct is being called with params: ${JSON.stringify(productParams)}`);
    const productData: CreateProductData = {
      ...productParams,
      businessId,
    };
    const newProduct = await productsService.createProduct(productData);
    return formatObjectToString(newProduct, 'Create Product Result');
  };

  const updateProductInfoExecute = async ({ productId, ...updateData }: z.infer<typeof updateProductInfoSchema>) => {
    console.log(`updateProductInfo is being called with params: ${JSON.stringify({ productId, ...updateData })}`);
    const product = await productsService.getProductById(productId);
    if (!product) {
      return formatObjectToString({ error: 'Product not found in this channel or permission denied.' }, 'Update Product Result');
    }
    const definedUpdateData = Object.fromEntries(Object.entries(updateData).filter(([_, v]) => v !== undefined)) as UpdateProductData;
    if (Object.keys(definedUpdateData).length === 0) {
      return formatObjectToString({ info: 'No update data provided.' }, 'Update Product Result');
    }
    if ('channelId' in definedUpdateData) {
      delete definedUpdateData.channelId;
    }
    const updatedProduct = await productsService.updateProduct(productId, definedUpdateData);
    return formatObjectToString(updatedProduct, 'Update Product Result');
  };

  const getOrderByIdExecute = async ({ orderId }: z.infer<typeof getOrderByIdSchema>) => {
    console.log(`getOrderById is being called with params: ${JSON.stringify({ orderId })}`);
    const order = await ordersService.getOrderById(orderId, {
      include: { customer: true, connectedChannel: true, orderItems: { include: { product: true } } }
    });
    if (!order || order.customerId !== customerId || order.channelId !== connectedPageID) {
      return formatObjectToString({ error: 'Order not found or access denied.' }, 'Order Information');
    }
    return formatObjectToString(order, 'Order Information');
  };

  const createOrderExecute = async (orderParams: z.infer<typeof createOrderSchema>) => {
    console.log(`createOrder is being called with params: ${JSON.stringify(orderParams)}`);
    const orderData: CreateOrderData = {
      ...orderParams,
      orderItems: orderParams.orderItems.map(item => ({ ...item }) as CreateOrderItemData),
      customerId,
      channelId: connectedPageID,
      businessId,
      shippingAddress: orderParams.shippingAddress || address, // Use the provided address or fallback to the default address
    };
    const newOrder = await ordersService.createOrder(orderData);
    let result = "Create Order Result: \n"
    result += `Order ID: ${newOrder?.orderId}\n`
    result += `Order Status: ${newOrder?.orderStatus}\n`
    for (const item of newOrder?.orderItems || []) {
      result += `Product Name: ${item.product?.name}\n`
      result += `Quantity: ${item.quantity}\n`
      result += `Price: ${item.priceAtPurchase}\n`
    }
    result += `Total Amount: ${newOrder?.totalAmount}\n`
    result += `Shipping Address: ${newOrder?.shippingAddress}\n`
    return result;
  };

  const updateOrderInfoExecute = async ({ orderId, ...updateData }: z.infer<typeof updateOrderInfoSchema>) => {
    console.log(`updateOrderInfo is being called with params: ${JSON.stringify({ orderId, ...updateData })}`);
    const order = await ordersService.getOrderById(orderId);
    if (!order || order.customerId !== customerId || order.channelId !== connectedPageID) {
      return formatObjectToString({ error: 'Order not found or permission denied.' }, 'Update Order Result');
    }
    const definedUpdateData = Object.fromEntries(Object.entries(updateData).filter(([_, v]) => v !== undefined)) as UpdateOrderData;
    if (Object.keys(definedUpdateData).length === 0) {
      return formatObjectToString({ info: 'No update data provided.' }, 'Update Order Result');
    }
    const updatedOrder = await ordersService.updateOrder(orderId, definedUpdateData);
    return formatObjectToString(updatedOrder, 'Update Order Result');
  };

  const getProductByKeywordExecute = async ({ keyword, limit, offset }: z.infer<typeof getProductByKeywordSchema>) => {
    console.log(`getProductByKeyword is being called with params: ${JSON.stringify({ keyword, limit, offset })} and businessId: ${businessId}`);
    try {
      const productsResult = await productsService.getProductByKeyword(keyword, {
        filter: { businessId: businessId }, // Ensure search is scoped to the current business
        limit: limit,
        offset: offset,
        include: {} // Add includes if necessary, e.g., { business: true }
      });
      console.log(`Products found by keyword '${keyword}': ${JSON.stringify(productsResult)}`);
      if (!productsResult.data || productsResult.data.length === 0) {
        return formatObjectToString({ info: 'No products found matching the keyword for this business.' }, 'Product Search Result');
      }
      // Return product details as a formatted string or JSON string
      return formatObjectToString(productsResult.data[0],"Product Info")
    } catch (error) {
      console.error(`Error fetching products by keyword '${keyword}':`, error);
      return formatObjectToString({
        error: `Could not retrieve products by keyword: ${(error as Error).message}`
      }, 'Product Search Error');
    }
  };

  const getProductByKeywordWithMaxPriceExecute = async ({ keyword, maxPrice, limit, offset }: z.infer<typeof getProductByKeywordWithMaxPriceSchema>) => {
    console.log(`getProductByKeywordWithMaxPrice is being called with params: ${JSON.stringify({ keyword, maxPrice, limit, offset })} and businessId: ${businessId}`);
    try {
      const filterOptions: ProductFilterOptions = { businessId: businessId, maxPrice: maxPrice };
      const productsResult = await productsService.getProductByKeyword(keyword, {
        filter: filterOptions,
        limit: limit,
        offset: offset,
        include: {} 
      });
      console.log(`Products found by keyword '${keyword}' with max price ${maxPrice}: ${JSON.stringify(productsResult)}`);
      if (!productsResult.data || productsResult.data.length === 0) {
        return formatObjectToString({ info: `No products found matching the keyword '${keyword}' with a maximum price of ${maxPrice} for this business.` }, 'Product Search Result');
      }
      return JSON.stringify(productsResult, null, 2);
    } catch (error) {
      console.error(`Error fetching products by keyword '${keyword}' with max price ${maxPrice}:`, error);
      return formatObjectToString({
        error: `Could not retrieve products by keyword with max price: ${(error as Error).message}`
      }, 'Product Search Error');
    }
  };

  const getProductByKeywordWithMinPriceExecute = async ({ keyword, minPrice, limit, offset }: z.infer<typeof getProductByKeywordWithMinPriceSchema>) => {
    console.log(`getProductByKeywordWithMinPrice is being called with params: ${JSON.stringify({ keyword, minPrice, limit, offset })} and businessId: ${businessId}`);
    try {
      const filterOptions: ProductFilterOptions = { businessId: businessId, minPrice: minPrice };
      const productsResult = await productsService.getProductByKeyword(keyword, {
        filter: filterOptions,
        limit: limit,
        offset: offset,
        include: {}
      });
      console.log(`Products found by keyword '${keyword}' with min price ${minPrice}: ${JSON.stringify(productsResult)}`);
      if (!productsResult.data || productsResult.data.length === 0) {
        return formatObjectToString({ info: `No products found matching the keyword '${keyword}' with a minimum price of ${minPrice} for this business.` }, 'Product Search Result');
      }
      return JSON.stringify(productsResult, null, 2);
    } catch (error) {
      console.error(`Error fetching products by keyword '${keyword}' with min price ${minPrice}:`, error);
      return formatObjectToString({
        error: `Could not retrieve products by keyword with min price: ${(error as Error).message}`
      }, 'Product Search Error');
    }
  };

  // --- Tools Definition ---
  const tools = {
    getProductById: tool(getProductByIdExecute, {
      name: 'getProductById',
      description: 'Get detailed information about a specific product by its short ID. Ask the user for the Product Short ID.',
      schema: getProductByIdSchema,
    }),

    calculator: tool(calculatorExecute, {
      name: 'calculator',
      description: 'Perform basic mathematical calculations. You can add, subtract, multiply, divide, or calculate percentages.',
      schema: calculatorSchema,
    }),

    getProductByImageUrl: tool(getProductByImageUrlExecute, {
      name: 'getProductByImageUrl',
      description: 'Get product information by its image URL for the current channel. Ask the user for the Image URL.',
      schema: getProductByImageUrlSchema,
    }),

    createProduct: tool(createProductExecute, {
      name: 'createProduct',
      description: `Create a new product, associating it with the current channel. Ask the user for the following details:
        - name (string, required): Name of the product.
        - description (string, optional): Detailed description.
        - price (string, required): Price of the product (e.g., "49.99").
        - currency (string, required, 3 letters): Currency code (e.g., "USD").
        - stock (number, optional): Available stock quantity.
        - isAvailable (boolean, optional, default: true): Is the product available for sale?
        - imageId (string, optional): ID or URL of the product image.
        - shortId (string, optional): A short identifier for the product.`,
      schema: createProductSchema,
    }),

    updateProductInfo: tool(updateProductInfoExecute, {
      name: 'updateProductInfo',
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
      schema: updateProductInfoSchema,
    }),

    getOrderById: tool(getOrderByIdExecute, {
      name: 'getOrderById',
      description: 'Get detailed information about a specific order by its ID for the current customer and channel. Ask the user for the Order ID.',
      schema: getOrderByIdSchema,
    }),

    createOrder: tool(createOrderExecute, {
      name: 'createOrder',
      description: `Create a new order for the current customer and channel. You need the following details to make an order. If you don't have those details, then make a product search with id or keyward which you might get from previous chat messages. Then use those information to fill the order details.
        - orderItems (array of objects): Each object needs:
            - productId (string, required): ID of the product.
            - quantity (number, required, min 1): Quantity of the product.Ask the user for the quantity. Be carefull it should not cross the available stock.
            - priceAtPurchase (string, required): Price of one unit at purchase (e.g., "29.99").You need to find from prevous chat where you might told the user or make product search to get the price.
            - currencyAtPurchase (string, required, 3 letters): Currency of priceAtPurchase (e.g., "USD").Default is BDT. But always ask the user if they want to use a different currency.
        - totalAmount (string, required): Total amount for the order (e.g., "100.50").
        - currency (string, required, 3 letters): Currency code for the totalAmount (e.g., "USD").
        - orderStatus (optional, default 'PENDING'): Can be 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'CANCELLED'.
        - shippingAddress (string): ${ address == "" ? 'You must ask for the shipping address to the user. It is mendatory to create the order' : 'User already provided the shipping address in past. The address is ' + address + ' . Show this address to user and politly ask if he wants to change it? If not go with it or if he provide use the updated one' }`,
      schema: createOrderSchema,
    }),

    updateOrderInfo: tool(updateOrderInfoExecute, {
      name: 'updateOrderInfo',
      description: `Update an existing order for the current customer on this channel. Ask the user for the Order ID or you may find in previous chats and the fields to update:
        - orderStatus: New status ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'CANCELLED').
        - shippingAddress (string): New shipping address.`,
      schema: updateOrderInfoSchema,
    }),

    getProductByKeyword: tool(getProductByKeywordExecute, {
      name: 'getProductByKeyword',
      description: 'Search for products by a keyword in their name and description for the current business. Ask the user for the keyword. Optionally, specify limit and offset for pagination. Must include product id in the reply.',
      schema: getProductByKeywordSchema,
    }),

    getProductByKeywordWithMaxPrice: tool(getProductByKeywordWithMaxPriceExecute, {
      name: 'getProductByKeywordWithMaxPrice',
      description: 'Search for products by keyword with a maximum price. Ask the user for the keyword and the maximum price. Optionally, specify limit and offset.',
      schema: getProductByKeywordWithMaxPriceSchema,
    }),

    replyUser: tool(({msg} ) => { console.log(msg)}, {
      name: 'replyUser',
      description:'reply to user using msg',
      schema:z.object({
    msg: z.string().describe('The message to reply')
      }),
    }),

    getProductByKeywordWithMinPrice: tool(getProductByKeywordWithMinPriceExecute, {
      name: 'getProductByKeywordWithMinPrice',
      description: 'Search for products by keyword with a minimum price. Ask the user for the keyword and the minimum price. Optionally, specify limit and offset.',
      schema: getProductByKeywordWithMinPriceSchema,
    }),
  };

  return tools;
};
