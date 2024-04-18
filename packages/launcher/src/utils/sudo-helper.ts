import { execAsync } from './index';

export async function checkSudo() {
  const isSudoable = await execAsync(`sudo -nv`)
    .then(() => true)
    .catch(() => false);
  if (!isSudoable) {
    process.stdout.write('맥 패스워드를 입력하세요\n');
  }
}
