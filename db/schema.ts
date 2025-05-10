import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('oryzon_users', {
  id: serial('id').primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Add more tables here as needed
