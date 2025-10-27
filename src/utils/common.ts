import fs from 'node:fs/promises';
import path from 'node:path';

export async function readPackageJson(dir: string): Promise<any> {
  const packageJsonPath = path.join(dir, 'package.json');
  const content = await fs.readFile(packageJsonPath, 'utf8');
  return JSON.parse(content);
}

export async function writePackageJson(dir: string, packageJson: any): Promise<void> {
  const packageJsonPath = path.join(dir, 'package.json');
  await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
}

export async function writeJSON(filePath: string, data: any): Promise<void> {
  const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  await fs.writeFile(filePath, content, 'utf8');
}