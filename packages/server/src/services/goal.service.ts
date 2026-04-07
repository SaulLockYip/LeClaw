import { eq } from "drizzle-orm";
import { goals } from "@leclaw/db/schema";
import { getDb } from "@leclaw/db/client";
import type { Goal } from "@leclaw/shared";

export interface CreateGoalInput {
  title: string;
  description?: string;
  status?: "Open" | "Achieved" | "Archived";
  verification?: string;
  deadline?: Date;
  departmentIds?: string[];
  issueIds?: string[];
  companyId: string;
}

export interface UpdateGoalInput {
  title?: string;
  description?: string;
  status?: "Open" | "Achieved" | "Archived";
  verification?: string;
  deadline?: Date;
  departmentIds?: string[];
  issueIds?: string[];
}

export async function listGoalsByCompany(companyId: string): Promise<Goal[]> {
  const db = await getDb();
  return await db.select().from(goals).where(eq(goals.companyId, companyId));
}

export async function getGoal(id: string): Promise<Goal | null> {
  const db = await getDb();
  const result = await db.select().from(goals).where(eq(goals.id, id));
  return result[0] ?? null;
}

export async function createGoal(input: CreateGoalInput): Promise<Goal> {
  const db = await getDb();
  const id = crypto.randomUUID();
  const now = new Date();

  const [goal] = await db.insert(goals).values({
    id,
    companyId: input.companyId,
    title: input.title,
    description: input.description,
    status: input.status ?? "Open",
    verification: input.verification,
    deadline: input.deadline,
    departmentIds: input.departmentIds ?? [],
    issueIds: input.issueIds ?? [],
    createdAt: now,
    updatedAt: now,
  }).returning();

  return goal;
}

export async function updateGoal(id: string, input: UpdateGoalInput): Promise<Goal | null> {
  const db = await getDb();
  const [goal] = await db.update(goals)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(goals.id, id))
    .returning();

  return goal ?? null;
}

export async function deleteGoal(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.delete(goals).where(eq(goals.id, id));
  return result.rowCount > 0;
}