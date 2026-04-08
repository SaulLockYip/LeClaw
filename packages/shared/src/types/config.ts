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
}

export const DEFAULT_CONFIG: Partial<LeClawConfig> = {
  version: "1.0.0",
  server: { port: 4396 },
};
