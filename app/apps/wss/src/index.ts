import { WebSocketServer, WebSocket } from "ws";

const port: number = Number(process.env.PORT) || 3000;
const wss = new WebSocketServer({ port });

const rooms: Map<string, Set<WebSocket>> = new Map();

function handleJoin(ws: WebSocket, spaceId: string) {
    if (!rooms.has(spaceId)) {
        rooms.set(spaceId, new Set());
    }
    rooms.get(spaceId)!.add(ws);
    
    ws.send(JSON.stringify({
        type: "space-joined",
        payload: {
            message: `You've joined space ${spaceId}`,
            users: Array.from(rooms.get(spaceId)!.values()).map(socket => (socket as any).id),
        }
    }));

    console.log(`User joined space: ${spaceId}`);
}

function handleMove(ws: WebSocket, x: number, y: number) {
    ws.send(JSON.stringify({
        type: "movement",
        payload: { x, y }
    }));
    
    rooms.forEach((sockets, spaceId) => {
        if (sockets.has(ws)) {
            sockets.forEach(socket => {
                if (socket !== ws) {
                    socket.send(JSON.stringify({
                        type: "user-moved",
                        payload: { x, y, userId: (ws as any).id }
                    }));
                }
            });
        }
    });
}

wss.on("connection", (ws: WebSocket) => {
    console.log("User connected");

    ws.id = Math.random().toString(36).substr(2, 9); 

    ws.on("message", (data) => {
        const { type, payload } = JSON.parse(data.toString());
        try {
            switch (type) {
                case "join":
                    handleJoin(ws, payload.spaceId);
                    break;
                case "move":
                    handleMove(ws, payload.x, payload.y);
                    break;
                default:
                    console.log(`Unknown message type: ${type}`);
            }
        } catch (e) {
            console.error("Error processing message:", e);
        }
    });

    ws.on("close", () => {
        rooms.forEach((sockets, spaceId) => {
            if (sockets.has(ws)) {
                sockets.delete(ws);
                console.log(`User left space: ${spaceId}`);
            }
        });
    });
});

console.log(`WebSocket server is running on ws://localhost:${port}`);