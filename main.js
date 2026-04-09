const http = require('node:http');
const fs = require('node:fs');
const { program } = require('commander');

program
  .requiredOption('-h, --host <host>', 'server host')
  .requiredOption('-p, --port <port>', 'server port')
  .requiredOption('-c, --cache <cache>', 'cache directory path');

program.parse(process.argv);

const { host, port, cache } = program.opts();

fs.mkdirSync(cache, { recursive: true });

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.end('Server is alive!!');
});

server.listen(parseInt(port), host, () => {
  console.log(`Server running at http://${host}:${port}`);
});