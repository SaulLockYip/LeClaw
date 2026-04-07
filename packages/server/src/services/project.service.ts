import { eq } from "drizzle-orm";
import { projects } from "@leclaw/db/schema";
import { getDb } from "@leclaw/db/client";
import type { Project } from "@leclaw/shared";

export interface CreateProjectInput {
  title: string;
  description?: string;
  status?: "Open" | "InProgress" | "Done" | "Archived";
  projectDir?: string;
  issueIds?: string[];
  companyId: string;
}

export interface UpdateProjectInput {
  title?: string;
  description?: string;
  status?: "Open" | "InProgress" | "Done" | "Archived";
  projectDir?: string;
  issueIds?: string[];
}

export async function listProjectsByCompany(companyId: string): Promise<Project[]> {
  const db = await getDb();
  return await db.select().from(projects).where(eq(projects.companyId, companyId));
}

export async function getProject(id: string): Promise<Project | null> {
  const db = await getDb();
  const result = await db.select().from(projects).where(eq(projects.id, id));
  return result[0] ?? null;
}

export async function createProject(companyId: string, input: CreateProjectInput): Promise<Project> {
  const db = await getDb();
  const id = crypto.randomUUID();
  const now = new Date();

  const [project] = await db.insert(projects).values({
    id,
    companyId,
    title: input.title,
    description: input.description,
    status: input.status ?? "Open",
    projectDir: input.projectDir,
    issueIds: input.issueIds ?? [],
    createdAt: now,
    updatedAt: now,
  }).returning();

  return project;
}

export async function updateProject(id: string, input: UpdateProjectInput): Promise<Project | null> {
  const db = await getDb();
  const [project] = await db.update(projects)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(projects.id, id))
    .returning();

  return project ?? null;
}

export async function deleteProject(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.delete(projects).where(eq(projects.id, id));
  return result.rowCount > 0;
}