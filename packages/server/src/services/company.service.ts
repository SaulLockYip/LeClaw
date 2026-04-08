import { eq } from "drizzle-orm";
import { companies } from "@leclaw/db/schema";
import { getDb } from "@leclaw/db/client";
import type { Company } from "@leclaw/shared";

export interface CreateCompanyInput {
  name: string;
  description?: string;
}

export interface UpdateCompanyInput {
  name?: string;
  description?: string;
}

export async function listCompanies(): Promise<Company[]> {
  const db = await getDb();
  return await db.select().from(companies);
}

export async function getCompany(id: string): Promise<Company | null> {
  const db = await getDb();
  const result = await db.select().from(companies).where(eq(companies.id, id));
  return result[0] ?? null;
}

export async function createCompany(input: CreateCompanyInput): Promise<Company> {
  const db = await getDb();

  const [company] = await db.insert(companies).values({
    name: input.name,
    description: input.description ?? null,
  } as any).returning();

  return company;
}

export async function updateCompany(id: string, input: UpdateCompanyInput): Promise<Company | null> {
  const db = await getDb();
  const [company] = await db.update(companies)
    .set({ name: input.name ?? undefined, description: input.description ?? undefined, updatedAt: new Date() } as any)
    .where(eq(companies.id, id))
    .returning();

  return company ?? null;
}

export async function deleteCompany(id: string): Promise<boolean> {
  const db = await getDb();
  const result = await db.delete(companies).where(eq(companies.id, id)).returning();
  return result.length > 0;
}
