// db/schema.ts

import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { InferModel } from "drizzle-orm";

// User table
export const user = pgTable("users", {
  id: text("id").primaryKey(), // Clerk User ID
  email: text("email").unique().notNull(),
  created_at: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});


// TypeScript types for the tables
export type User = InferModel<typeof user>;


// -- Create users table
// CREATE TABLE users (
//   id TEXT PRIMARY KEY,
//   email TEXT UNIQUE NOT NULL,
//   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
//   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
// );

