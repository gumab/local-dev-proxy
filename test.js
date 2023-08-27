// const {registerNextJs} = require('.');
//
// registerNextJs({
//   host: 'event.local.kurly.com',
// });


// stdout을 임시로 저장할 배열 생성
const stdoutBuffer = [];

// stdout을 저장하는 기존 스트림 저장
const originalStdoutWrite = process.stdout.write;

// process.stdout.write를 오버라이드하여 출력을 캡처하도록 함
process.stdout.write = (chunk, encoding, callback) => {
  // stdout을 임시 배열에 저장
  stdoutBuffer.push(chunk.toString());

  // 원래의 stdout.write 메서드 호출
  originalStdoutWrite.apply(process.stdout, [chunk, encoding, callback]);
};

// 이벤트 리스너 등록
process.on('exit', () => {
  console.log('Captured stdout:');
  console.log(stdoutBuffer.join(''));
});

// 예시 출력
console.log('Hello,');
console.log('this is a test');
console.log('of capturing stdout in Node.js');
