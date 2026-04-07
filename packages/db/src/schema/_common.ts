// Shared schema helpers for LeClaw entities

import { type Column, timestamp } from "drizzle-orm/pg-core";

/**
 * Standard created_at/updated_at timestamp columns
 * Used by all LeClaw entities for audit trail
 */
export const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
} as const;

/**
 * Helper to reference a timestamp column with timezone
 */
export function createdAtTimestamp(col: Column) {
  return timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
}
