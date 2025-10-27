import { cancel, isCancel } from '@clack/prompts';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export type ProjectType = 'element' | 'module' | 'service';

export function checkCancel<T>(value: T | symbol): T {
  if (isCancel(value)) {
    cancel('Operation cancelled');
    process.exit(0);
  }
  return value;
}

export function formatProjectName(projectName: string): { packageName: string; targetDir: string } {
  const packageName = projectName.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const targetDir = projectName;
  
  return { packageName, targetDir };
}

export function templatePath(templateName: string): string {
  return path.resolve(__dirname, '../../../templates', `template-${templateName}`);
}

export function defaultLanguage(platform: string): string {
  switch (platform) {
    case 'android':
      return 'kotlin';
    case 'ios':
      return 'swift';
    case 'web':
      return 'ts';
    default:
      return 'ts';
  }
}