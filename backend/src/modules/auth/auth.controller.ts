import { Request, Response } from 'express';
import { AuthService } from './auth.service';

export class AuthController {
  constructor(private readonly service: AuthService) {}

  login = async (req: Request, res: Response): Promise<void> => {
    const result = await this.service.login(req.body);
    res.json(result);
  };

  register = async (req: Request, res: Response): Promise<void> => {
    const result = await this.service.register(req.body);
    res.status(201).json(result);
  };

  refresh = async (req: Request, res: Response): Promise<void> => {
    const result = await this.service.refresh(req.body);
    res.json(result);
  };

  forgotPassword = async (req: Request, res: Response): Promise<void> => {
    const result = await this.service.forgotPassword(req.body);
    res.json({
      message: 'Se o e-mail existir, um link de recuperação será enviado.',
      ...result,
    });
  };

  resetPassword = async (req: Request, res: Response): Promise<void> => {
    await this.service.resetPassword(req.body);
    res.json({ message: 'Senha alterada com sucesso.' });
  };
}
