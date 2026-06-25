import { io, type Socket } from 'socket.io-client';
import { SERVER_URL, getAccessToken } from './api';

let socket: Socket | null = null;

/** Conexão Socket.IO singleton autenticada pelo access token atual. */
export function getSocket(): Socket {
  if (socket) return socket;
  socket = io(SERVER_URL, {
    autoConnect: true,
    auth: { token: getAccessToken() },
    transports: ['websocket', 'polling'],
  });
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
