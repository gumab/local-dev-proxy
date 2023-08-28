const express = require('express');

const httpPort = 8888;

const app = express();

app.get('/', (req, res) => {
  res.send('Hello world!');
});

app.listen(httpPort, () => {
  console.log('HTTP server listening on port ' + httpPort);
});