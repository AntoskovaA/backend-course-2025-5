const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { program } = require('commander');
const superagent = require('superagent');

program
    .requiredOption('-h, --host <host>', 'server host')
    .requiredOption('-p, --port <port>', 'server port')
    .requiredOption('-c, --cache <cache>', 'cache directory path');

program.parse(process.argv);

const { host, port, cache } = program.opts();

fs.mkdirSync(cache, { recursive: true });

async function handleGet(filePath, code, res) {
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
}

async function handlePut(filePath, req, res) {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', async () => {
        await fs.promises.writeFile(filePath, Buffer.concat(chunks));
        res.statusCode = 201;
        res.end('Created');
    });
}

async function handleDelete(filePath, res) {
    try {
        await fs.promises.unlink(filePath);
        res.statusCode = 200;
        res.end('Deleted');
    } catch {
        res.statusCode = 404;
        res.end('Not found');
    }
}

const server = http.createServer(async (req, res) => {
    const code = req.url.slice(1);
    const filePath = path.join(cache, `${code}.jpg`);

    if (req.method === 'GET') {
        await handleGet(filePath, code, res);
    } else if (req.method === 'PUT') {
        await handlePut(filePath, req, res);
    } else if (req.method === 'DELETE') {
        await handleDelete(filePath, res);
    } else {
        res.statusCode = 405;
        res.end('Method not allowed');
    }
});

server.listen(parseInt(port), host, () => {
    console.log(`Server running at http://${host}:${port}`);
});