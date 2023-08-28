const {promisify} = require('util');
const {exec, spawn} = require('child_process');

function parseCommand(file, args) {
  if (args) {
    return {
      file, args,
    };
  } else {
    const split = file.match(/"[^"]+"|\S+/g);
    return {
      file: split[0], args: split.slice(1),
    };
  }
}

const wrapSpawn = (file, args, options) => {
  const parsed = parseCommand(file, args);
  return spawn(parsed.file, parsed.args, options || {stdio: 'inherit'});
};

const spawnAsync = (file, args, options) => new Promise((resolve, reject) => {
  const child = wrapSpawn(file, args, options);
  const stdouts = [];
  if (child.stdout) {
    child.stdout.on('data', (data) => stdouts.push(data.toString()));
  } else {
    process.stdout.on('data', (data) => stdouts.push(data.toString()));
  }
  child.on('exit', (code, signal) => {
    console.log('spwan exit', code, signal);
    resolve(stdouts.join('\n'));
  });
});

module.exports.wrapSpawn = wrapSpawn;
module.exports.spawnAsync = spawnAsync;
module.exports.execAsync = promisify(exec);
