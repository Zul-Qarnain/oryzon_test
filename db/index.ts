import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

// TODO: Replace with your actual Neon database connection string
// It's highly recommended to use environment variables for this.
// Example: process.env.DATABASE_URL
const neonConnectionString = process.env.DATABASE_URL;
console.log(neonConnectionString)
if (!neonConnectionString) {
  throw new Error('DATABASE_URL environment variable is not set or is empty.');
}

const sql = neon(neonConnectionString);
export const db = drizzle(sql, { schema });


// You might also want to export the schema directly if needed elsewhere,
// though importing it via `db.query.users.findMany()` etc. is common.
// export * from './schema';
