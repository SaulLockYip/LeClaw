import { eq, and } from "drizzle-orm";
import { departments, agents } from "@leclaw/db/schema";
import { getDb } from "@leclaw/db/client";
import type { Department, Agent } from "@leclaw/shared";

export interface CreateDepartmentInput {
  name: string;
  companyId: string;
  description?: string;
}

export interface UpdateDepartmentInput {
  name?: string;
  description?: string;
}

export interface DepartmentWithMembers extends Department {
  manager: Agent | null;
  staffs: Agent[];
}

export async function listDepartmentsByCompany(companyId: string): Promise<DepartmentWithMembers[]> {
  const db = await getDb();

  // Get all departments for the company
  const deptRows = await db.select().from(departments).where(eq(departments.companyId, companyId));

  // For each department, get the manager and staffs
  const departmentsWithMembers: DepartmentWithMembers[] = await Promise.all(
    deptRows.map(async (dept) => {
      // Get manager: role = "Manager" AND departmentId = dept.id
      const [manager] = await db
        .select()
        .from(agents)
        .where(and(eq(agents.departmentId, dept.id), eq(agents.role, "Manager" as const)))
        .limit(1);

      // Get staffs: role = "Staff" AND departmentId = dept.id
      const staffs = await db
        .select()
        .from(agents)
        .where(and(eq(agents.departmentId, dept.id), eq(agents.role, "Staff" as const)));

      return {
        ...dept,
        manager: manager ? { ...manager, role: manager.role as Agent["role"] } : null,
        staffs: staffs.map((s) => ({ ...s, role: s.role as Agent["role"] })),
      };
    })
  );

  return departmentsWithMembers;
}

export async function getDepartment(id: string, companyId: string): Promise<Department | null> {
  const db = await getDb();
  const result = await db.select().from(departments)
    .where(and(eq(departments.id, id), eq(departments.companyId, companyId)));
  return result[0] ?? null;
}

export async function createDepartment(input: CreateDepartmentInput): Promise<Department> {
  const db = await getDb();

  const [department] = await db.insert(departments).values({
    name: input.name,
    companyId: input.companyId,
    description: input.description ?? null,
  } as any).returning();

  return department;
}

export async function updateDepartment(
  id: string,
  companyId: string,
  input: UpdateDepartmentInput
): Promise<Department | null> {
  const db = await getDb();
  const [department] = await db.update(departments)
    .set({ name: input.name ?? undefined, description: input.description ?? undefined, updatedAt: new Date() } as any)
    .where(and(eq(departments.id, id), eq(departments.companyId, companyId)))
    .returning();

  return department ?? null;
}

export async function deleteDepartment(id: string, companyId: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.delete(departments)
    .where(and(eq(departments.id, id), eq(departments.companyId, companyId)))
    .returning();
  return result.length > 0;
}
