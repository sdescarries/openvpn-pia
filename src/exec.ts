import { spawn, ChildProcess } from 'child_process';
import chalk from 'chalk';

export interface ExecConfig {
  expectedStatusCode?: number;
  onStdout?: (data: string) => void;
  onStderr?: (data: string) => void;
  stdio?: 'pipe' | 'ignore';
}

export interface ProcessStatus {
  success: boolean;
  code: number;
  signal?: number;
}

export class ExecError extends Error {

  cmd: string;
  stdout: string;
  stderr: string;

  constructor(cmd: string[], stdout: string, stderr: string) {
    const cmdString = cmd.join(' ');
    super(`Command failed: ${cmdString}`);
    this.cmd = cmdString;
    this.stdout = stdout;
    this.stderr = stderr;
  }

  toString() {
    return `\n${chalk.red.bold('Command failed:')} ${chalk.yellow(this.cmd.trim())}\n\t${chalk.gray(this.stderr.trim().replace('\n', '\n\t'))}\n`;
  }
}

export class ExecPromise extends Promise<string> {

  stdout: string[];
  stderr: string[];
  cp?: ChildProcess;

  constructor(executor: any, config?: ExecConfig) {

    if (typeof executor === 'function') {
      super(executor);
      this.stdout = [];
      this.stderr = [];
      return;
    } 
    
    const [cmd, ...args] = executor as string[];
    const context: any = {};

    super((resolve, reject) => {
      context.resolve = resolve;
      context.reject = reject;
    });

    const onClose = (code: number | Error) => {

      if (code === (config?.expectedStatusCode ?? 0)) {
        context.resolve(this.stdout.join(''));
      }

      context.reject(
        new ExecError(
          [cmd, ...args],
          this.stdout.join(''),
          this.stderr.join('')
        )
      );
    }

    const {
      onStdout = (entry: string) => this.stdout.push(entry),
      onStderr = (entry: string) => this.stdout.push(entry),
    } = config ?? {};

    this.stderr = [];
    this.stdout = [];
    this.cp = spawn(
      cmd, args, {
        stdio: config?.stdio ?? 'pipe',
      });
    
    this.cp.stdout?.on('data', (buffer: Buffer) => onStdout(buffer.toString('utf8')));
    this.cp.stderr?.on('data', (buffer: Buffer) => onStderr(buffer.toString('utf8')));

    this.cp.on('close', onClose);
    this.cp.on('exit', onClose);
    this.cp.on('error', onClose);
  }
}

export const toArray = (inp: string | string[]): string[] => (typeof inp === 'string' ? inp.split(' ') : inp);

export const exec =
  (inputCmd: string | string[], config?: ExecConfig): ExecPromise =>
    new ExecPromise(toArray(inputCmd), config);
