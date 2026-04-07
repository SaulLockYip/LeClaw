import { eq } from "drizzle-orm";
import { approvals } from "@leclaw/db/schema";
import { getDb } from "@leclaw/db/client";
import type { Approval } from "@leclaw/shared";

export interface CreateApprovalInput {
  title: string;
  description?: string;
  requesterAgentId?: string;
  companyId: string;
}

export interface UpdateApprovalInput {
  status?: "Pending" | "Approved" | "Rejected";
  rejectMessage?: string;
}

export async function listApprovalsByCompany(companyId: string): Promise<Approval[]> {
  const db = await getDb();
  return await db.select().from(approvals).where(eq(approvals.companyId, companyId));
}

export async function getApproval(id: string): Promise<Approval | null> {
  const db = await getDb();
  const result = await db.select().from(approvals).where(eq(approvals.id, id));
  return result[0] ?? null;
}

export async function createApproval(input: CreateApprovalInput): Promise<Approval> {
  const db = await getDb();
  const id = crypto.randomUUID();
  const now = new Date();

  const [approval] = await db.insert(approvals).values({
    id,
    companyId: input.companyId,
    title: input.title,
    description: input.description,
    requester: input.requesterAgentId,
    status: "Pending",
    createdAt: now,
    updatedAt: now,
  }).returning();

  return approval;
}

export async function updateApproval(id: string, input: UpdateApprovalInput): Promise<Approval | null> {
  const db = await getDb();
  const [approval] = await db.update(approvals)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(approvals.id, id))
    .returning();

  return approval ?? null;
}