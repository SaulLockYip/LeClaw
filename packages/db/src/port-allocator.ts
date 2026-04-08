import net from "net";

export async function isPortInUse(port: number): Promise<boolean> {
  return await new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.on("connection", (socket) => socket.destroy());
    server.once("error", (error: NodeJS.ErrnoException) => {
      resolve(error.code === "EADDRINUSE");
    });
    // SO_REUSEADDR allows binding to a port in TIME_WAIT state after close()
    server.listen({ port, host: "127.0.0.1", reuseAddress: true }, () => {
      server.close(() => resolve(false));
    });
  });
}

export async function allocatePort(startPort: number = 65432): Promise<number> {
  const maxLookahead = 20;
  let port = startPort;
  for (let i = 0; i < maxLookahead; i += 1, port += 1) {
    if (!(await isPortInUse(port))) return port;
  }
  throw new Error(`Could not find a free port from ${startPort} to ${startPort + maxLookahead - 1}`);
}
