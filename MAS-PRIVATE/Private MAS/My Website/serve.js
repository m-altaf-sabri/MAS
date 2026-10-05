// Minimal static file server to run without npm/npm packages
const http = require('http');
const fs = require('fs');
const path = require('path');

const port = process.env.PORT || 5500;
const root = process.cwd();

const mime = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

http.createServer((req, res) => {
    let reqPath = decodeURIComponent(req.url.split('?')[0]);
    if (reqPath === '/') reqPath = '/index.html';
    const filePath = path.join(root, reqPath);

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'text/plain');
            res.end('Not Found');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const type = mime[ext] || 'application/octet-stream';
        res.setHeader('Content-Type', type + '; charset=utf-8');

        const stream = fs.createReadStream(filePath);
        stream.on('error', () => {
            res.statusCode = 500;
            res.end('Server Error');
        });
        stream.pipe(res);
    });
}).listen(port, () => {
    console.log(`Static server running at http://localhost:${port}/`);
});
