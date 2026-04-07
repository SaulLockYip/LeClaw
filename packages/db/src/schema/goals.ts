// Goal entity - Company-level objective defining desired outcomes

import { pgTable, uuid, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { companies } from "./companies.js";

export const goals = pgTable(
  "goals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull().references(() => companies.id),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status").notNull().default("Open"), // "Open" | "Achieved" | "Archived"
    verification: text("verification"), // How to verify goal is achieved
    deadline: timestamp("deadline", { withTimezone: true }),
    departmentIds: jsonb("department_ids").$type<string[]>().notNull().default([]), // JSONB array of Department UUIDs
    issueIds: jsonb("issue_ids").$type<string[]>().notNull().default([]), // JSONB array of Issue UUIDs
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    // Compound index for querying goals by company + status
    companyStatusIdx: index("goals_company_status_idx").on(table.companyId, table.status),
  }),
);
