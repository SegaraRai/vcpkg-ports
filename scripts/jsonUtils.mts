import fsp from "node:fs/promises";

export async function readJSON(filepath: string): Promise<unknown> {
  return JSON.parse(await fsp.readFile(filepath, "utf-8"));
}

export async function tryReadJSON(filepath: string): Promise<unknown> {
  try {
    return await readJSON(filepath);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return undefined;
    }
    throw err;
  }
}

export function writeJSON(filepath: string, data: unknown): Promise<void> {
  return fsp.writeFile(filepath, JSON.stringify(data, null, 2) + "\n", "utf-8");
}
