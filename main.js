const http = require('node:http');
const fs = require('node:fs');
const { program } = require('commander');
const path = require('node:path');
const superagent = require('superagent');

program
    .requiredOption('-h, --host <host>', 'server host')
    .requiredOption('-p, --port <port>', 'server port')
    .requiredOption('-c, --cache <cache>', 'cache directory path');

program.parse(process.argv);

const { host, port, cache } = program.opts();

fs.mkdirSync(cache, { recursive: true });

const server = http.createServer(async (req, res) => {
    const code = req.url.slice(1);
    const filePath = path.join(cache, `${code}.jpg`);

    if (req.method === 'GET') {
        try {
            const file = await fs.promises.readFile(filePath);
            res.writeHead(200, { 'Content-Type': 'image/jpeg' });
            res.end(file);
        } catch {
            try {
                const response = await superagent.get(`https://http.cat/${code}`);
                await fs.promises.writeFile(filePath, response.body);
                res.writeHead(200, { 'Content-Type': 'image/jpeg' });
                res.end(response.body);
            } catch {
                res.statusCode = 404;
                res.end('Not found');
            }
        }

    } else if (req.method === 'PUT') {
        const chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', async () => {
            await fs.promises.writeFile(filePath, Buffer.concat(chunks));
            res.statusCode = 201;
            res.end('Created');
        });

    } else if (req.method === 'DELETE') {
        try {
            await fs.promises.unlink(filePath);
            res.statusCode = 200;
            res.end('Deleted');
        } catch {
            res.statusCode = 404;
            res.end('Not found');
        }

    } else {
        res.statusCode = 405;
        res.end('Method not allowed');
    }
});

server.listen(parseInt(port), host, () => {
    console.log(`Server running at http://${host}:${port}`);
});