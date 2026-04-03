import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@shared/schema";
import path from "path";

// Use DATABASE_URL env var if set (e.g. Render disk mount), otherwise default to local data.db
const dbPath = process.env.DATABASE_URL || path.resolve(process.cwd(), "data.db");

const sqlite = new Database(dbPath);

// Enable WAL mode for better performance
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });
