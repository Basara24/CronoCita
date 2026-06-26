import { Request, Response } from 'express';
import { ContactStatus } from '@prisma/client';
import { contactsService } from './contacts.service';

export class ContactsController {
  create = async (req: Request, res: Response): Promise<void> => {
    const contact = await contactsService.create(req.body);
    res.status(201).json({ message: 'Mensagem enviada com sucesso!', id: contact.id });
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const { status } = req.query as Record<string, string | undefined>;
    res.json(await contactsService.list(status as ContactStatus | undefined));
  };

  updateStatus = async (req: Request, res: Response): Promise<void> => {
    res.json(await contactsService.updateStatus(req.params.id, req.body.status));
  };
}

export const contactsController = new ContactsController();
