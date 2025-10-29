import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface Logger {
  clear(): void;
  error(message: string): void;
  info(message: string): void;
  logFile: string | null;
  message(message: string): void;
  warn(message: string): void;
}

class DefaultLogger implements Logger {
  logFile: string | null = null;
  private logStream: fs.WriteStream | null = null;

  constructor() {
    // Create a log file in temp directory
    const tempDir = path.join(__dirname, '..', 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    this.logFile = path.join(tempDir, `tiger-${Date.now()}.log`);
    this.logStream = fs.createWriteStream(this.logFile, { flags: 'a' });
  }

  private writeToFile(level: string, message: string): void {
    if (this.logStream) {
      const timestamp = new Date().toISOString();
      this.logStream.write(`[${timestamp}] ${level}: ${message}\n`);
    }
  }

  clear(): void {
    if (this.logStream) {
      this.logStream.end();
      this.logStream = null;
    }
    if (this.logFile && fs.existsSync(this.logFile)) {
      fs.unlinkSync(this.logFile);
      this.logFile = null;
    }
  }

  error(message: string): void {
    console.error(`❌ ${message}`);
    this.writeToFile('ERROR', message);
  }

  info(message: string): void {
    console.log(`ℹ️  ${message}`);
    this.writeToFile('INFO', message);
  }

  message(message: string): void {
    if (message.trim()) {
      console.log(message);
      this.writeToFile('MESSAGE', message);
    }
  }

  warn(message: string): void {
    console.warn(`⚠️  ${message}`);
    this.writeToFile('WARN', message);
  }
}

export const defaultLogger = new DefaultLogger();