import { WebSocketServer } from 'ws';
import { User } from './User';

const PORT = 3001;

const wss = new WebSocketServer({ port: PORT });

wss.on('connection', (ws) => {
    console.log("ws server started on port: ", PORT);
    let user = new User(ws);
    ws.on('error', console.error);

    ws.on('close', () => {
        user?.destroy();
    });

});