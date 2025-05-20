import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

// TODO: Replace with your actual Neon database connection string
// It's highly recommended to use environment variables for this.
// Example: process.env.NEON_DATABASE_URL
const neonConnectionString = process.env.NEON_DATABASE_URL;

if (!neonConnectionString) {
  throw new Error('NEON_DATABASE_URL environment variable is not set or is empty.');
}

const sql = neon(neonConnectionString);
export const db = drizzle(sql, { schema });
console.log(db)

// You might also want to export the schema directly if needed elsewhere,
// though importing it via `db.query.users.findMany()` etc. is common.
// export * from './schema';
