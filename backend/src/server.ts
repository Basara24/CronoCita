import 'dotenv/config';
import http from 'node:http';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import { createApp } from './app';
import { authConfig } from './shared/utils/authConfig';
import { setIO, userRoom } from './shared/realtime/io';
import { startReminderJobs } from './modules/notifications/reminderJobs';

const port = Number(process.env.PORT ?? 3333);

const server = http.createServer(createApp());

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// Handshake autenticado: o cliente envia o access token em handshake.auth.token
io.use((socket, next) => {
  const token = socket.handshake.auth?.token as string | undefined;
  if (!token) {
    next(new Error('Token não informado'));
    return;
  }
  try {
    const payload = jwt.verify(token, authConfig.jwtSecret) as { sub: string };
    socket.data.userId = payload.sub;
    next();
  } catch {
    next(new Error('Token inválido'));
  }
});

io.on('connection', (socket) => {
  const userId = socket.data.userId as string;
  socket.join(userRoom(userId));
});

setIO(io);

server.listen(port, () => {
  console.log(`🏥 CronoCita API rodando em http://localhost:${port}`);
  startReminderJobs();
});
