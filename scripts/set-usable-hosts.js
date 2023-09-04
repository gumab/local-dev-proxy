/** @type {string[]} */
const usableHosts = require('../usable-hosts.json');
const { readFile, writeFile } = require('fs');

console.log(usableHosts);

const certConfigFile = './packages/server/keys/cert.config';

readFile(certConfigFile, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading the file:', err);
    return;
  }

  const lines = data.split('\n'); // 개행으로 나눈 각 줄 배열로 저장

  const first = lines.findIndex((line) => line.startsWith('DNS.'));
  const last = lines.findLastIndex((line) => line.startsWith('DNS.'));

  const list = usableHosts.map((x, idx) => `DNS.${idx + 1} = ${x}`);

  const modifiedLines = [...lines.slice(0, first), ...list, ...lines.slice(last + 1)];

  const modifiedContent = modifiedLines.join('\n'); // 수정된 줄들을 다시 개행으로 연결하여 문자열로 생성

  writeFile(certConfigFile, modifiedContent, 'utf8', (err) => {
    if (err) {
      console.error('Error writing to the file:', err);
      return;
    }
    console.log('File has been successfully updated.');
  });
});

const constFile = './packages/launcher/src/consts/usable-hosts.ts';

readFile(constFile, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading the file:', err);
    return;
  }

  const lines = data.split('\n'); // 개행으로 나눈 각 줄 배열로 저장

  const first = lines.findIndex((line) => line.includes('contents-start'));
  const last = lines.findLastIndex((line) => line.includes('contents-end'));

  const list = usableHosts.map((x, idx) => `/^${x.replace(/\./g, '\\.').replace('*', '\\w*')}$/,`);

  const modifiedLines = [...lines.slice(0, first + 1), ...list, ...lines.slice(last)];

  const modifiedContent = modifiedLines.join('\n'); // 수정된 줄들을 다시 개행으로 연결하여 문자열로 생성

  writeFile(constFile, modifiedContent, 'utf8', (err) => {
    if (err) {
      console.error('Error writing to the file:', err);
      return;
    }
    console.log('File has been successfully updated.');
  });
});
