import { eq, and } from "drizzle-orm";
import { issues, issueComments } from "@leclaw/db/schema";
import { getDb } from "@leclaw/db/client";
import type { Issue, IssueComment } from "@leclaw/shared";

export interface CreateIssueInput {
  title: string;
  description?: string;
  status?: "Open" | "InProgress" | "Blocked" | "Done" | "Cancelled";
  assigneeAgentId?: string;
  departmentId?: string;
  subIssues?: string[];
  report?: string;
  projectId?: string;
  goalId?: string;
  companyId: string;
}

export interface UpdateIssueInput {
  title?: string;
  description?: string;
  status?: "Open" | "InProgress" | "Blocked" | "Done" | "Cancelled";
  assigneeAgentId?: string;
  subIssues?: string[];
  report?: string;
  projectId?: string;
  goalId?: string;
}

export async function listIssuesByCompany(companyId: string): Promise<Issue[]> {
  const db = await getDb();
  return await db.select().from(issues).where(eq(issues.companyId, companyId));
}

export async function listIssuesByDepartment(departmentId: string): Promise<Issue[]> {
  const db = await getDb();
  return await db.select().from(issues).where(eq(issues.departmentId, departmentId));
}

export async function getIssue(id: string): Promise<Issue | null> {
  const db = await getDb();
  const result = await db.select().from(issues).where(eq(issues.id, id));
  return result[0] ?? null;
}

export async function createIssue(input: CreateIssueInput): Promise<Issue> {
  const db = await getDb();
  const id = crypto.randomUUID();
  const now = new Date();

  const [issue] = await db.insert(issues).values({
    id,
    companyId: input.companyId,
    title: input.title,
    description: input.description,
    status: input.status ?? "Open",
    assigneeAgentId: input.assigneeAgentId,
    departmentId: input.departmentId,
    subIssues: input.subIssues ?? [],
    report: input.report,
    projectId: input.projectId,
    goalId: input.goalId,
    createdAt: now,
    updatedAt: now,
  }).returning();

  return issue;
}

export async function updateIssue(id: string, input: UpdateIssueInput): Promise<Issue | null> {
  const db = await getDb();
  const [issue] = await db.update(issues)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(issues.id, id))
    .returning();

  return issue ?? null;
}

export async function deleteIssue(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.delete(issues).where(eq(issues.id, id));
  return result.rowCount > 0;
}

export async function addComment(issueId: string, authorAgentId: string, message: string): Promise<IssueComment> {
  const db = await getDb();
  const id = crypto.randomUUID();
  const now = new Date();

  const [comment] = await db.insert(issueComments).values({
    id,
    issueId,
    authorAgentId,
    message,
    timestamp: now,
  }).returning();

  return comment;
}