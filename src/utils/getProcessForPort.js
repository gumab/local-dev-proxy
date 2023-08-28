'use strict';

const {execSync, execFileSync} = require('child_process');

const execOptions = {
  encoding: 'utf8', stdio: [
    'pipe', // stdin (default)
    'pipe', // stdout (default)
    'ignore', //stderr
  ],
};

function getProcessIdOnPort(port) {
  return execFileSync('lsof', ['-i:' + port, '-P', '-t', '-sTCP:LISTEN'],
      execOptions).split('\n')[0].trim();
}

function getDirectoryOfProcessById(processId) {
  return execSync('lsof -p ' + processId +
      ' | awk \'$4=="cwd" {for (i=9; i<=NF; i++) printf "%s ", $i}\'',
      execOptions).trim();
}

function getProcessForPort(port) {
  try {
    const processId = getProcessIdOnPort(port);
    const directory = getDirectoryOfProcessById(processId);
    return {processId, directory};
  } catch (e) {
    return {};
  }
}

module.exports = getProcessForPort;
