import { Request, Response } from 'express';
import { AppError } from '../../shared/errors/AppError';
import { messagePublicUrl } from '../../shared/upload/multer';
import { messagesService } from './messages.service';

export class MessagesController {
  threads = async (req: Request, res: Response): Promise<void> => {
    res.json(await messagesService.listThreads(req.user!.id));
  };

  conversation = async (req: Request, res: Response): Promise<void> => {
    res.json(
      await messagesService.getConversation(req.user!.id, req.params.withUserId, req.user!.role),
    );
  };

  send = async (req: Request, res: Response): Promise<void> => {
    const { receiverId, content, appointmentId, attachmentUrl, isImportant } = req.body;
    res.status(201).json(
      await messagesService.send({
        senderId: req.user!.id,
        senderRole: req.user!.role,
        receiverId,
        content,
        appointmentId,
        attachmentUrl,
        isImportant,
      }),
    );
  };

  uploadAttachment = async (req: Request, res: Response): Promise<void> => {
    if (!req.file) throw new AppError('Nenhum arquivo enviado');
    res.status(201).json({ url: messagePublicUrl(req.file.filename) });
  };

  toggleImportant = async (req: Request, res: Response): Promise<void> => {
    res.json(await messagesService.toggleImportant(req.user!.id, req.params.id, req.body.isImportant));
  };
}

export const messagesController = new MessagesController();
