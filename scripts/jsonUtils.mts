import fsp from 'node:fs/promises';

export async function readJSON(filepath: string): Promise<any> {
  return JSON.parse(await fsp.readFile(filepath, 'utf-8'));
}

export async function tryReadJSON(filepath: string): Promise<any> {
  try {
    return await readJSON(filepath);
  } catch (err) {
    if ((err as any).code === 'ENOENT') {
      return undefined;
    }
    throw err;
  }
}

export function writeJSON(filepath: string, data: unknown): Promise<void> {
  return fsp.writeFile(filepath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}
