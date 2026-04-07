import { eq } from "drizzle-orm";
import { approvals } from "@leclaw/db/schema";
import { getDb } from "@leclaw/db/client";
import type { Approval, ApprovalStatus } from "@leclaw/shared";

export interface CreateApprovalInput {
  title: string;
  description?: string;
  requesterAgentId?: string;
  companyId: string;
}

export interface UpdateApprovalInput {
  status?: ApprovalStatus;
  rejectMessage?: string;
}

export async function listApprovalsByCompany(companyId: string): Promise<Approval[]> {
  const db = await getDb();
  const rows = await db.select().from(approvals).where(eq(approvals.companyId, companyId));
  return rows.map(row => ({ ...row, status: row.status as ApprovalStatus }));
}

export async function getApproval(id: string): Promise<Approval | null> {
  const db = await getDb();
  const result = await db.select().from(approvals).where(eq(approvals.id, id));
  if (!result[0]) return null;
  return { ...result[0], status: result[0].status as ApprovalStatus };
}

export async function createApproval(input: CreateApprovalInput): Promise<Approval> {
  const db = await getDb();

  const [approval] = await db.insert(approvals).values({
    companyId: input.companyId,
    title: input.title,
    description: input.description ?? null,
    requester: input.requesterAgentId ?? null,
    status: "Pending",
  } as any).returning();

  return { ...approval, status: approval.status as ApprovalStatus };
}

export async function updateApproval(id: string, input: UpdateApprovalInput): Promise<Approval | null> {
  const db = await getDb();
  const [approval] = await db.update(approvals)
    .set({ status: input.status, rejectMessage: input.rejectMessage ?? undefined, updatedAt: new Date() } as any)
    .where(eq(approvals.id, id))
    .returning();

  if (!approval) return null;
  return { ...approval, status: approval.status as ApprovalStatus };
}
