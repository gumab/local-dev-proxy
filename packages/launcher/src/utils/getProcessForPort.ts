import { execSync, execFileSync, ExecSyncOptionsWithStringEncoding } from 'child_process';

const execOptions: ExecSyncOptionsWithStringEncoding = {
  encoding: 'utf8',
  stdio: [
    'pipe', // stdin (default)
    'pipe', // stdout (default)
    'ignore', // stderr
  ],
};

function getProcessIdOnPort(port: number) {
  return execFileSync('lsof', [`-i:${port}`, '-P', '-t', '-sTCP:LISTEN'], execOptions)
    .split('\n')[0]
    .trim();
}

function getDirectoryOfProcessById(processId: string) {
  return execSync(
    `lsof -p ${processId} | awk '$4=="cwd" {for (i=9; i<=NF; i++) printf "%s ", $i}'`,
    execOptions,
  ).trim();
}

export function getProcessForPort(port: number) {
  try {
    const processId = getProcessIdOnPort(port);
    const directory = getDirectoryOfProcessById(processId);
    return { processId, directory };
  } catch (e) {
    return {};
  }
}
