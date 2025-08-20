import {
  DataAPIClient,
  InferTablePrimaryKey,
  InferTableSchema,
  Table,
} from "@datastax/astra-db-ts";
console.log(process.env.ASTRA_TOKEN);

const client = new DataAPIClient(process.env.ASTRA_TOKEN);
const database = client.db('https://bdadc1d5-436e-41bf-a36e-6fe4a1235b6b-us-east-2.apps.astra.datastax.com', { keyspace: "default_keyspace" });

const tableDefinition = Table.schema({
  // Define all of the columns in the table
  columns: {
    id: { type: "text" },
    imageEmbedding: { type: "vector", dimension: 1024 },
    textEmbedding: { type: "vector", dimension: 512 },
    text: { type: "text" },

  },
  // Define the primary key for the table.
  // In this case, the table uses a single-column primary key.
  primaryKey: {
    partitionBy: ["id"],
  },
});

// Infer the TypeScript-equivalent type of the table's schema and primary key
type TableSchema = InferTableSchema<typeof tableDefinition>;
type TablePrimaryKey = InferTablePrimaryKey<typeof tableDefinition>;

// (async function () {
//   // Provide the types and the definition
//   const table = await database.createTable<TableSchema, TablePrimaryKey>(
//     "products",
//     { definition: tableDefinition },
//   );
// })();
const table = database.table("products");

// // Index a vector column
// (async function () {
//   await table.createVectorIndex("image_index", "imageEmbedding");
//   await table.createVectorIndex("text_index", "textEmbedding");
// })();