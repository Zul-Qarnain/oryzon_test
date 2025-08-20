# Backend API Endpoints Reference

This document lists all backend API endpoints, their query parameters, and possible result types (success and error) for your project.  
**All error responses include the HTTP status code and a descriptive message.**  
**All entity return types are expanded to show their fields as defined in db/schema.ts.**

---

## Users

### User Object
```json
{
  "userId": "string",
  "name": "string",
  "phone": "string | null",
  "email": "string | null",
  "passwordHash": "string | null",
  "loginProvider": "EMAIL | GOOGLE | FACEBOOK | LINKEDIN | TWITTER | INSTAGRAM | null",
  "providerUserId": "string | null",
  "createdAt": "string (ISO date)",
  "updatedAt": "string (ISO date)"
}
```

### GET `/api/users`
- **Query Parameters:**
  - `include`: Comma-separated list (`businesses`)
  - `limit`, `offset`: Pagination
  - `email`, `loginProvider`, `providerUserId`, `name`, `phone`: Filtering
- **Success Response:**  
  - Status: 200  
  `{ "data": [UserWithIncludes], "total": number }`
- **UserWithIncludes:**  
  ```json
  {
    ...User,
    "businesses"?: [Business]
  }
  ```
- **Error Response:**  
  - Status: 400
    `{ "message": "User identifier (userId or providerUserId) is required for listing businesses" }` (if no filters are provided and it's restricted)
  - Status: 500  
  `{ "message": "Internal server error", "error": "details" }`

### POST `/api/users`
- **Body:**
  ```json
  {
    "name": "string",
    "phone": "string | null",
    "email": "string | null",
    "passwordHash": "string | null",
    "loginProvider": "EMAIL | GOOGLE | FACEBOOK | LINKEDIN | TWITTER | INSTAGRAM | null",
    "providerUserId": "string | null"
  }
  ```
- **Success Response:**  
  - Status: 201  
  User
- **Error Response:**  
  - Status: 400
    `{ "message": "Name and either Email or Provider User ID are required." }`
  - Status: 409
    `{ "message": "User with this email or provider ID already exists.", "error": "details" }`
  - Status: 500  
  `{ "message": "Internal server error", "error": "details" }`

### GET `/api/users/[userId]`
- **Query Parameters:**  
  - `include`: Comma-separated list (`businesses`)
- **Success Response:**  
  - Status: 200  
  UserWithIncludes
- **Error Response:**  
  - Status: 400  
    `{ "message": "User ID is required" }`  
  - Status: 404  
    `{ "message": "User not found" }`  
  - Status: 500  
    `{ "message": "Internal server error", "error": "details" }`

### PUT `/api/users/[userId]`
- **Body:** Partial User (excluding `userId`, `createdAt`, `updatedAt`, `providerUserId`)
  ```json
  {
    "name"?: "string",
    "phone"?: "string | null",
    "email"?: "string | null",
    "passwordHash"?: "string | null",
    "loginProvider"?: "EMAIL | GOOGLE | FACEBOOK | LINKEDIN | TWITTER | INSTAGRAM | null"
  }
  ```
- **Success Response:**  
  - Status: 200  
  User
- **Error Response:**  
  - Status: 400  
    `{ "message": "User ID is required" }`  
  - Status: 404  
    `{ "message": "User not found" }`  
  - Status: 500  
    `{ "message": "Internal server error", "error": "details" }`

### DELETE `/api/users/[userId]`
- **Success Response:**  
  - Status: 204  
  `null`
- **Error Response:**  
  - Status: 400  
    `{ "message": "User ID is required" }`  
  - Status: 404  
    `{ "message": "User not found" }`  
  - Status: 500  
    `{ "message": "Internal server error", "error": "details" }`

---

## Businesses

### Business Object
```json
{
  "businessId": "string",
  "userId": "string",
  "providerUserId": "string | null",
  "name": "string",
  "description": "string | null",
  "createdAt": "string (ISO date)",
  "updatedAt": "string (ISO date)"
}
```

### GET `/api/businesses`
- **Query Parameters:**
  - `include`: Comma-separated list (`user`, `userViaProviderId`, `connectedChannels`, `products`, `customers`, `orders`)
  - `limit`, `offset`: Pagination
  - `userId`, `providerUserId`, `name`: Filtering
- **Success Response:**  
  - Status: 200  
  `{ "data": [BusinessWithIncludes], "total": number }`
- **BusinessWithIncludes:**  
  ```json
  {
    ...Business,
    "user"?: User,
    "userViaProviderId"?: User,
    "connectedChannels"?: [ConnectedChannel],
    "products"?: [Product],
    "customers"?: [Customer],
    "orders"?: [Order]
  }
  ```
- **Error Response:**  
  - Status: 400
    `{ "message": "User identifier (userId or providerUserId) is required for listing businesses" }`
  - Status: 500  
  `{ "message": "Internal server error", "error": "details" }`

### POST `/api/businesses`
- **Body:**
  ```json
  {
    "userId": "string",
    "providerUserId"?: "string | null",
    "name": "string",
    "description"?: "string | null"
  }
  ```
- **Success Response:**  
  - Status: 201  
  Business
- **Error Response:**  
  - Status: 400
    `{ "message": "User ID and business name are required" }`
  - Status: 500  
  `{ "message": "Internal server error", "error": "details" }`

### GET `/api/businesses/[businessId]`
- **Query Parameters:**  
  - `include`: Comma-separated list (`user`, `userViaProviderId`, `connectedChannels`, `products`, `customers`, `orders`)
- **Success Response:**  
  - Status: 200  
  BusinessWithIncludes
- **Error Response:**  
  - Status: 400  
    `{ "message": "Business ID is required" }`  
  - Status: 404  
    `{ "message": "Business not found" }`  
  - Status: 500  
    `{ "message": "Internal server error", "error": "details" }`

### PUT `/api/businesses/[businessId]`
- **Body:** Partial Business (excluding `businessId`, `userId`, `providerUserId`, `createdAt`, `updatedAt`)
  ```json
  {
    "name"?: "string",
    "description"?: "string | null"
  }
  ```
- **Success Response:**  
  - Status: 200  
  Business
- **Error Response:**  
  - Status: 400  
    `{ "message": "Business ID is required" }`  
  - Status: 404  
    `{ "message": "Business not found or update failed" }`  
  - Status: 500  
    `{ "message": "Internal server error", "error": "details" }`

### DELETE `/api/businesses/[businessId]`
- **Success Response:**  
  - Status: 204  
  `null`
- **Error Response:**  
  - Status: 400  
    `{ "message": "Business ID is required" }`  
  - Status: 404  
    `{ "message": "Business not found or could not be deleted" }`  
  - Status: 500  
    `{ "message": "Internal server error", "error": "details" }`

---

## ConnectedChannels

### ConnectedChannel Object
```json
{
  "channelId": "string",
  "businessId": "string",
  "providerUserId": "string | null",
  "platformType": "FACEBOOK_PAGE | INSTAGRAM_BUSINESS | LINKEDIN_PAGE | TWITTER_PROFILE",
  "platformSpecificId": "string",
  "description": "string | null",
  "channelName": "string | null",
  "accessToken": "string | null",
  "refreshToken": "string | null",
  "tokenExpiresAt": "string | null (ISO date)",
  "isActive": "boolean",
  "createdAt": "string (ISO date)",
  "updatedAt": "string (ISO date)"
}
```

### GET `/api/channels`
- **Query Parameters:**
  - `include`: Comma-separated list (`business,userViaProviderId,customers,orders,chats`)
  - `limit`, `offset`: Pagination
  - `businessId`, `providerUserId`, `platformType`, `isActive`, `channelName`, `platformSpecificId`, `description`: Filtering
- **Success Response:**  
  - Status: 200  
  `{ "data": [ConnectedChannelWithIncludes], "total": number }`
- **ConnectedChannelWithIncludes:**  
  ```json
  {
    ...ConnectedChannel,
    "business"?: Business,
    "userViaProviderId"?: User,
    "customers"?: [Customer],
    "orders"?: [Order],
    "chats"?: [Chat]
  }
  ```
- **Error Response:**  
  - Status: 500  
  `{ "message": "Internal server error", "error": "details" }`

### POST `/api/channels`
- **Body:**
  ```json
  {
    "businessId": "string",
    "providerUserId"?: "string | null",
    "platformType": "FACEBOOK_PAGE | INSTAGRAM_BUSINESS | LINKEDIN_PAGE | TWITTER_PROFILE",
    "platformSpecificId": "string",
    "description"?: "string | null",
    "channelName"?: "string | null",
    "accessToken"?: "string | null",
    "refreshToken"?: "string | null",
    "tokenExpiresAt"?: "string | null (ISO date)",
    "isActive"?: "boolean"
  }
  ```
- **Success Response:**  
  - Status: 201  
  ConnectedChannel
- **Error Response:**  
  - Status: 400
    `{ "message": "businessId, platformType, and platformSpecificId are required" }`
  - Status: 500  
  `{ "message": "Internal server error", "error": "details" }`

### GET `/api/channels/[channelId]`
- **Query Parameters:**  
  - `include`: Comma-separated list (`business,userViaProviderId,customers,orders,chats`)
- **Success Response:**  
  - Status: 200  
  ConnectedChannelWithIncludes
- **Error Response:**  
  - Status: 400  
    `{ "message": "Channel ID is required" }`  
  - Status: 404  
    `{ "message": "Channel not found" }`  
  - Status: 500  
    `{ "message": "Internal server error", "error": "details" }`

### PUT `/api/channels/[channelId]`
- **Body:** Partial ConnectedChannel (excluding `channelId`, `businessId`, `createdAt`, `updatedAt`)
  ```json
  {
    "providerUserId"?: "string | null",
    "platformType"?: "FACEBOOK_PAGE | INSTAGRAM_BUSINESS | LINKEDIN_PAGE | TWITTER_PROFILE",
    "platformSpecificId"?: "string",
    "description"?: "string | null",
    "channelName"?: "string | null",
    "accessToken"?: "string | null",
    "refreshToken"?: "string | null",
    "tokenExpiresAt"?: "string | null (ISO date)",
    "isActive"?: "boolean"
  }
  ```
- **Success Response:**  
  - Status: 200  
  ConnectedChannel
- **Error Response:**  
  - Status: 400  
    `{ "message": "Channel ID is required" }`  
  - Status: 404  
    `{ "message": "Channel not found" }`  
  - Status: 500  
    `{ "message": "Internal server error", "error": "details" }`

### DELETE `/api/channels/[channelId]`
- **Success Response:**  
  - Status: 204  
  `null`
- **Error Response:**  
  - Status: 400  
    `{ "message": "Channel ID is required" }`  
  - Status: 404  
    `{ "message": "Channel not found" }`  
  - Status: 500  
    `{ "message": "Internal server error", "error": "details" }`

---

## Customers

### Customer Object
```json
{
  "customerId": "string",
  "businessId": "string",
  "providerUserId": "string | null",
  "channelId": "string",
  "platformCustomerId": "string",
  "fullName": "string | null",
  "address": "string",
  "profilePictureUrl": "string | null",
  "firstSeenAt": "string (ISO date)",
  "lastSeenAt": "string (ISO date)"
}
```

### GET `/api/customers`
- **Query Parameters:**
  - `include`: Comma-separated list (`business,userViaProviderId,connectedChannel,orders,chats`)
  - `limit`, `offset`: Pagination
  - `businessId`, `providerUserId`, `channelId`, `platformCustomerId`, `fullName`, `address`: Filtering
- **Success Response:**  
  - Status: 200  
  `{ "data": [CustomerWithIncludes], "total": number }`
- **CustomerWithIncludes:**  
  ```json
  {
    ...Customer,
    "business"?: Business,
    "userViaProviderId"?: User,
    "connectedChannel"?: ConnectedChannel,
    "orders"?: [Order],
    "chats"?: [Chat]
  }
  ```
- **Error Response:**  
  - Status: 500  
  `{ "message": "Internal server error", "error": "details" }`

### POST `/api/customers`
- **Body:**
  ```json
  {
    "businessId": "string",
    "providerUserId"?: "string | null",
    "channelId": "string",
    "platformCustomerId": "string",
    "fullName"?: "string | null",
    "address"?: "string",
    "profilePictureUrl"?: "string | null"
  }
  ```
- **Success Response:**  
  - Status: 201  
  Customer
- **Error Response:**  
  - Status: 400
    `{ "message": "businessId, channelId, and platformCustomerId are required" }`
  - Status: 500  
  `{ "message": "Internal server error", "error": "details" }`

### GET `/api/customers/[customerId]`
- **Query Parameters:**  
  - `include`: Comma-separated list (`business,userViaProviderId,connectedChannel,orders,chats`)
- **Success Response:**  
  - Status: 200  
  CustomerWithIncludes
- **Error Response:**  
  - Status: 400  
    `{ "message": "Customer ID is required" }`  
  - Status: 404  
    `{ "message": "Customer not found" }`  
  - Status: 500  
    `{ "message": "Internal server error", "error": "details" }`

### PUT `/api/customers/[customerId]`
- **Body:** Partial Customer (excluding `customerId`, `businessId`, `channelId`, `firstSeenAt`, `lastSeenAt`)
  ```json
  {
    "providerUserId"?: "string | null",
    "platformCustomerId"?: "string",
    "fullName"?: "string | null",
    "address"?: "string",
    "profilePictureUrl"?: "string | null"
  }
  ```
- **Success Response:**  
  - Status: 200  
  Customer
- **Error Response:**  
  - Status: 400  
    `{ "message": "Customer ID is required" }`  
  - Status: 404  
    `{ "message": "Customer not found" }`  
  - Status: 500  
    `{ "message": "Internal server error", "error": "details" }`

### DELETE `/api/customers/[customerId]`
- **Success Response:**  
  - Status: 204  
  `null`
- **Error Response:**  
  - Status: 400  
    `{ "message": "Customer ID is required" }`  
  - Status: 404  
    `{ "message": "Customer not found" }`  
  - Status: 500  
    `{ "message": "Internal server error", "error": "details" }`

---

## Products

### Product Object
```json
{
  "productId": "string",
  "businessId": "string",
  "providerUserId": "string | null",
  "name": "string",
  "description": "string | null",
  "price": "string",
  "currency": "string",
  "sku": "string | null",
  "imageUrl": "string | null",
  "imageId": "string | null",
  "shortId": "string | null",
  "isAvailable": "boolean",
  "createdAt": "string (ISO date)",
  "updatedAt": "string (ISO date)"
}
```

### GET `/api/products`
- **Query Parameters:**
  - `include`: Comma-separated list (`business,userViaProviderId,orderItems`)
  - `limit`, `offset`: Pagination
  - `name`, `currency`, `isAvailable`, `businessId`, `providerUserId`, `imageId`, `shortId`: Filtering
- **Success Response:**  
  - Status: 200  
  `{ "data": [ProductWithIncludes], "total": number }`
- **ProductWithIncludes:**  
  ```json
  {
    ...Product,
    "business"?: Business,
    "userViaProviderId"?: User,
    "orderItems"?: [OrderItemWithProduct]
  }
  ```
- **OrderItemWithProduct:**  
  ```json
  {
    "orderItemId": "string",
    "orderId": "string",
    "productId": "string",
    "quantity": "number",
    "priceAtPurchase": "string",
    "currencyAtPurchase": "string",
    "product"?: Product
  }
  ```
- **Error Response:**  
  - Status: 500  
  `{ "message": "Internal server error", "error": "details" }`

### POST `/api/products`
- **Body:**
  ```json
  {
    "businessId": "string",
    "providerUserId"?: "string | null",
    "name": "string",
    "description"?: "string | null",
    "price": "string",
    "currency": "string",
    "sku"?: "string | null",
    "imageUrl"?: "string | null",
    "imageId"?: "string | null",
    "shortId"?: "string | null",
    "isAvailable"?: "boolean"
  }
  ```
- **Success Response:**  
  - Status: 201  
  Product
- **Error Response:**  
  - Status: 400
    `{ "message": "businessId, name, price, and currency are required" }`
  - Status: 500  
  `{ "message": "Internal server error", "error": "details" }`

### GET `/api/products/[productId]`
- **Query Parameters:**  
  - `include`: Comma-separated list (`business,userViaProviderId,orderItems`)
- **Success Response:**  
  - Status: 200  
  ProductWithIncludes
- **Error Response:**  
  - Status: 400  
    `{ "message": "Product ID is required" }`  
  - Status: 404  
    `{ "message": "Product not found" }`  
  - Status: 500  
    `{ "message": "Internal server error", "error": "details" }`

### PUT `/api/products/[productId]`
- **Body:** Partial Product (excluding `productId`, `businessId`, `createdAt`, `updatedAt`)
  ```json
  {
    "providerUserId"?: "string | null",
    "name"?: "string",
    "description"?: "string | null",
    "price"?: "string",
    "currency"?: "string",
    "sku"?: "string | null",
    "imageUrl"?: "string | null",
    "imageId"?: "string | null",
    "shortId"?: "string | null",
    "isAvailable"?: "boolean"
  }
  ```
- **Success Response:**  
  - Status: 200  
  Product
- **Error Response:**  
  - Status: 400  
    `{ "message": "Product ID is required" }`  
  - Status: 404  
    `{ "message": "Product not found" }`  
  - Status: 500  
    `{ "message": "Internal server error", "error": "details" }`

### DELETE `/api/products/[productId]`
- **Success Response:**  
  - Status: 204  
  `null`
- **Error Response:**  
  - Status: 400  
    `{ "message": "Product ID is required" }`  
  - Status: 404  
    `{ "message": "Product not found" }`  
  - Status: 500  
    `{ "message": "Internal server error", "error": "details" }`

---

## Orders

### Order Object
```json
{
  "orderId": "string",
  "businessId": "string",
  "providerUserId": "string | null",
  "customerId": "string",
  "channelId": "string | null",
  "orderStatus": "PENDING | CONFIRMED | PROCESSING | SHIPPED | CANCELLED",
  "totalAmount": "string",
  "currency": "string",
  "shippingAddress": "string",
  "createdAt": "string (ISO date)",
  "updatedAt": "string (ISO date)"
}
```

### GET `/api/orders`
- **Query Parameters:**
  - `include`: Comma-separated list (`business,userViaProviderId,customer,connectedChannel,orderItems`)
  - `limit`, `offset`: Pagination
  - `businessId`, `providerUserId`, `customerId`, `channelId`, `orderStatus`, `currency`: Filtering
- **Success Response:**  
  - Status: 200  
  `{ "data": [OrderWithIncludes], "total": number }`
- **OrderWithIncludes:**  
  ```json
  {
    ...Order,
    "business"?: Business,
    "userViaProviderId"?: User,
    "customer"?: Customer,
    "connectedChannel"?: ConnectedChannel | null,
    "orderItems"?: [OrderItemWithProduct]
  }
  ```
- **OrderItemWithProduct:**  
  ```json
  {
    "orderItemId": "string",
    "orderId": "string",
    "productId": "string",
    "quantity": "number",
    "priceAtPurchase": "string",
    "currencyAtPurchase": "string",
    "product"?: Product
  }
  ```
- **Error Response:**  
  - Status: 500  
  `{ "message": "Internal server error", "error": "details" }`

### POST `/api/orders`
- **Body:**
  ```json
  {
    "businessId": "string",
    "providerUserId"?: "string | null",
    "customerId": "string",
    "channelId": "string | null",
    "orderStatus"?: "PENDING | CONFIRMED | PROCESSING | SHIPPED | CANCELLED",
    "totalAmount": "string",
    "currency": "string",
    "shippingAddress": "string",
    "orderItems": [
      {
        "productId": "string",
        "quantity": "number",
        "priceAtPurchase": "string",
        "currencyAtPurchase": "string"
      }
    ]
  }
  ```
- **Success Response:**  
  - Status: 201  
  Order
- **Error Response:**  
  - Status: 400
    `{ "message": "businessId, customerId, channelId, totalAmount, currency, and at least one orderItem are required" }`
  - Status: 500  
    `{ "message": "Failed to create order" }` (if transaction fails)
  - Status: 500  
  `{ "message": "Internal server error", "error": "details" }`

### GET `/api/orders/[orderId]`
- **Query Parameters:**  
  - `include`: Comma-separated list (`business,userViaProviderId,customer,connectedChannel,orderItems`)
- **Success Response:**  
  - Status: 200  
  OrderWithIncludes
- **Error Response:**  
  - Status: 400  
    `{ "message": "Order ID is required" }`  
  - Status: 404  
    `{ "message": "Order not found" }`  
  - Status: 500  
    `{ "message": "Internal server error", "error": "details" }`

### PUT `/api/orders/[orderId]`
- **Body:** Partial Order (excluding `orderId`, `businessId`, `customerId`, `channelId`, `createdAt`, `updatedAt`)
  ```json
  {
    "orderStatus"?: "PENDING | CONFIRMED | PROCESSING | SHIPPED | CANCELLED",
    "shippingAddress"?: "string",
    "providerUserId"?: "string | null"
  }
  ```
- **Success Response:**  
  - Status: 200  
  Order
- **Error Response:**  
  - Status: 400  
    `{ "message": "Order ID is required" }`  
  - Status: 404  
    `{ "message": "Order not found" }`  
  - Status: 500  
    `{ "message": "Internal server error", "error": "details" }`

### DELETE `/api/orders/[orderId]`
- **Success Response:**  
  - Status: 204  
  `null`
- **Error Response:**  
  - Status: 400  
    `{ "message": "Order ID is required" }`  
  - Status: 404  
    `{ "message": "Order not found" }`  
  - Status: 500  
    `{ "message": "Internal server error", "error": "details" }`

---

## Chats

### Chat Object
```json
{
  "chatId": "string",
  "businessId": "string",
  "platformCustomerId": "string",
  "channelId": "string",
  "providerUserId": "string | null",
  "startedAt": "string (ISO date)",
  "lastMessageAt": "string (ISO date)",
  "status": "OPEN | CLOSED_BY_BOT | CLOSED_BY_AGENT | ARCHIVED",
  "chatType": "real | test"
}
```

### GET `/api/chats`
- **Query Parameters:**
  - `include`: Comma-separated list (`business,userViaProviderId,customer,connectedChannel,messages`)
  - `limit`, `offset`: Pagination
  - `businessId`, `providerUserId`, `platformCustomerId`, `channelId`, `status`, `chatType`: Filtering
- **Success Response:**  
  - Status: 200  
  `{ "data": [ChatWithIncludes], "total": number }`
- **ChatWithIncludes:**  
  ```json
  {
    ...Chat,
    "business"?: Business,
    "userViaProviderId"?: User,
    "customer"?: Customer,
    "connectedChannel"?: ConnectedChannel | null,
    "messages"?: [Message]
  }
  ```
- **Message:**  
  ```json
  {
    "messageId": "string",
    "chatId": "string",
    "platformMessageId": "string | null",
    "senderType": "BOT | CUSTOMER | AGENT",
    "contentType": "TEXT | IMAGE | AUDIO",
    "content": "string",
    "timestamp": "string (ISO date)",
    "totalTimeTaken": "string | null",
    "cost": "string | null"
  }
  ```
- **Error Response:**  
  - Status: 500  
  `{ "message": "Internal server error", "error": "details" }`

### POST `/api/chats`
- **Body:**
  ```json
  {
    "businessId": "string",
    "platformCustomerId": "string",
    "channelId": "string",
    "providerUserId"?: "string | null",
    "status"?: "OPEN | CLOSED_BY_BOT | CLOSED_BY_AGENT | ARCHIVED",
    "chatType"?: "real | test"
  }
  ```
- **Success Response:**  
  - Status: 201  
  Chat
- **Error Response:**  
  - Status: 400
    `{ "message": "businessId, platformCustomerId, and channelId are required" }`
  - Status: 500  
  `{ "message": "Internal server error", "error": "details" }`

### GET `/api/chats/[chatId]`
- **Query Parameters:**  
  - `include`: Comma-separated list (`business,userViaProviderId,customer,connectedChannel,messages`)
- **Success Response:**  
  - Status: 200  
  ChatWithIncludes
- **Error Response:**  
  - Status: 400  
    `{ "message": "Chat ID is required" }`  
  - Status: 404  
    `{ "message": "Chat not found" }`  
  - Status: 500  
    `{ "message": "Internal server error", "error": "details" }`

### PUT `/api/chats/[chatId]`
- **Body:** Partial Chat (excluding `chatId`, `businessId`, `platformCustomerId`, `channelId`, `startedAt`, `lastMessageAt`)
  ```json
  {
    "status"?: "OPEN | CLOSED_BY_BOT | CLOSED_BY_AGENT | ARCHIVED",
    "chatType"?: "real | test",
    "providerUserId"?: "string | null"
  }
  ```
- **Success Response:**  
  - Status: 200  
  Chat
- **Error Response:**  
  - Status: 400  
    `{ "message": "Chat ID is required" }`  
  - Status: 404  
    `{ "message": "Chat not found" }`  
  - Status: 500  
    `{ "message": "Internal server error", "error": "details" }`

### DELETE `/api/chats/[chatId]`
- **Success Response:**  
  - Status: 204  
  `null`
- **Error Response:**  
  - Status: 400  
    `{ "message": "Chat ID is required" }`  
  - Status: 404  
    `{ "message": "Chat not found" }`  
  - Status: 500  
    `{ "message": "Internal server error", "error": "details" }`

---

## Messages

### Message Object
```json
{
  "messageId": "string",
  "chatId": "string",
  "platformMessageId": "string | null",
  "senderType": "BOT | CUSTOMER | AGENT",
  "contentType": "TEXT | IMAGE | AUDIO",
  "content": "string",
  "timestamp": "string (ISO date)",
  "totalTimeTaken": "string | null",
  "cost": "string | null"
}
```

### GET `/api/messages` (Conceptual - primarily via WebSocket or Chat history)
- **Note:** Direct HTTP API endpoints for messages (GET all, POST create, PUT/DELETE by ID) are generally **not present** as core messaging is handled via WebSockets for real-time interaction, and message history is fetched via `/api/chats/[chatId]/messages` (which is typically handled by `chats.service.ts`'s `handleNewMessage` function and related queries).
- **If a GET /api/messages was to exist, it would likely have:**
  - **Query Parameters:** `chatId` (mandatory), `limit`, `offset`, `senderType`, `contentType`, `timestampBefore`, `timestampAfter`, `orderBy`
  - **Success Response:** `{ "data": [MessageWithIncludes], "total": number }`
  - **MessageWithIncludes:** `{ ...Message, "chat"?: Chat }`

### POST `/api/messages` (Conceptual - primarily via WebSocket)
- **Note:** Message creation is typically handled via real-time WebSocket communication or through specific backend triggers (e.g., webhooks from external platforms). If a direct HTTP POST was implemented, it would likely be similar to:
  - **Body:** `{ "chatId": "string", "senderType": "BOT | CUSTOMER | AGENT", "contentType": "TEXT | IMAGE | AUDIO", "content": "string", "platformMessageId"?: "string | null" }`
  - **Success Response:** Message

---

## Webhooks

### POST `/api/webhooks/facebook`
- **Description:** Facebook webhook endpoint for receiving messages from Facebook Pages
- **Query Parameters (GET):**
  - `hub.mode`: Webhook verification mode
  - `hub.verify_token`: Verification token
  - `hub.challenge`: Challenge string for verification
- **GET Success Response:**
  - Status: 200
  Challenge string (for webhook verification)
- **GET Error Response:**
  - Status: 403
  `Forbidden` (invalid verification token)
- **POST Body:** Facebook webhook payload (automatically parsed)
- **POST Success Response:**
  - Status: 200
  `EVENT_RECEIVED`
- **POST Error Response:**
  - Status: 500
  `Internal Server Error`

### POST `/api/webhooks/facebook/handle`
- **Description:** Internal handler for processing Facebook messages (called asynchronously)
- **Body:** Facebook webhook payload
- **Success Response:**
  - Status: 200
  `EVENT_RECEIVED`
- **Error Response:**
  - Status: 500
  `Internal Server Error`

### POST `/api/webhooks/try`
- **Description:** Test webhook endpoint for custom message format
- **Body:**
  ```json
  {
    "recipient": {
      "id": "string"
    },
    "sender": {
      "id": "string"
    },
    "content": {
      "text": "string | null",
      "image": "string | null"
    }
  }
  ```
- **Success Response:**
  - Status: 200
  ```json
  {
    "image": "string | null",
    "msg": "string "
  }
  ```
- **Error Response:**
  - Status: 400
  `ERROR_SAME_SENDER` (sender and recipient are the same)
  - Status: 404
  `ERROR_CHANNEL_NOT_FOUND` (channel not found for recipient)
  - Status: 500
  `ERROR_FETCHING_CHANNEL` | `ERROR_CREATING_CUSTOMER` | `ERROR_CREATING_CHAT` | `ERROR_PROCESSING_MESSAGE` | `Internal Server Error`

---

## ImageKit

### GET `/api/imagekit`
- **Description:** Get ImageKit authentication parameters for client-side uploads
- **Success Response:**
  - Status: 200
  ```json
  {
    "token": "string",
    "expire": "number",
    "signature": "string"
  }
  ```
- **Error Response:**
  - Status: 500
  `Internal Server Error`

---

## Notes

- All endpoints return JSON.
- All error responses are JSON objects with a `message` field and the HTTP status code as described. They may also include an `error` field with more details for debugging.
- All endpoints may return `{ "message": "Internal server error", "error": "details" }` with status 500 for unexpected errors.
- For all `[id]` endpoints, a missing or invalid ID returns a 400 or 404 error as shown.
- For all collection endpoints, pagination is supported via `limit` and `offset` query parameters.
- The `include` parameter allows for eager loading of related entities as described.
