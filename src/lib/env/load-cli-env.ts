import { loadEnvFile } from "node:process";

for (const file of [".env.local", ".env"]) {
  try {
    loadEnvFile(file);
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}

