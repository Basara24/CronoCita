import type { Server } from 'socket.io';

let io: Server | null = null;

export function setIO(server: Server): void {
  io = server;
}

/** Nome da room privada de um usuário (recebe eventos direcionados a ele). */
export function userRoom(userId: string): string {
  return `user:${userId}`;
}

/** Emite um evento para todas as conexões de um usuário, se o socket estiver ativo. */
export function emitToUser(userId: string, event: string, payload: unknown): void {
  io?.to(userRoom(userId)).emit(event, payload);
}
