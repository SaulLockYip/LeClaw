// Project entity - Company-level work container grouping related issues

import { pgTable, uuid, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { companies } from "./companies.js";

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull().references(() => companies.id),
    title: text("title").notNull(),
    description: text("description"),
    status: text("status").notNull().default("Open"), // "Open" | "InProgress" | "Done" | "Archived"
    projectDir: text("project_dir"), // Project root directory (outputs, regulations, etc.)
    issueIds: jsonb("issue_ids").$type<string[]>().notNull().default([]), // JSONB array of Issue UUIDs
    departmentIds: jsonb("department_ids").$type<string[]>().notNull().default([]), // JSONB array of Department UUIDs
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    // Compound index for querying projects by company + status
    companyStatusIdx: index("projects_company_status_idx").on(table.companyId, table.status),
  }),
);

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
