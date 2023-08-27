const {exec} = require('child_process');

const execAsync = (command) => new Promise(
    (resolve, reject) => {
      const child = exec(command, (error, stdout) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
        }
      });
      child.stdout.on('data', function(data) {
        console.log(data);
      });

      child.stderr.on('data', function(data) {
        console.error(data);
      });
    });

async function run() {
  const ps = await execAsync('docker ps|grep 0.0.0.0:80').
      then(x => /^\w+/.exec(x)?.[0]).catch(() => undefined);
  if (ps) {
    await execAsync(`docker stop ${ps}`);
  }
  await execAsync('docker rm -f local-dev-proxy').catch(() => {
    throw new Error('[local-dev-proxy] 도커 설치 후 이용해주세요.');
  });
  await execAsync(
      'docker run -d --name local-dev-proxy -p 80:8080 -p 443:8443 ghcr.io/thefarmersfront/local-dev-proxy:latest').
      catch(() => {
        throw new Error(
            '[local-dev-proxy] 도커 실행에 실패하였습니다. 80/443 포트 점유 확인 후 다시 이용해주세요.');
      });
}

module.exports.run = run;
