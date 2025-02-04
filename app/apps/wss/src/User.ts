import { WebSocket } from "ws";
import client from "@repo/db/client";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_PASSWORD } from "./constants";

// Enhanced interfaces with more comprehensive type definitions
interface Position {
    x: number;
    y: number;
}

interface UserData {
    id: string;
    userId?: string;
    position: Position;
}

interface WSMessage<T = any> {
    type: string;
    payload: T;
    requestId?: string; // For tracking specific request-response pairs
}

// Detailed message type definitions
interface JoinPayload {
    spaceId: string;
    token: string;
}

interface MovePayload {
    x: number;
    y: number;
    userId: string;
}

interface ErrorPayload {
    message: string;
    code?: string;
}

export class User {
    public readonly id: string;
    public userId?: string;
    private spaceId?: string;
    private position: Position;
    private ws: WebSocket;

    constructor(ws: WebSocket) {
        this.id = this.generateUniqueId();
        this.position = { x: 0, y: 0 };
        this.ws = ws;
        this.initHandlers();
    }

    private generateUniqueId(): string {
        return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private async handleJoin(payload: JoinPayload, requestId?: string) {
        try {
            const decoded = this.validateToken(payload.token);

            const space = await this.validateSpace(payload.spaceId);

            this.userId = decoded.userId;
            this.spaceId = payload.spaceId;

            this.position = this.generateSpawnPosition(space);

            const roomManager = RoomManager.getInstance();
            roomManager.addUser(payload.spaceId, this);

            const responsePayload = {
                spawn: this.position,
                users: roomManager.getUsersInRoom(payload.spaceId, this.id)
            };

            this.send({
                type: "space-joined",
                payload: responsePayload,
                requestId
            });

            // Notify other users about new user
            roomManager.broadcast({
                type: "user-joined",
                payload: {
                    id: this.id,
                    userId: this.userId,
                    position: this.position
                }
            }, this, payload.spaceId);

        } catch (error) {
            this.handleError(error, requestId);
        }
    }

    private validateToken(token: string): JwtPayload {
        try {
            const decoded = jwt.verify(token, JWT_PASSWORD) as JwtPayload;
            if (!decoded.userId) {
                throw new Error("Invalid user token");
            }
            return decoded;
        } catch (error) {
            throw {
                message: "Authentication failed",
                code: "INVALID_TOKEN"
            };
        }
    }

    private async validateSpace(spaceId: string) {
        const space = await client.space.findFirst({
            where: { id: spaceId }
        });

        if (!space) {
            throw {
                message: "Space not found",
                code: "SPACE_NOT_FOUND"
            };
        }
        RoomManager.getInstance().spaceHeight = space.height
        RoomManager.getInstance().spaceWidth = space.width

        return space;
    }

    private generateSpawnPosition(space: any): Position {
        return {
            x: Math.floor(Math.random() * space.width),
            y: Math.floor(Math.random() * space.height)
        };
    }

    private async handleMove(payload: MovePayload, requestId?: string) {
        try {
            // Ensure user is in a space and has joined
            if (!this.spaceId) {
                throw {
                    message: "User not in a space",
                    code: "NOT_IN_SPACE"
                };
            }

            // Validate move within space boundaries
            if (
                payload.x < 0 ||
                payload.x >= RoomManager.getInstance().spaceWidth ||
                payload.y < 0 ||
                payload.y >= RoomManager.getInstance().spaceHeight
            ) {
                this.send({
                    type: "move-rejected",
                    payload: {
                        x: this.position.x,
                        y: this.position.y
                    }
                })
                return
            }

            const xDiff = Math.abs(this.position.x - payload.x);
            const yDiff = Math.abs(this.position.y - payload.y);

            if (!((xDiff === 1 && yDiff === 0) || (xDiff === 0 && yDiff === 1))) {
                this.send({
                    type: "move-rejected",
                    payload: {
                        x: this.position.x,
                        y: this.position.y
                    }
                })
                console.log("asdasdasdasd");
            }

            // If all validations pass, update position
            console.log("reaching after throwa")
            this.position = { x: payload.x, y: payload.y };

            // Send successful move confirmation
            this.send({
                type: "move-confirmed",
                payload: {
                    position: this.position,
                    userId: this.userId
                },
                requestId
            });

            // Broadcast movement to other users in the space
            RoomManager.getInstance().broadcast({
                type: "movement",
                payload: {
                    id: this.id,
                    userId: this.userId,
                    x: this.position.x,
                    y: this.position.y
                }
            }, this, this.spaceId);

        } catch (error) {
            this.handleError(error, requestId);
        }
    }

    private isValidMove(payload: MovePayload): boolean {
        const xDiff = Math.abs(this.position.x - payload.x);
        const yDiff = Math.abs(this.position.y - payload.y);

        // Allow only one-step movements (orthogonal)
        return (xDiff === 1 && yDiff === 0) || (xDiff === 0 && yDiff === 1);
    }

    private initHandlers() {
        this.ws.on("message", async (data) => {
            try {
                const message = JSON.parse(data.toString()) as WSMessage;
                // console.log(JSON.stringify(message,null,2))
                // console.log(JSON.stringify(this.position,null,2))

                switch (message.type) {
                    case "join":
                        await this.handleJoin(
                            message.payload as JoinPayload,
                            message.requestId
                        );
                        break;
                    case "move":
                        this.handleMove(
                            message.payload as MovePayload,
                            message.requestId
                        );
                        break;
                    default:
                        this.handleError({
                            message: `Unknown message type: ${message.type}`,
                            code: "UNKNOWN_MESSAGE_TYPE"
                        });
                }
            } catch (error) {
                this.handleError({
                    message: "Invalid message format",
                    code: "PARSE_ERROR"
                });
            }
        });

        this.ws.on("close", () => this.destroy());
        this.ws.on("error", (error) => {
            console.error("WebSocket error:", error);
            this.destroy();
        });
    }

    private handleError(error: any, requestId?: string) {
        const errorPayload: ErrorPayload = {
            message: error.message || "An unexpected error occurred",
            code: error.code || "UNKNOWN_ERROR"
        };

        this.send({
            type: "error",
            payload: errorPayload,
            requestId
        });

        if (error.message !== "Authentication failed") {
            this.ws.close();
        }
    }

    public destroy() {
        if (this.spaceId) {
            const roomManager = RoomManager.getInstance();
            roomManager.broadcast({
                type: "user-left",
                payload: {
                    id: this.id,
                    userId: this.userId
                }
            }, this, this.spaceId);
            roomManager.removeUser(this, this.spaceId);
        }
    }

    public send(message: WSMessage) {
        if (this.ws.readyState === WebSocket.OPEN) {
            try {
                this.ws.send(JSON.stringify(message));
            } catch (error) {
                console.error("Send error:", error);
            }
        }
    }

    public getPosition(): Position {
        return { ...this.position };
    }
}

export class RoomManager {
    private readonly rooms: Map<string, User[]> = new Map();
    public spaceWidth: number;
    public spaceHeight: number;
    private static instance: RoomManager;

    private constructor() {
        this.spaceWidth = 0;
        this.spaceHeight = 0;
    }

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

    public getUsersInRoom(spaceId: string, excludeUserId?: string): UserData[] {
        return (this.rooms.get(spaceId) ?? [])
            .filter(u => u.id !== excludeUserId)
            .map(u => ({
                id: u.id,
                userId: u.userId,
                position: u.getPosition()
            }));
    }

    public broadcast(message: WSMessage, sender: User, roomId: string) {
        // console.log(this.rooms,null,2)
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