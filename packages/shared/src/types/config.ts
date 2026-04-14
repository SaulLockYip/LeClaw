export interface LeClawConfig {
  version: string;
  openclaw: {
    dir: string;
    gatewayUrl: string;
    gatewayToken: string;
    gatewayPassword?: string;
  };
  server: {
    port: number;
  };
  database: {
    connectionString: string;
    embeddedDataDir?: string;
    embeddedPort?: number;
  };
  features?: {
    httpMigration?: boolean; // default: false (opt-in, NOT opt-out)
  };
}

export const DEFAULT_CONFIG: Partial<LeClawConfig> = {
  version: "1.0.0",
  server: { port: 4396 },
};
