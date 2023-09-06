import { promisify } from 'util';
import { exec, spawn, SpawnOptions } from 'child_process';
import {LdprxError} from "../libs/LdprxError";

function parseCommand(file: string, args?: string[]) {
  if (args) {
    return {
      file,
      args,
    };
  } else {
    const split = file.match(/"[^"]+"|\S+/g);
    if (!split) {
      throw new LdprxError('command parsing Error');
    }
    return {
      file: split[0],
      args: split.slice(1),
    };
  }
}

export const wrapSpawn = (file: string, args?: string[], options?: SpawnOptions) => {
  const parsed = parseCommand(file, args);
  return spawn(parsed.file, parsed.args, options || { stdio: 'inherit' });
};

export const spawnAsync = (file: string, args?: string[], options?: SpawnOptions) =>
  new Promise((resolve, reject) => {
    const child = wrapSpawn(file, args, options);
    const stdouts: string[] = [];
    if (child.stdout) {
      child.stdout.on('data', (data) => stdouts.push(data.toString()));
    } else {
      process.stdout.on('data', (data) => stdouts.push(data.toString()));
    }
    child.on('exit', (code, signal) => {
      if (code) {
        reject(new Error(`child process exit(${code}${signal ? ` - ${signal}` : ''})\n${stdouts.join('\n')}`));
      } else {
        resolve(stdouts.join('\n'));
      }
    });
  });

export const execAsync = promisify(exec);
