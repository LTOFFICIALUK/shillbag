import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is required");
}

export const pool = new Pool({
  connectionString: url,
  max: 10,
  ssl:
    url.includes("localhost") || url.includes("127.0.0.1")
      ? false
      : { rejectUnauthorized: false },
});

const schemaPaths = [
  path.resolve(process.cwd(), "schema.sql"),
  path.resolve(process.cwd(), "../database/schema.sql"),
];

export const migrate = async () => {
  const file = schemaPaths.find((candidate) => fs.existsSync(candidate));
  if (!file) {
    throw new Error("schema.sql not found");
  }
  const sql = fs.readFileSync(file, "utf8");
  await pool.query(sql);
};
