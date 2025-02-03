import { WebSocket } from "ws";
import client from "@repo/db/client";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_PASSWORD } from "./constants";

interface Position {
    x: number;
    y: number;
}

interface WSMessage {
    type: string;
    payload: any;
}

export class User {
    public readonly id: string;
    public userId?: string;
    private spaceId?: string;
    private position: Position;
    private ws: WebSocket;

    constructor(ws: WebSocket) {
        this.id = this.generateRandomString(10);
        this.position = { x: 0, y: 0 };
        this.ws = ws;
        this.initHandlers();
    }

    private generateRandomString(length: number): string {
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        return Array.from({ length }, () => 
            characters.charAt(Math.floor(Math.random() * characters.length))
        ).join('');
    }

    private async handleJoin(payload: { spaceId: string; token: string }) {
        try {
            const { userId } = jwt.verify(payload.token, JWT_PASSWORD) as JwtPayload;
            if (!userId) {
                throw new Error("Invalid user token");
            }

            const space = await client.space.findFirst({
                where: { id: payload.spaceId }
            });
            if (!space) {
                throw new Error("Space not found");
            }

            this.userId = userId;
            this.spaceId = payload.spaceId;
            this.position = {
                x: Math.floor(Math.random() * space.width),
                y: Math.floor(Math.random() * space.height)
            };
            console.log(JSON.stringify({
                type: "space-joined",
                payload: {
                    spawn: this.position,
                    users: RoomManager.getInstance().rooms.get(payload.spaceId)
                        ?.filter(u => u.id !== this.id)
                        ?.map(u => ({ 
                            id: u.id,
                            userId: u.userId,
                            position: u.getPosition()
                        })) ?? []
                }
            }));
            

            RoomManager.getInstance().addUser(payload.spaceId, this);

            this.send({
                type: "space-joined",
                payload: {
                    spawn: this.position,
                    users: RoomManager.getInstance().rooms.get(payload.spaceId)
                        ?.filter(u => u.id !== this.id)
                        ?.map(u => ({ 
                            id: u.id,
                            userId: u.userId,
                            position: u.getPosition()
                        })) ?? []
                }
            });

            // Notify others about the new user
            RoomManager.getInstance().broadcast({
                type: "user-joined",
                payload: {
                    id: this.id,
                    userId: this.userId,
                    position: this.position
                }
            }, this, payload.spaceId);

        } catch (error) {
            console.error("Join error:", error);
            this.send({ type: "error", payload: { message: "Failed to join space" } });
            this.ws.close();
        }
    }

    private handleMove(payload: { x: number; y: number }) {
        console.log(JSON.stringify(this.position),'-------------------',JSON.stringify(payload));
        
        const xDiff = Math.abs(this.position.x - payload.x);
        const yDiff = Math.abs(this.position.y - payload.y);

        // Validate movement (only allow one step at a time)
        if ((xDiff === 1 && yDiff === 0) || (xDiff === 0 && yDiff === 1)) {
            this.position = { x: payload.x, y: payload.y };
            
            if (this.spaceId) {
                RoomManager.getInstance().broadcast({
                    type: "movement",
                    payload: {
                        id: this.id,
                        position: this.position
                    }
                }, this, this.spaceId);
            }
        } else {
            // Reject invalid movement
            this.send({
                type: "movement-rejected",
                payload: { position: this.position }
            });
        }
    }

    private initHandlers() {
        this.ws.on("message", async (data) => {
            try {
                const message = JSON.parse(data.toString()) as WSMessage;
                
                switch (message.type) {
                    case "join":
                        await this.handleJoin(message.payload);
                        break;
                    case "move":
                        this.handleMove(message.payload);
                        break;
                    default:
                        console.warn(`Unknown message type: ${message.type}`);
                }
            } catch (error) {
                console.error("Message handling error:", error);
                this.send({ 
                    type: "error", 
                    payload: { message: "Invalid message format" } 
                });
            }
        });

        this.ws.on("close", () => {
            this.destroy();
        });

        this.ws.on("error", (error) => {
            console.error("WebSocket error:", error);
            this.destroy();
        });
    }

    public getPosition(): Position {
        return { ...this.position };
    }

    public destroy() {
        if (this.spaceId) {
            RoomManager.getInstance().broadcast({
                type: "user-left",
                payload: { id: this.id, userId: this.userId }
            }, this, this.spaceId);
            RoomManager.getInstance().removeUser(this, this.spaceId);
        }
    }

    public send(payload: any) {
        if (this.ws.readyState === WebSocket.OPEN) {
            try {
                this.ws.send(JSON.stringify(payload));
                
            } catch (error) {
                console.error("Send error:", error);
            }
        }
    }
}

export class RoomManager {
    public readonly rooms: Map<string, User[]> = new Map();
    private static instance: RoomManager;

    private constructor() {}

    public static getInstance(): RoomManager {
        if (!this.instance) {
            this.instance = new RoomManager();
        }
        return this.instance;
    }

    public removeUser(user: User, spaceId: string) {
        const room = this.rooms.get(spaceId);
        if (room) {
            this.rooms.set(spaceId, room.filter(u => u.id !== user.id));
            if (this.rooms.get(spaceId)?.length === 0) {
                this.rooms.delete(spaceId);
            }
        }
    }

    public addUser(spaceId: string, user: User) {
        const existingUsers = this.rooms.get(spaceId) ?? [];
        this.rooms.set(spaceId, [...existingUsers, user]);
    }

    public broadcast(message: any, sender: User, roomId: string) {
        const room = this.rooms.get(roomId);
        if (room) {
            room.forEach(user => {
                if (user.id !== sender.id) {
                    user.send(message);
                }
            });
        }
    }
}