import { Request, Response } from 'express';
import { messagesService } from './messages.service';

export class MessagesController {
  threads = async (req: Request, res: Response): Promise<void> => {
    res.json(await messagesService.listThreads(req.user!.id));
  };

  conversation = async (req: Request, res: Response): Promise<void> => {
    res.json(await messagesService.getConversation(req.user!.id, req.params.withUserId));
  };

  send = async (req: Request, res: Response): Promise<void> => {
    const { receiverId, content, appointmentId } = req.body;
    res.status(201).json(await messagesService.send(req.user!.id, receiverId, content, appointmentId));
  };
}

export const messagesController = new MessagesController();
