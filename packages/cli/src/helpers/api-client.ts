// API Client Helper - Shared HTTP client for LeClaw Server
// Uses config.server.port for URL construction

import { loadConfig } from "@leclaw/shared";
import type { AgentInfo } from "./api-key.js";

const CONFIG_FILE = "~/.leclaw/config.json";

function getConfigPath(): string {
  // Expand ~ to home directory
  if (CONFIG_FILE.startsWith("~/")) {
    const home = process.env.HOME || process.env.USERPROFILE || "";
    return CONFIG_FILE.replace(/^~/, home);
  }
  return CONFIG_FILE;
}

export function getLeClawServerUrl(): string {
  const config = loadConfig({ configPath: getConfigPath() });
  return `http://localhost:${config.server?.port ?? 4396}`;
}

export interface ApiClientOptions {
  apiKey: string;
  companyId?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code?: string;
    message: string;
  };
}

export function createApiClient({ apiKey, companyId }: ApiClientOptions) {
  const baseUrl = getLeClawServerUrl();

  async function request<T>(
    method: string,
    endpoint: string,
    body?: Record<string, unknown>
  ): Promise<T> {
    const url = `${baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    };

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    // Handle empty response (204 No Content)
    const text = await response.text();
    if (!text) {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return {} as T;
    }

    const result: ApiResponse<T> = JSON.parse(text);

    if (!response.ok || !result.success) {
      const errorMessage = result.error?.message || `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }

    return result.data as T;
  }

  return {
    get: <T>(endpoint: string) => request<T>("GET", endpoint),
    post: <T>(endpoint: string, body?: Record<string, unknown>) =>
      request<T>("POST", endpoint, body),
    put: <T>(endpoint: string, body?: Record<string, unknown>) =>
      request<T>("PUT", endpoint, body),
    delete: <T>(endpoint: string) => request<T>("DELETE", endpoint),

    // Convenience methods with companyId prepended
    getDepartments: () =>
      request<any[]>(`GET`, `/api/companies/${companyId}/departments`),
    createDepartment: (data: { name: string; description?: string }) =>
      request<any>(`POST`, `/api/companies/${companyId}/departments`, data),
    updateDepartment: (id: string, data: { name?: string; description?: string }) =>
      request<any>(`PUT`, `/api/companies/${companyId}/departments/${id}`, data),

    getApprovals: (params?: { status?: string; mine?: boolean }) => {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.set("status", params.status);
      if (params?.mine) searchParams.set("mine", "true");
      const query = searchParams.toString();
      return request<any[]>(`GET`, `/api/companies/${companyId}/approvals${query ? `?${query}` : ""}`);
    },
    getApproval: (id: string) =>
      request<any>(`GET`, `/api/companies/${companyId}/approvals/${id}`),
    createApproval: (data: { title: string; description: string; type: string }) =>
      request<any>(`POST`, `/api/companies/${companyId}/approvals`, data),
    approveApproval: (id: string, message?: string) =>
      request<any>(`PUT`, `/api/companies/${companyId}/approvals/${id}/approve`, message ? { message } : undefined),
    rejectApproval: (id: string, message: string) =>
      request<any>(`PUT`, `/api/companies/${companyId}/approvals/${id}/reject`, { message }),
    findApprover: (agentId: string) =>
      request<{ approverId: string | null }>(`GET`, `/api/companies/${companyId}/approvals/approver?agentId=${agentId}`),

    getIssues: (params?: { status?: string; departmentId?: string }) => {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.set("status", params.status);
      if (params?.departmentId) searchParams.set("departmentId", params.departmentId);
      const query = searchParams.toString();
      return request<any[]>(`GET`, `/api/companies/${companyId}/issues${query ? `?${query}` : ""}`);
    },
    getIssue: (id: string) =>
      request<any>(`GET`, `/api/companies/${companyId}/issues/${id}`),
    createIssue: (data: {
      title: string;
      description?: string;
      departmentId: string;
      status?: string;
      projectId?: string;
      goalId?: string;
    }) => request<any>(`POST`, `/api/companies/${companyId}/issues`, data),
    updateIssue: (id: string, data: {
      title?: string;
      description?: string;
      status?: string;
      departmentId?: string;
      projectId?: string;
      goalId?: string;
    }) => request<any>(`PUT`, `/api/companies/${companyId}/issues/${id}`, data),
    deleteIssue: (id: string) =>
      request<void>(`DELETE`, `/api/companies/${companyId}/issues/${id}`),

    getIssueComments: (issueId: string) =>
      request<any[]>(`GET`, `/api/companies/${companyId}/issues/${issueId}/comments`),
    addIssueComment: (issueId: string, message: string) =>
      request<any>(`POST`, `/api/companies/${companyId}/issues/${issueId}/comments`, { message }),

    getIssueReport: (issueId: string) =>
      request<{ report: string }>(`GET`, `/api/companies/${companyId}/issues/${issueId}/report`),
    updateIssueReport: (issueId: string, report: string) =>
      request<{ report: string }>(`PUT`, `/api/companies/${companyId}/issues/${issueId}/report`, { report }),

    getSubIssue: (id: string) =>
      request<any>(`GET`, `/api/companies/${companyId}/issues/sub-issues/${id}`),
    createSubIssue: (data: {
      parentIssueId: string;
      title: string;
      description?: string;
      assigneeAgentId: string;
    }) => request<any>(`POST`, `/api/companies/${companyId}/issues/sub-issues`, data),
    updateSubIssue: (id: string, data: {
      title?: string;
      description?: string;
      status?: string;
      assigneeAgentId?: string;
    }) => request<any>(`PUT`, `/api/companies/${companyId}/issues/sub-issues/${id}`, data),
  };
}

// Methods that don't require companyId
export interface ClaimInviteResult {
  success: boolean;
  agentId?: string;
  apiKey?: string;
  error?: string;
}

export interface CurrentAgentInfo {
  agentId: string;
  name: string;
  role: string;
  title?: string | null;
  companyId: string;
  departmentId?: string | null;
}

/**
 * Claim an invite by invite key (no companyId needed)
 */
export async function claimInvite(inviteKey: string): Promise<ClaimInviteResult> {
  const baseUrl = getLeClawServerUrl();
  const url = `${baseUrl}/api/agent-invites/claim/${inviteKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  const text = await response.text();
  if (!text) {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return { success: true };
  }

  const result: ApiResponse<{ agentId: string; apiKey: string; message: string }> = JSON.parse(text);

  if (!response.ok || !result.success) {
    const errorMessage = result.error?.message || `HTTP ${response.status}`;
    throw new Error(errorMessage);
  }

  return {
    success: true,
    agentId: result.data?.agentId,
    apiKey: result.data?.apiKey,
  };
}

/**
 * Get current authenticated agent's info
 */
export async function getCurrentAgent(apiKey: string): Promise<CurrentAgentInfo> {
  const baseUrl = getLeClawServerUrl();
  const url = `${baseUrl}/api/agents/me`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
    },
  });

  const text = await response.text();
  if (!text) {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return {} as CurrentAgentInfo;
  }

  const result: ApiResponse<CurrentAgentInfo> = JSON.parse(text);

  if (!response.ok || !result.success) {
    const errorMessage = result.error?.message || `HTTP ${response.status}`;
    throw new Error(errorMessage);
  }

  return result.data as CurrentAgentInfo;
}

// Re-export AgentInfo for convenience
export type { AgentInfo } from "./api-key.js";
