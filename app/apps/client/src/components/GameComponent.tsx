import { useEffect, useRef, useState } from 'react'
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react'

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

  const requestTracker = useRef({
    counter: 0,
    pendingRequests: new Map<string, (response: any) => void>()
  });

  const connectWebSocket = () => {

    if (wsRef.current) {
      wsRef.current.close();
    }

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const spaceId = urlParams.get('spaceId');

    if (!token || !spaceId) {
      setError('Missing token or space ID');
      return;
    }

    setParams({ token, spaceId });

    wsRef.current = new WebSocket('ws://localhost:3001');
    const ws = wsRef.current;

    ws.onopen = () => {
      setConnectionStatus('connected');
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

  const handleSpaceJoined = (payload: any) => {
    setCurrentUser({
      id: 'current_user',
      userId: payload.userId,
      x: payload.spawn.x,
      y: payload.spawn.y
    });

    const newUsers = new Map<string, User>();
    payload.users.forEach((user: User) => {
      newUsers.set(user.id as string, user);
    });
    setUsers(newUsers);
  };

  // Handle new user joining
  const handleUserJoined = (payload: User) => {
    setUsers(prev => {
      const newUsers = new Map(prev);
      newUsers.set(payload.id as string, payload);
      return newUsers;
    });
  };

  const handleUserMovement = (payload: User & { x: number; y: number }) => {
    setUsers(prev => {
      const newUsers = new Map(prev);
      newUsers.set(payload.id as string, {
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
      setCurrentUser(prev => prev ? {
        ...prev,
        x: newX,
        y: newY
      } : null);

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

    ctx.strokeStyle = '#eee';
    for (let i = 0; i < canvas.width; i += 30) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 30) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

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

    users.forEach(user => {
      if (user.id === currentUser?.id) return;

      ctx.beginPath();
      ctx.fillStyle = '#4ECDC4';
      ctx.arc(user.x * 50, user.y * 50, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`User ${user.userId}`, user.x * 50, user.y * 50 + 40);
    });
  }, [currentUser, users, canvasRef]);

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-8"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl">
        <div className="p-8">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold text-gray-800">Arena</h1>
            <div
              className={`px-4 py-2 rounded-full text-sm font-medium ${connectionStatus === "connected"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
                }`}
            >
              {connectionStatus}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-red-600">Error: {error}</p>
            </div>
          )}

          {/* Info Grid */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Token</p>
              <p className="text-gray-800 truncate">{params.token}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Space ID</p>
              <p className="text-gray-800 truncate">{params.spaceId}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Connected Users</p>
              <p className="text-gray-800">{users.size + (currentUser ? 1 : 0)}</p>
            </div>
          </div>

          {/* Canvas Section */}
          <div className="relative rounded-xl overflow-hidden border-2 border-gray-200">
            <canvas
              ref={canvasRef}
              width={2000}
              height={2000}
              className="bg-white w-full h-[65vh]"
            />

            {/* Controls Overlay */}
            <div className="absolute bottom-6 right-6 bg-white rounded-xl shadow-lg p-4 bg-opacity-90">
              <p className="text-sm font-medium text-gray-700 mb-3 text-center">
                Use arrow keys to move
              </p>
              <div className="flex flex-col items-center gap-2">
                <ArrowUp className="w-6 h-6 text-gray-700" />
                <div className="flex gap-6">
                  <ArrowLeft className="w-6 h-6 text-gray-700" />
                  <ArrowDown className="w-6 h-6 text-gray-700" />
                  <ArrowRight className="w-6 h-6 text-gray-700" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Arena;