import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';

interface GameParams {
    spaceId: string;
    token: string;
}

interface SpawnPoint {
    x: number;
    y: number;
}

interface User {
    id: string;
}

interface WSMessage {
    type: string;
    payload: {
        spaceId?: string;
        token?: string;
        spawn?: SpawnPoint;
        users?: User[];
        userId?: string;
        x?: number;
        y?: number;
    };
}

const SPRITE_WIDTH = 32;  // Adjust based on your sprite size
const SPRITE_HEIGHT = 32; // Adjust based on your sprite size

const GameComponent: React.FC = () => {
    const gameRef = useRef<HTMLDivElement>(null);
    const [params, setParams] = useState<GameParams>({ spaceId: '', token: '' });
    const [gameInstance, setGameInstance] = useState<Phaser.Game | null>(null);

    useEffect(() => {
        let ws: WebSocket | null = null;
        let game: Phaser.Game | null = null;
        let players: Map<string, Phaser.GameObjects.Sprite> = new Map();
        let playerSprite: Phaser.GameObjects.Sprite | null = null;
        let cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;
        let facing: 'front' | 'back' | 'side' = 'front';
        let lastDirection: 'left' | 'right' = 'right';

        const urlParams = new URLSearchParams(window.location.search);
        const spaceId = urlParams.get('spaceId') || '';
        const token = urlParams.get('token') || '';

        setParams({ spaceId, token });

        class MainScene extends Phaser.Scene {
            constructor() {
                super({ key: 'MainScene' });
            }

            preload(): void {
                // Load the character sprite sheet
                this.load.spritesheet('character', '/sprites/hero-sheet.png', {
                    frameWidth: SPRITE_WIDTH,
                    frameHeight: SPRITE_HEIGHT
                });

                // Create a temporary colored rectangle for tiles
                const tileGraphics = this.add.graphics();
                tileGraphics.fillStyle(0x333333);
                tileGraphics.fillRect(0, 0, 32, 32);
                tileGraphics.generateTexture('tiles', 32, 32);
                tileGraphics.destroy();
            }

            create(): void {
                // Create animations for each direction
                this.anims.create({
                    key: 'walk-front',
                    frames: this.anims.generateFrameNumbers('character', { 
                        frames: [0, 1, 2]  // Adjust frame numbers based on your sprite sheet
                    }),
                    frameRate: 8,
                    repeat: -1
                });

                this.anims.create({
                    key: 'walk-back',
                    frames: this.anims.generateFrameNumbers('character', { 
                        frames: [3, 4, 5]  // Adjust frame numbers based on your sprite sheet
                    }),
                    frameRate: 8,
                    repeat: -1
                });

                this.anims.create({
                    key: 'walk-side',
                    frames: this.anims.generateFrameNumbers('character', { 
                        frames: [6, 7, 8]  // Adjust frame numbers based on your sprite sheet
                    }),
                    frameRate: 8,
                    repeat: -1
                });

                this.anims.create({
                    key: 'idle-front',
                    frames: this.anims.generateFrameNumbers('character', { 
                        frames: [1]  // Adjust frame number based on your sprite sheet
                    }),
                    frameRate: 1,
                    repeat: 0
                });

                this.anims.create({
                    key: 'idle-back',
                    frames: this.anims.generateFrameNumbers('character', { 
                        frames: [4]  // Adjust frame number based on your sprite sheet
                    }),
                    frameRate: 1,
                    repeat: 0
                });

                this.anims.create({
                    key: 'idle-side',
                    frames: this.anims.generateFrameNumbers('character', { 
                        frames: [7]  // Adjust frame number based on your sprite sheet
                    }),
                    frameRate: 1,
                    repeat: 0
                });

                // Create background grid
                for (let y = 0; y < 20; y++) {
                    for (let x = 0; x < 20; x++) {
                        const tile = this.add.sprite(x * 32, y * 32, 'tiles');
                        tile.setOrigin(0, 0);
                        tile.setAlpha(0.3);
                    }
                }

                try {
                    ws = new WebSocket('ws://localhost:3001');

                    ws.onopen = () => {
                        console.log('WebSocket Connected');
                        if (ws) {
                            ws.send(JSON.stringify({
                                type: 'join',
                                payload: { spaceId, token }
                            }));
                        }
                    };

                    ws.onmessage = (event: MessageEvent) => {
                        const message: WSMessage = JSON.parse(event.data);

                        switch (message.type) {
                            case 'space-joined':
                                if (message.payload.spawn) {
                                    const { x, y } = message.payload.spawn;
                                    playerSprite = this.add.sprite(x * 32, y * 32, 'character');
                                    playerSprite.play('idle-front');
                                }

                                message.payload.users?.forEach(user => {
                                    const otherPlayer = this.add.sprite(0, 0, 'character');
                                    otherPlayer.play('idle-front');
                                    players.set(user.id, otherPlayer);
                                });
                                break;

                            case 'user-joined':
                                if (message.payload.x !== undefined && message.payload.y !== undefined && message.payload.userId) {
                                    const newPlayer = this.add.sprite(
                                        message.payload.x * 32,
                                        message.payload.y * 32,
                                        'character'
                                    );
                                    newPlayer.play('idle-front');
                                    players.set(message.payload.userId, newPlayer);
                                }
                                break;

                            case 'movement':
                                if (message.payload.userId && message.payload.x !== undefined && message.payload.y !== undefined) {
                                    const player = players.get(message.payload.userId);
                                    if (player) {
                                        player.x = message.payload.x * 32;
                                        player.y = message.payload.y * 32;
                                    }
                                }
                                break;

                            case 'user-left':
                                if (message.payload.userId) {
                                    const leftPlayer = players.get(message.payload.userId);
                                    if (leftPlayer) {
                                        leftPlayer.destroy();
                                        players.delete(message.payload.userId);
                                    }
                                }
                                break;

                            case 'movement-rejected':
                                if (playerSprite && message.payload.x !== undefined && message.payload.y !== undefined) {
                                    playerSprite.x = message.payload.x * 32;
                                    playerSprite.y = message.payload.y * 32;
                                }
                                break;
                        }
                    };
                } catch (error) {
                    console.error('Error setting up WebSocket:', error);
                }

                cursors = this.input.keyboard.createCursorKeys();
            }

            update(): void {
                if (!playerSprite || !cursors || !ws) return;

                const currentX = Math.floor(playerSprite.x / 32);
                const currentY = Math.floor(playerSprite.y / 32);
                let isMoving = false;

                if (cursors.left.isDown) {
                    ws.send(JSON.stringify({
                        type: 'move',
                        payload: { x: currentX - 1, y: currentY }
                    }));
                    facing = 'side';
                    lastDirection = 'left';
                    playerSprite.flipX = true;
                    isMoving = true;
                }
                else if (cursors.right.isDown) {
                    ws.send(JSON.stringify({
                        type: 'move',
                        payload: { x: currentX + 1, y: currentY }
                    }));
                    facing = 'side';
                    lastDirection = 'right';
                    playerSprite.flipX = false;
                    isMoving = true;
                }
                else if (cursors.up.isDown) {
                    ws.send(JSON.stringify({
                        type: 'move',
                        payload: { x: currentX, y: currentY - 1 }
                    }));
                    facing = 'back';
                    isMoving = true;
                }
                else if (cursors.down.isDown) {
                    ws.send(JSON.stringify({
                        type: 'move',
                        payload: { x: currentX, y: currentY + 1 }
                    }));
                    facing = 'front';
                    isMoving = true;
                }

                // Update animation based on movement state
                if (isMoving) {
                    playerSprite.play(`walk-${facing}`, true);
                } else {
                    playerSprite.play(`idle-${facing}`, true);
                }
            }
        }

        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            parent: gameRef.current,
            width: 640,
            height: 640,
            backgroundColor: '#2d2d2d',
            scene: MainScene,
            pixelArt: true,
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { y: 0, x: 0 }
                }
            },
            audio: {
                noAudio: true
            }
        };

        game = new Phaser.Game(config);
        setGameInstance(game);

        return () => {
            if (game) {
                game.destroy(true);
            }
            if (ws) {
                ws.close();
            }
        };
    }, []);

    return (
        <div className="w-full max-w-4xl mx-auto p-4">
            <div className="aspect-square bg-gray-800 rounded-lg overflow-hidden" ref={gameRef} />
        </div>
    );
};

export default GameComponent;