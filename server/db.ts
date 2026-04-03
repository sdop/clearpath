import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@shared/schema";
import path from "path";

// Use process.cwd() so this works both in dev and production
const dbPath = path.resolve(process.cwd(), "data.db");

const sqlite = new Database(dbPath);

// Enable WAL mode for better performance
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });
