# Backend API Endpoints Reference

This document lists all backend API endpoints, their query parameters, and possible result types (success and error) for your project.  
**All error responses include the HTTP status code.**  
**All entity return types are expanded to show their fields as defined in db/schema.ts.**

---

## Users

### User Object
```json
{
  "userId": "string",
  "email": "string | null",
  "passwordHash": "string | null",
  "businessName": "string | null",
  "loginProvider": "EMAIL | GOOGLE | FACEBOOK_AUTH | LINKEDIN_AUTH",
  "providerUserId": "string | null",
  "createdAt": "string (ISO date)",
  "updatedAt": "string (ISO date)"
}
```

### GET `/api/users`
- **Query Parameters:**
  - `include`: Comma-separated list (`connectedChannels,products,orders,chats`)
  - `limit`, `offset`: Pagination
  - `email`, `businessName`, `loginProvider`: Filtering
- **Success Response:**  
  - Status: 200  
  `{ "data": [UserWithIncludes], "total": number }`
- **UserWithIncludes:**  
  ```json
  {
    ...User,
    "connectedChannels"?: [ConnectedChannel],
    "products"?: [Product],
    "orders"?: [Order],
    "chats"?: [Chat]
  }
  ```
- **Error Response:**  
  - Status: 500  
  `{ "message": "Internal server error" }`

### POST `/api/users`
- **Body:** User (see above, omit auto fields)
- **Success Response:**  
  - Status: 201  
  User
- **Error Response:**  
  - Status: 500  
  `{ "message": "Internal server error" }`

### GET `/api/users/[userId]`
- **Query Parameters:**  
  - `include`: Comma-separated list
- **Success Response:**  
  - Status: 200  
  UserWithIncludes
- **Error Response:**  
  - Status: 404  
    `{ "message": "User not found" }`  
  - Status: 400  
    `{ "message": "User ID is required" }`  
  - Status: 500  
    `{ "message": "Internal server error" }`

### PUT `/api/users/[userId]`
- **Body:** Partial User (see above, omit auto fields)
- **Success Response:**  
  - Status: 200  
  User
- **Error Response:**  
  - Status: 404  
    `{ "message": "User not found" }`  
  - Status: 400  
    `{ "message": "User ID is required" }`  
  - Status: 500  
    `{ "message": "Internal server error" }`

### DELETE `/api/users/[userId]`
- **Success Response:**  
  - Status: 204  
  `null`
- **Error Response:**  
  - Status: 404  
    `{ "message": "User not found" }`  
  - Status: 400  
    `{ "message": "User ID is required" }`  
  - Status: 500  
    `{ "message": "Internal server error" }`

---

## ConnectedChannels

### ConnectedChannel Object
```json
{
  "channelId": "string",
  "userId": "string",
  "platformType": "FACEBOOK_PAGE | INSTAGRAM_BUSINESS | LINKEDIN_PAGE | TWITTER_PROFILE",
  "platformSpecificId": "string",
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
  - `include`: Comma-separated list (`user,customers,orders,chats`)
  - `limit`, `offset`: Pagination
  - `userId`, `platformType`, `isActive`, `channelName`: Filtering
- **Success Response:**  
  - Status: 200  
  `{ "data": [ConnectedChannelWithIncludes], "total": number }`
- **ConnectedChannelWithIncludes:**  
  ```json
  {
    ...ConnectedChannel,
    "user"?: User,
    "customers"?: [Customer],
    "orders"?: [Order],
    "chats"?: [Chat]
  }
  ```
- **Error Response:**  
  - Status: 500  
  `{ "message": "Internal server error" }`

### POST `/api/channels`
- **Body:** ConnectedChannel (see above, omit auto fields)
- **Success Response:**  
  - Status: 201  
  ConnectedChannel
- **Error Response:**  
  - Status: 500  
  `{ "message": "Internal server error" }`

### GET `/api/channels/[channelId]`
- **Query Parameters:**  
  - `include`: Comma-separated list
- **Success Response:**  
  - Status: 200  
  ConnectedChannelWithIncludes
- **Error Response:**  
  - Status: 404  
    `{ "message": "Channel not found" }`  
  - Status: 400  
    `{ "message": "Channel ID is required" }`  
  - Status: 500  
    `{ "message": "Internal server error" }`

### PUT `/api/channels/[channelId]`
- **Body:** Partial ConnectedChannel (see above, omit auto fields)
- **Success Response:**  
  - Status: 200  
  ConnectedChannel
- **Error Response:**  
  - Status: 404  
    `{ "message": "Channel not found" }`  
  - Status: 400  
    `{ "message": "Channel ID is required" }`  
  - Status: 500  
    `{ "message": "Internal server error" }`

### DELETE `/api/channels/[channelId]`
- **Success Response:**  
  - Status: 204  
  `null`
- **Error Response:**  
  - Status: 404  
    `{ "message": "Channel not found" }`  
  - Status: 400  
    `{ "message": "Channel ID is required" }`  
  - Status: 500  
    `{ "message": "Internal server error" }`

---

## Customers

### Customer Object
```json
{
  "customerId": "string",
  "channelId": "string",
  "platformCustomerId": "string",
  "fullName": "string | null",
  "profilePictureUrl": "string | null",
  "firstSeenAt": "string (ISO date)",
  "lastSeenAt": "string (ISO date)"
}
```

### GET `/api/customers`
- **Query Parameters:**
  - `include`: Comma-separated list (`connectedChannel,orders,chats`)
  - `limit`, `offset`: Pagination
  - `channelId`, `platformCustomerId`, `fullName`: Filtering
- **Success Response:**  
  - Status: 200  
  `{ "data": [CustomerWithIncludes], "total": number }`
- **CustomerWithIncludes:**  
  ```json
  {
    ...Customer,
    "connectedChannel"?: ConnectedChannel,
    "orders"?: [Order],
    "chats"?: [Chat]
  }
  ```
- **Error Response:**  
  - Status: 500  
  `{ "message": "Internal server error" }`

### POST `/api/customers`
- **Body:** Customer (see above, omit auto fields)
- **Success Response:**  
  - Status: 201  
  Customer
- **Error Response:**  
  - Status: 500  
  `{ "message": "Internal server error" }`

### GET `/api/customers/[customerId]`
- **Query Parameters:**  
  - `include`: Comma-separated list
- **Success Response:**  
  - Status: 200  
  CustomerWithIncludes
- **Error Response:**  
  - Status: 404  
    `{ "message": "Customer not found" }`  
  - Status: 400  
    `{ "message": "Customer ID is required" }`  
  - Status: 500  
    `{ "message": "Internal server error" }`

### PUT `/api/customers/[customerId]`
- **Body:** Partial Customer (see above, omit auto fields)
- **Success Response:**  
  - Status: 200  
  Customer
- **Error Response:**  
  - Status: 404  
    `{ "message": "Customer not found" }`  
  - Status: 400  
    `{ "message": "Customer ID is required" }`  
  - Status: 500  
    `{ "message": "Internal server error" }`

### DELETE `/api/customers/[customerId]`
- **Success Response:**  
  - Status: 204  
  `null`
- **Error Response:**  
  - Status: 404  
    `{ "message": "Customer not found" }`  
  - Status: 400  
    `{ "message": "Customer ID is required" }`  
  - Status: 500  
    `{ "message": "Internal server error" }`

---

## Products

### Product Object
```json
{
  "productId": "string",
  "userId": "string",
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
  - `include`: Comma-separated list (`user,orderItems`)
  - `limit`, `offset`: Pagination
  - `name`, `currency`, `isAvailable`, `userId`, `imageId`, `shortId`: Filtering
- **Success Response:**  
  - Status: 200  
  `{ "data": [ProductWithIncludes], "total": number }`
- **ProductWithIncludes:**  
  ```json
  {
    ...Product,
    "user"?: User,
    "orderItems"?: [OrderItemWithOrder]
  }
  ```
- **OrderItemWithOrder:**  
  ```json
  {
    "orderItemId": "string",
    "orderId": "string",
    "productId": "string",
    "quantity": number,
    "priceAtPurchase": "string",
    "currencyAtPurchase": "string",
    "order"?: Order
  }
  ```
- **Error Response:**  
  - Status: 500  
  `{ "message": "Internal server error" }`

### POST `/api/products`
- **Body:** Product (see above, omit auto fields)
- **Success Response:**  
  - Status: 201  
  Product
- **Error Response:**  
  - Status: 500  
  `{ "message": "Internal server error" }`

### GET `/api/products/[productId]`
- **Query Parameters:**  
  - `include`: Comma-separated list
- **Success Response:**  
  - Status: 200  
  ProductWithIncludes
- **Error Response:**  
  - Status: 404  
    `{ "message": "Product not found" }`  
  - Status: 400  
    `{ "message": "Product ID is required" }`  
  - Status: 500  
    `{ "message": "Internal server error" }`

### PUT `/api/products/[productId]`
- **Body:** Partial Product (see above, omit auto fields)
- **Success Response:**  
  - Status: 200  
  Product
- **Error Response:**  
  - Status: 404  
    `{ "message": "Product not found" }`  
  - Status: 400  
    `{ "message": "Product ID is required" }`  
  - Status: 500  
    `{ "message": "Internal server error" }`

### DELETE `/api/products/[productId]`
- **Success Response:**  
  - Status: 204  
  `null`
- **Error Response:**  
  - Status: 404  
    `{ "message": "Product not found" }`  
  - Status: 400  
    `{ "message": "Product ID is required" }`  
  - Status: 500  
    `{ "message": "Internal server error" }`

---

## Orders

### Order Object
```json
{
  "orderId": "string",
  "customerId": "string",
  "channelId": "string",
  "userId": "string",
  "orderStatus": "PENDING | CONFIRMED | PROCESSING | SHIPPED | CANCELLED",
  "totalAmount": "string",
  "currency": "string",
  "shippingAddress": "object | null",
  "billingAddress": "object | null",
  "createdAt": "string (ISO date)",
  "updatedAt": "string (ISO date)"
}
```

### GET `/api/orders`
- **Query Parameters:**
  - `include`: Comma-separated list (`customer,connectedChannel,user,orderItems`)
  - `limit`, `offset`: Pagination
  - `customerId`, `channelId`, `userId`, `orderStatus`, `currency`: Filtering
- **Success Response:**  
  - Status: 200  
  `{ "data": [OrderWithIncludes], "total": number }`
- **OrderWithIncludes:**  
  ```json
  {
    ...Order,
    "customer"?: Customer,
    "connectedChannel"?: ConnectedChannel,
    "user"?: User,
    "orderItems"?: [OrderItemWithProduct]
  }
  ```
- **OrderItemWithProduct:**  
  ```json
  {
    "orderItemId": "string",
    "orderId": "string",
    "productId": "string",
    "quantity": number,
    "priceAtPurchase": "string",
    "currencyAtPurchase": "string",
    "product"?: Product
  }
  ```
- **Error Response:**  
  - Status: 500  
  `{ "message": "Internal server error" }`

### POST `/api/orders`
- **Body:** Order (see above, omit auto fields)
- **Success Response:**  
  - Status: 201  
  Order
- **Error Response:**  
  - Status: 500  
  `{ "message": "Internal server error" }`

### GET `/api/orders/[orderId]`
- **Query Parameters:**  
  - `include`: Comma-separated list
- **Success Response:**  
  - Status: 200  
  OrderWithIncludes
- **Error Response:**  
  - Status: 404  
    `{ "message": "Order not found" }`  
  - Status: 400  
    `{ "message": "Order ID is required" }`  
  - Status: 500  
    `{ "message": "Internal server error" }`

### PUT `/api/orders/[orderId]`
- **Body:** Partial Order (see above, omit auto fields)
- **Success Response:**  
  - Status: 200  
  Order
- **Error Response:**  
  - Status: 404  
    `{ "message": "Order not found" }`  
  - Status: 400  
    `{ "message": "Order ID is required" }`  
  - Status: 500  
    `{ "message": "Internal server error" }`

### DELETE `/api/orders/[orderId]`
- **Success Response:**  
  - Status: 204  
  `null`
- **Error Response:**  
  - Status: 404  
    `{ "message": "Order not found" }`  
  - Status: 400  
    `{ "message": "Order ID is required" }`  
  - Status: 500  
    `{ "message": "Internal server error" }`

---

## Chats

### Chat Object
```json
{
  "chatId": "string",
  "customerId": "string",
  "channelId": "string",
  "userId": "string",
  "startedAt": "string (ISO date)",
  "lastMessageAt": "string (ISO date)",
  "status": "OPEN | CLOSED_BY_BOT | CLOSED_BY_AGENT | ARCHIVED"
}
```

### GET `/api/chats`
- **Query Parameters:**
  - `include`: Comma-separated list (`customer,connectedChannel,user,messages`)
  - `limit`, `offset`: Pagination
  - `customerId`, `channelId`, `userId`, `status`: Filtering
- **Success Response:**  
  - Status: 200  
  `{ "data": [ChatWithIncludes], "total": number }`
- **ChatWithIncludes:**  
  ```json
  {
    ...Chat,
    "customer"?: Customer,
    "connectedChannel"?: ConnectedChannel,
    "user"?: User,
    "messages"?: [Message]
  }
  ```
- **Message:**  
  ```json
  {
    "messageId": "string",
    "chatId": "string",
    "senderType": "BOT | CUSTOMER | AGENT",
    "contentType": "TEXT | IMAGE | VIDEO | AUDIO | FILE | QUICK_REPLY | CAROUSEL",
    "content": "string",
    "timestamp": "string (ISO date)",
    "platformMessageId": "string | null"
  }
  ```
- **Error Response:**  
  - Status: 500  
  `{ "message": "Internal server error" }`

### POST `/api/chats`
- **Body:** Chat (see above, omit auto fields)
- **Success Response:**  
  - Status: 201  
  Chat
- **Error Response:**  
  - Status: 500  
  `{ "message": "Internal server error" }`

### GET `/api/chats/[chatId]`
- **Query Parameters:**  
  - `include`: Comma-separated list
- **Success Response:**  
  - Status: 200  
  ChatWithIncludes
- **Error Response:**  
  - Status: 404  
    `{ "message": "Chat not found" }`  
  - Status: 400  
    `{ "message": "Chat ID is required" }`  
  - Status: 500  
    `{ "message": "Internal server error" }`

### PUT `/api/chats/[chatId]`
- **Body:** Partial Chat (see above, omit auto fields)
- **Success Response:**  
  - Status: 200  
  Chat
- **Error Response:**  
  - Status: 404  
    `{ "message": "Chat not found" }`  
  - Status: 400  
    `{ "message": "Chat ID is required" }`  
  - Status: 500  
    `{ "message": "Internal server error" }`

### DELETE `/api/chats/[chatId]`
- **Success Response:**  
  - Status: 204  
  `null`
- **Error Response:**  
  - Status: 404  
    `{ "message": "Chat not found" }`  
  - Status: 400  
    `{ "message": "Chat ID is required" }`  
  - Status: 500  
    `{ "message": "Internal server error" }`

---

## Notes

- All endpoints return JSON.
- All error responses are JSON objects with a `message` field and the HTTP status code as described.
- All endpoints may return `{ "message": "Internal server error" }` with status 500 for unexpected errors.
- For all `[id]` endpoints, a missing or invalid ID returns a 400 or 404 error as shown.
- For all collection endpoints, pagination is supported via `limit` and `offset` query parameters.
- The `include` parameter allows for eager loading of related entities as described.
