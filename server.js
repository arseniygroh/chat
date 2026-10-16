import http from 'http';
import fs from 'fs';
import { WebSocketServer, WebSocket } from 'ws';

const PORT = 3001;

const server = http.createServer((req, res) => {
    if (req.url === '/' || req.url === '/index.html') {
        fs.readFile("./public/index.html", "utf-8", (err, data) => {
            if (err) {
                res.statusCode = 500;
                res.setHeader("Content-Type", "text/plain");
                res.end("Internal Server Error");
                return;
            }
            res.setHeader("Content-Type", "text/html");
            res.statusCode = 200;
            res.end(data);
        });
    } 
    else if (req.url === '/script.js') {
        fs.readFile("./public/script.js", "utf-8", (err, data) => {
            if (err) {
                res.statusCode = 404;
                res.setHeader("Content-Type", "text/plain");
                res.end("File Not Found");
                return;
            }
            res.setHeader("Content-Type", "application/javascript");
            res.statusCode = 200;
            res.end(data);
        });
    } 
    else {
        res.statusCode = 404;
        res.setHeader("Content-Type", "text/plain");
        res.end("Not Found");
    }
});

const wss = new WebSocketServer({ server });

wss.on('connection', (socket, req) => { 
    const username = new URL(req.url, `http://${req.headers.host}`).searchParams.get("username") || "Anonymous";
    
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ "type": "system", "text": `${username} joined` }));
      }
    });

    socket.on('message', (message) => {
        try {
            const { username, text } = JSON.parse(message);
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'chat', username, text }));
                }
            });
        } catch (e) {
            console.error("Error:", e.message);
        }
    });

    socket.on("close", () => {
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ "type": "system", "text": `${username} left` }));
            }
        });
    });
});

server.listen(PORT, () => {
    console.log(`Chat server running at http://localhost:${PORT}`);
});