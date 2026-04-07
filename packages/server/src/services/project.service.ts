import { eq } from "drizzle-orm";
import { projects } from "@leclaw/db/schema";
import { getDb } from "@leclaw/db/client";
import type { Project, ProjectStatus } from "@leclaw/shared";

export interface CreateProjectInput {
  title: string;
  description?: string;
  status?: ProjectStatus;
  projectDir?: string;
  issueIds?: string[];
  companyId: string;
}

export interface UpdateProjectInput {
  title?: string;
  description?: string;
  status?: ProjectStatus;
  projectDir?: string;
  issueIds?: string[];
}

export async function listProjectsByCompany(companyId: string): Promise<Project[]> {
  const db = await getDb();
  const rows = await db.select().from(projects).where(eq(projects.companyId, companyId));
  return rows.map(row => ({ ...row, status: row.status as ProjectStatus }));
}

export async function getProject(id: string): Promise<Project | null> {
  const db = await getDb();
  const result = await db.select().from(projects).where(eq(projects.id, id));
  if (!result[0]) return null;
  return { ...result[0], status: result[0].status as ProjectStatus };
}

export async function createProject(companyId: string, input: CreateProjectInput): Promise<Project> {
  const db = await getDb();

  const [project] = await db.insert(projects).values({
    companyId,
    title: input.title,
    description: input.description ?? null,
    status: input.status ?? "Open",
    projectDir: input.projectDir ?? null,
    issueIds: input.issueIds ?? [],
  } as any).returning();

  return { ...project, status: project.status as ProjectStatus };
}

export async function updateProject(id: string, input: UpdateProjectInput): Promise<Project | null> {
  const db = await getDb();
  const [project] = await db.update(projects)
    .set({ ...input, updatedAt: new Date() } as any)
    .where(eq(projects.id, id))
    .returning();

  if (!project) return null;
  return { ...project, status: project.status as ProjectStatus };
}

export async function deleteProject(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.delete(projects).where(eq(projects.id, id));
  return (result as unknown as { rowCount: number }).rowCount > 0;
}
