const {exec} = require('child_process');

const execAsync = (command) => new Promise(
    (resolve, reject) => exec(command, (error, stdout) => {
      if (error) {
        reject(error);
      } else {
        resolve(stdout);
      }
    }));

async function run() {
  try {
    const ps = await execAsync('docker ps|grep 0.0.0.0:80').
        then(x => /^\w+/.exec(x)?.[0]);
    if (ps) {
      await execAsync(`docker stop ${ps}`);
    }
  } catch (e) {
  }
  await execAsync('docker rm -f local-dev-proxy');
  await execAsync(
      'docker run -d --name local-dev-proxy -p 80:8080 -p 443:8443 ghcr.io/thefarmersfront/local-dev-proxy:latest');
}

module.exports.run = run;
