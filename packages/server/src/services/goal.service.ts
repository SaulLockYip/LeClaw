import { eq } from "drizzle-orm";
import { goals } from "@leclaw/db/schema";
import { getDb } from "@leclaw/db/client";
import type { Goal, GoalStatus } from "@leclaw/shared";

export interface CreateGoalInput {
  title: string;
  description?: string;
  status?: GoalStatus;
  verification?: string;
  deadline?: Date;
  departmentIds?: string[];
  issueIds?: string[];
  companyId: string;
}

export interface UpdateGoalInput {
  title?: string;
  description?: string;
  status?: GoalStatus;
  verification?: string;
  deadline?: Date;
  departmentIds?: string[];
  issueIds?: string[];
}

export async function listGoalsByCompany(companyId: string): Promise<Goal[]> {
  const db = await getDb();
  const rows = await db.select().from(goals).where(eq(goals.companyId, companyId));
  return rows.map(row => ({ ...row, status: row.status as GoalStatus }));
}

export async function getGoal(id: string): Promise<Goal | null> {
  const db = await getDb();
  const result = await db.select().from(goals).where(eq(goals.id, id));
  if (!result[0]) return null;
  return { ...result[0], status: result[0].status as GoalStatus };
}

export async function createGoal(input: CreateGoalInput): Promise<Goal> {
  const db = await getDb();

  const [goal] = await db.insert(goals).values({
    companyId: input.companyId,
    title: input.title,
    description: input.description ?? null,
    status: input.status ?? "Open",
    verification: input.verification ?? null,
    deadline: input.deadline ?? null,
    departmentIds: input.departmentIds ?? [],
    issueIds: input.issueIds ?? [],
  } as any).returning();

  return { ...goal, status: goal.status as GoalStatus };
}

export async function updateGoal(id: string, input: UpdateGoalInput): Promise<Goal | null> {
  const db = await getDb();
  const [goal] = await db.update(goals)
    .set({ ...input, updatedAt: new Date() } as any)
    .where(eq(goals.id, id))
    .returning();

  if (!goal) return null;
  return { ...goal, status: goal.status as GoalStatus };
}

export async function deleteGoal(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.delete(goals).where(eq(goals.id, id));
  return (result as unknown as { rowCount: number }).rowCount > 0;
}
