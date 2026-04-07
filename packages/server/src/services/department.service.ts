import { eq, and } from "drizzle-orm";
import { departments } from "@leclaw/db/schema";
import { getDb } from "@leclaw/db/client";
import type { Department } from "@leclaw/shared";

export interface CreateDepartmentInput {
  name: string;
  companyId: string;
  description?: string;
}

export interface UpdateDepartmentInput {
  name?: string;
  description?: string;
}

export async function listDepartmentsByCompany(companyId: string): Promise<Department[]> {
  const db = await getDb();
  return await db.select().from(departments).where(eq(departments.companyId, companyId));
}

export async function getDepartment(id: string, companyId: string): Promise<Department | null> {
  const db = await getDb();
  const result = await db.select().from(departments)
    .where(and(eq(departments.id, id), eq(departments.companyId, companyId)));
  return result[0] ?? null;
}

export async function createDepartment(input: CreateDepartmentInput): Promise<Department> {
  const db = await getDb();
  const id = crypto.randomUUID();
  const now = new Date();

  const [department] = await db.insert(departments).values({
    id,
    name: input.name,
    companyId: input.companyId,
    description: input.description,
    createdAt: now,
    updatedAt: now,
  }).returning();

  return department;
}

export async function updateDepartment(
  id: string,
  companyId: string,
  input: UpdateDepartmentInput
): Promise<Department | null> {
  const db = await getDb();
  const [department] = await db.update(departments)
    .set({ ...input, updatedAt: new Date() })
    .where(and(eq(departments.id, id), eq(departments.companyId, companyId)))
    .returning();

  return department ?? null;
}

export async function deleteDepartment(id: string, companyId: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.delete(departments)
    .where(and(eq(departments.id, id), eq(departments.companyId, companyId)));
  return result.rowCount > 0;
}