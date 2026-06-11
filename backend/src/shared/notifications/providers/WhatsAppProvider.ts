import { NotificationProvider } from '../NotificationProvider';

/**
 * Integração com a WhatsApp Cloud API (Meta).
 * Stub: pronto para receber a chamada HTTP real quando as credenciais
 * (WHATSAPP_API_URL / WHATSAPP_API_TOKEN) forem configuradas.
 */
export class WhatsAppProvider implements NotificationProvider {
  readonly name = 'whatsapp';

  async send(recipient: string, message: string): Promise<void> {
    const apiUrl = process.env.WHATSAPP_API_URL;
    const token = process.env.WHATSAPP_API_TOKEN;

    if (!apiUrl || !token) {
      console.log(`[WhatsApp:stub] → ${recipient}: ${message}`);
      return;
    }

    // Chamada real à WhatsApp Cloud API:
    // await fetch(`${apiUrl}/messages`, {
    //   method: 'POST',
    //   headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ to: recipient, type: 'text', text: { body: message } }),
    // });
    console.log(`[WhatsApp] → ${recipient}: ${message}`);
  }
}
