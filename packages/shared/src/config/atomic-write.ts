import fs from "node:fs";
import path from "node:path";

export interface AtomicWriteOptions {
  filePath: string;
  content: string;
  fsModule?: typeof fs;
  mode?: number;
}

export async function atomicWriteFile(options: AtomicWriteOptions): Promise<void> {
  const { filePath, content, fsModule = fs, mode = 0o600 } = options;
  const dir = path.dirname(filePath);
  const basename = path.basename(filePath);
  const tmp = path.join(dir, `${basename}.${process.pid}.${crypto.randomUUID()}.tmp`);

  // Write to temp file with restricted permissions
  await fsModule.promises.writeFile(tmp, content, { encoding: "utf-8", mode });

  // Backup existing file if present
  if (fsModule.existsSync(filePath)) {
    const backup = `${filePath}.bak`;
    await fsModule.promises.copyFile(filePath, backup);
  }

  // Atomic rename (POSIX) or copy (Windows fallback)
  try {
    await fsModule.promises.rename(tmp, filePath);
  } catch (err: unknown) {
    const error = err as NodeJS.ErrnoException;
    if (error.code === "EPERM" || error.code === "EEXIST") {
      await fsModule.promises.copyFile(tmp, filePath);
    }
    throw err;
  }
}
