import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';

const GameComponent = () => {
    const gameRef = useRef(null);
    const [params, setParams] = useState<{ spaceId: string, token: string }>({ spaceId: '', token: '' })

    useEffect(() => {
        let ws: WebSocket | null = null;
        let game = null;
        let players = new Map();
        let playerSprite = null;
        let cursors = null;


        const urlParams = new URLSearchParams(window.location.search);
        const spaceId = urlParams.get('spaceId') || "";
        const token = urlParams.get('token') || "";

        setParams({ spaceId, token })

        class MainScene extends Phaser.Scene {
            constructor() {
                super({ key: 'MainScene' });
            }

            preload() {
                // Load assets
                this.load.image('tiles', '/api/placeholder/32/32');
                this.load.spritesheet('character', '/api/placeholder/144/48', {
                    frameWidth: 48,
                    frameHeight: 48
                });
            }

            create() {
                // Create tilemap for the arena
                const level = [];
                for (let y = 0; y < 20; y++) {
                    const row = [];
                    for (let x = 0; x < 20; x++) {
                        row.push(0);
                    }
                    level.push(row);
                }

                // Create animations
                this.anims.create({
                    key: 'idle',
                    frames: this.anims.generateFrameNumbers('character', { start: 0, end: 0 }),
                    frameRate: 10,
                    repeat: -1
                });

                this.anims.create({
                    key: 'walk',
                    frames: this.anims.generateFrameNumbers('character', { start: 1, end: 2 }),
                    frameRate: 10,
                    repeat: -1
                });

                // Initialize WebSocket connection
                ws = new WebSocket('ws://localhost:3001');

                ws.onopen = () => {
                    ws.send(JSON.stringify({
                        type: 'join',
                        payload: { spaceId: params.spaceId, token: params.token }
                    }));
                };

                ws.onmessage = (event) => {
                    const message = JSON.parse(event.data);

                    switch (message.type) {
                        case 'space-joined':
                            // Create player at spawn position
                            const { x, y } = message.payload.spawn;
                            playerSprite = this.add.sprite(x * 32, y * 32, 'character');
                            playerSprite.setScale(0.6);
                            playerSprite.play('idle');

                            // Create other players
                            message.payload.users.forEach(user => {
                                const otherPlayer = this.add.sprite(0, 0, 'character');
                                otherPlayer.setScale(0.6);
                                otherPlayer.play('idle');
                                players.set(user.id, otherPlayer);
                            });
                            break;

                        case 'user-joined':
                            const newPlayer = this.add.sprite(
                                message.payload.x * 32,
                                message.payload.y * 32,
                                'character'
                            );
                            newPlayer.setScale(0.6);
                            newPlayer.play('idle');
                            players.set(message.payload.userId, newPlayer);
                            break;

                        case 'movement':
                            const player = players.get(message.payload.userId);
                            if (player) {
                                player.x = message.payload.x * 32;
                                player.y = message.payload.y * 32;
                                player.play('walk', true);
                            }
                            break;

                        case 'user-left':
                            const leftPlayer = players.get(message.payload.userId);
                            if (leftPlayer) {
                                leftPlayer.destroy();
                                players.delete(message.payload.userId);
                            }
                            break;

                        case 'movement-rejected':
                            if (playerSprite) {
                                playerSprite.x = message.payload.x * 32;
                                playerSprite.y = message.payload.y * 32;
                            }
                            break;
                    }
                };

                // Set up keyboard controls
                cursors = this.input.keyboard.createCursorKeys();
            }

            update() {
                if (!playerSprite || !cursors) return;

                const currentX = Math.floor(playerSprite.x / 32);
                const currentY = Math.floor(playerSprite.y / 32);

                if (cursors.left.isDown) {
                    ws.send(JSON.stringify({
                        type: 'move',
                        payload: { x: currentX - 1, y: currentY }
                    }));
                    playerSprite.flipX = true;
                    playerSprite.play('walk', true);
                }
                else if (cursors.right.isDown) {
                    ws.send(JSON.stringify({
                        type: 'move',
                        payload: { x: currentX + 1, y: currentY }
                    }));
                    playerSprite.flipX = false;
                    playerSprite.play('walk', true);
                }
                else if (cursors.up.isDown) {
                    ws.send(JSON.stringify({
                        type: 'move',
                        payload: { x: currentX, y: currentY - 1 }
                    }));
                    playerSprite.play('walk', true);
                }
                else if (cursors.down.isDown) {
                    ws.send(JSON.stringify({
                        type: 'move',
                        payload: { x: currentX, y: currentY + 1 }
                    }));
                    playerSprite.play('walk', true);
                }
                else {
                    playerSprite.play('idle', true);
                }
            }
        }

        const config = {
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
                    gravity: { y: 0 }
                }
            }
        };

        game = new Phaser.Game(config);

        return () => {
            if (game) {
                game.destroy(true);
            }
            if (ws) {
                ws.close();
            }
        };
    }, [params.spaceId, params.token]);

    return (
        <div className="w-full max-w-4xl mx-auto p-4">
            <div className="aspect-square bg-gray-800 rounded-lg overflow-hidden" ref={gameRef} />
        </div>
    );
};

export default GameComponent;