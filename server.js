const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const PROJECTS_FILE = path.join(__dirname, 'projects.json');
const TEST_TASKS_FILE = path.join(__dirname, 'test_tasks.json');
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

// 读取项目数据
function readProjects() {
    try {
        const data = fs.readFileSync(PROJECTS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (e) {
        return [];
    }
}

// 保存项目数据
function writeProjects(projects) {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects, null, 4), 'utf-8');
}

// 读取测试任务数据
function readTestTasks() {
    try {
        const data = fs.readFileSync(TEST_TASKS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (e) {
        return [];
    }
}

// 保存测试任务数据
function writeTestTasks(tasks) {
    fs.writeFileSync(TEST_TASKS_FILE, JSON.stringify(tasks, null, 4), 'utf-8');
}

const server = http.createServer((req, res) => {
    // API: 获取项目列表
    if (req.url.startsWith('/api/projects') && req.method === 'GET') {
        const projects = readProjects();
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(projects));
        return;
    }

    // API: 保存项目列表
    if (req.url.startsWith('/api/projects') && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const projects = JSON.parse(body);
                writeProjects(projects);
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ success: true }));
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
        return;
    }

    // API: 获取测试任务列表
    if (req.url.startsWith('/api/test-tasks') && req.method === 'GET') {
        const tasks = readTestTasks();
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(tasks));
        return;
    }

    // API: 保存测试任务列表
    if (req.url.startsWith('/api/test-tasks') && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const tasks = JSON.parse(body);
                writeTestTasks(tasks);
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ success: true }));
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
        return;
    }

    // 静态文件服务 - 去除查询字符串
    let urlPath = req.url.split('?')[0];
    let filePath = path.join(__dirname, urlPath === '/' ? 'index.html' : urlPath);
    const extname = path.extname(filePath);
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.writeHead(404);
                res.end('404 Not Found');
            } else {
                res.writeHead(500);
                res.end('500 Internal Server Error');
            }
        } else {
            res.writeHead(200, {
                'Content-Type': contentType,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}/`);
});
