import { eq, and } from "drizzle-orm";
import { issues, issueComments } from "@leclaw/db/schema";
import { getDb } from "@leclaw/db/client";
import type { Issue, IssueComment, IssueStatus } from "@leclaw/shared";

export interface CreateIssueInput {
  title: string;
  description?: string;
  status?: IssueStatus;
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
  status?: IssueStatus;
  assigneeAgentId?: string;
  subIssues?: string[];
  report?: string;
  projectId?: string;
  goalId?: string;
}

export async function listIssuesByCompany(companyId: string): Promise<Issue[]> {
  const db = await getDb();
  const rows = await db.select().from(issues).where(eq(issues.companyId, companyId));
  return rows.map(row => ({ ...row, status: row.status as IssueStatus }));
}

export async function listIssuesByDepartment(departmentId: string): Promise<Issue[]> {
  const db = await getDb();
  const rows = await db.select().from(issues).where(eq(issues.departmentId, departmentId));
  return rows.map(row => ({ ...row, status: row.status as IssueStatus }));
}

export async function getIssue(id: string): Promise<Issue | null> {
  const db = await getDb();
  const result = await db.select().from(issues).where(eq(issues.id, id));
  if (!result[0]) return null;
  return { ...result[0], status: result[0].status as IssueStatus };
}

export async function createIssue(input: CreateIssueInput): Promise<Issue> {
  const db = await getDb();

  const [issue] = await db.insert(issues).values({
    companyId: input.companyId,
    title: input.title,
    description: input.description ?? null,
    status: input.status ?? "Open",
    assigneeAgentId: input.assigneeAgentId ?? null,
    departmentId: input.departmentId ?? null,
    subIssues: input.subIssues ?? [],
    report: input.report ?? null,
    projectId: input.projectId ?? null,
    goalId: input.goalId ?? null,
  } as any).returning();

  return { ...issue, status: issue.status as IssueStatus };
}

export async function updateIssue(id: string, input: UpdateIssueInput): Promise<Issue | null> {
  const db = await getDb();
  const [issue] = await db.update(issues)
    .set({ ...input, updatedAt: new Date() } as any)
    .where(eq(issues.id, id))
    .returning();

  if (!issue) return null;
  return { ...issue, status: issue.status as IssueStatus };
}

export async function deleteIssue(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.delete(issues).where(eq(issues.id, id)).returning();
  return result.length > 0;
}

export async function addComment(issueId: string, authorAgentId: string, message: string): Promise<IssueComment> {
  const db = await getDb();

  const [comment] = await db.insert(issueComments).values({
    issueId,
    authorAgentId: authorAgentId ?? null,
    message,
  } as any).returning();

  return comment;
}
