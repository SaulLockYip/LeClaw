export function dotPathGet(root: unknown, pathSegments: string[]): { found: boolean; value?: unknown } {
  let current: unknown = root;
  for (const segment of pathSegments) {
    if (current === null || current === undefined || typeof current !== "object") {
      return { found: false };
    }
    if (Array.isArray(current)) {
      const index = Number.parseInt(segment, 10);
      if (!Number.isFinite(index) || index < 0 || index >= current.length) {
        return { found: false };
      }
      current = current[index];
    } else {
      if (!(segment in (current as Record<string, unknown>))) {
        return { found: false };
      }
      current = (current as Record<string, unknown>)[segment];
    }
  }
  return { found: true, value: current };
}

export function dotPathSet(root: Record<string, unknown>, pathSegments: string[], value: unknown): void {
  let current: Record<string, unknown> = root;
  for (let i = 0; i < pathSegments.length - 1; i++) {
    const segment = pathSegments[i];
    if (!(segment in current)) {
      current[segment] = {};
    }
    current = current[segment] as Record<string, unknown>;
    if (typeof current !== "object" || current === null) {
      current = {};
    }
  }
  current[pathSegments[pathSegments.length - 1]] = value;
}

export function isValidPort(port: number): boolean {
  return Number.isInteger(port) && port > 0 && port < 65536;
}
