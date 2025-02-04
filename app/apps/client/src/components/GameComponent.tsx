import { useEffect, useRef, useState } from 'react';

// Comprehensive type definitions
interface User {
  id?: string;
  userId?: string;
  x: number;
  y: number;
}

interface Params {
  token: string;
  spaceId: string;
}

interface WSMessage<T = any> {
  type: string;
  payload: T;
  requestId?: string;
}

interface ErrorPayload {
  message: string;
  code?: string;
}

const Arena = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<Map<string, User>>(new Map());
  const [params, setParams] = useState<Params>({ token: '', spaceId: '' });
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [error, setError] = useState<string | null>(null);

  // Request tracking for potential future use
  const requestTracker = useRef({
    counter: 0,
    pendingRequests: new Map<string, (response: any) => void>()
  });

  // WebSocket connection setup
  const connectWebSocket = () => {
    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
    }

    // Extract parameters from URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const spaceId = urlParams.get('spaceId');

    // Validate parameters
    if (!token || !spaceId) {
      setError('Missing token or space ID');
      return;
    }

    setParams({ token, spaceId });

    // Create WebSocket connection
    wsRef.current = new WebSocket('ws://localhost:3001');
    const ws = wsRef.current;

    ws.onopen = () => {
      setConnectionStatus('connected');
      // Send join request immediately upon connection
      sendMessage('join', { spaceId, token });
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message);
      } catch (error) {
        console.error('Message parsing error:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('disconnected');
      setError('WebSocket connection failed');
    };

    ws.onclose = () => {
      setConnectionStatus('disconnected');
    };
  };

  // Send message with request tracking
  const sendMessage = <T = any>(type: string, payload: T): string => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    const requestId = `req_${requestTracker.current.counter++}`;

    wsRef.current.send(JSON.stringify({
      type,
      payload,
      requestId
    }));

    return requestId;
  };

  // Comprehensive message handler
  const handleWebSocketMessage = (message: WSMessage) => {
    // console.log('Received message:', JSON.stringify(message));
    console.log((users),"---------------------------");
    
    switch (message.type) {
      case 'space-joined':
        handleSpaceJoined(message.payload);
        break;
      case 'user-joined':
        handleUserJoined(message.payload);
        break;
      case 'movement':
        handleUserMovement(message.payload);
        break;
      case 'move-rejected':
        handleRejection(message.payload);
        break
      case 'move-confirmed':
        handleMoveConfirmed(message.payload);
        break;
      case 'user-left':
        handleUserLeft(message.payload);
        break;
      case 'error':
        handleError(message.payload);
        break;
    }
  };

  function handleRejection(payload: { x: number, y: number }) {
    setCurrentUser((prev) => ({
      ...prev,
      x: payload.x,
      y: payload.y
    }));
  }

  // Handle space join message
  const handleSpaceJoined = (payload: any) => {
    setCurrentUser({
      id: 'current_user',
      userId: payload.userId,
      x: payload.spawn.x,
      y: payload.spawn.y
    });

    // Populate existing users
    const newUsers = new Map<string, User>();
    payload.users.forEach((user: User) => {
      newUsers.set(user.id, user);
    });
    setUsers(newUsers);
  };

  // Handle new user joining
  const handleUserJoined = (payload: User) => {
    setUsers(prev => {
      const newUsers = new Map(prev);
      newUsers.set(payload.id, payload);
      return newUsers;
    });
  };

  // Handle user movement
  const handleUserMovement = (payload: User & { x: number; y: number }) => {
    setUsers(prev => {
      const newUsers = new Map(prev);
      newUsers.set(payload.id, {
        id: payload.id,
        userId: payload.userId,
        x: payload.x,
        y: payload.y
      });
      return newUsers;
    });
  };

  const handleMoveConfirmed = (payload: {
    position: { x: number; y: number },
    userId?: string
  }) => {

    setCurrentUser(prev => prev ? {
      ...prev,
      x: payload.position.x,
      y: payload.position.y
    } : null);
  };

  // Handle user leaving
  const handleUserLeft = (payload: { id: string }) => {
    setUsers(prev => {
      const newUsers = new Map(prev);
      newUsers.delete(payload.id);
      return newUsers;
    });
  };

  // Handle WebSocket errors
  const handleError = (payload: ErrorPayload) => {
    // Handle specific move-related errors
    if (payload.code === 'MOVE_OUT_OF_BOUNDS' ||
      payload.code === 'INVALID_MOVEMENT') {
      // Revert to previous position
      setCurrentUser(prev => {
        return prev ? {
          ...prev,
          x: prev.x,
          y: prev.y
        } : null;
      });
    }

    console.error('WebSocket Error:', payload);
    setError(payload.message);
  };

  // Initial connection setup
  useEffect(() => {
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const handleMove = (newX: number, newY: number) => {
    if (!currentUser) return;

    try {
      // Optimistically attempt move (for immediate UI feedback)
      setCurrentUser(prev => prev ? {
        ...prev,
        x: newX,
        y: newY
      } : null);

      // Send move request
      sendMessage('move', {
        x: newX,
        y: newY,
        userId: currentUser.userId
      });
    } catch (error) {
      console.error('Move failed:', error);
      setError('Failed to send move');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!currentUser) return;

    const { x, y } = currentUser;
    switch (e.key) {
      case 'ArrowUp':
        handleMove(x, y - 1);
        break;
      case 'ArrowDown':
        handleMove(x, y + 1);
        break;
      case 'ArrowLeft':
        handleMove(x - 1, y);
        break;
      case 'ArrowRight':
        handleMove(x + 1, y);
        break;
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#eee';
    for (let i = 0; i < canvas.width; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 50) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // Draw current user
    if (currentUser) {
      ctx.beginPath();
      ctx.fillStyle = '#FF6B6B';
      ctx.arc(currentUser.x * 50, currentUser.y * 50, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('You', currentUser.x * 50, currentUser.y * 50 + 40);
    }

    // Draw other users
    users.forEach(user => {
      // Skip drawing the current user again
      if (user.id === currentUser?.id) return;

      ctx.beginPath();
      ctx.fillStyle = '#4ECDC4';
      ctx.arc(user.x * 50, user.y * 50, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`User ${user.id}`, user.x * 50, user.y * 50 + 40);
    });
  }, [currentUser, users, canvasRef]);

  return (
    <div
      className="p-4 min-h-screen flex flex-col"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <h1 className="text-2xl font-bold mb-4">Arena</h1>

      {/* Connection and Error Handling */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Connection Status:
          <span
            className={`ml-2 ${connectionStatus === 'connected'
              ? 'text-green-500'
              : 'text-red-500'
              }`}
          >
            {connectionStatus}
          </span>
        </p>
        {error && (
          <p className="text-sm text-red-500 mt-2">
            Error: {error}
          </p>
        )}
        <p className="text-sm text-gray-600">Token: {params.token}</p>
        <p className="text-sm text-gray-600">Space ID: {params.spaceId}</p>
        <p className="text-sm text-gray-600">
          Connected Users: {users.size + (currentUser ? 1 : 0)}
        </p>
      </div>

      {/* Canvas Rendering */}
      <div className="flex-grow border rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          width={2000}
          height={2000}
          className="bg-white w-full h-full"
        />
      </div>

      <p className="mt-2 text-sm text-gray-500">
        Use arrow keys to move your avatar
      </p>
    </div>
  );
};

export default Arena;