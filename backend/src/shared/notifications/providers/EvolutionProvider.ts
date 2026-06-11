import { NotificationProvider } from '../NotificationProvider';

/**
 * Integração com a Evolution API (WhatsApp não-oficial).
 * Stub: pronto para a chamada HTTP real quando EVOLUTION_API_URL /
 * EVOLUTION_API_KEY forem configurados.
 */
export class EvolutionProvider implements NotificationProvider {
  readonly name = 'evolution';

  async send(recipient: string, message: string): Promise<void> {
    const apiUrl = process.env.EVOLUTION_API_URL;
    const apiKey = process.env.EVOLUTION_API_KEY;

    if (!apiUrl || !apiKey) {
      console.log(`[Evolution:stub] → ${recipient}: ${message}`);
      return;
    }

    // Chamada real à Evolution API:
    // await fetch(`${apiUrl}/message/sendText`, {
    //   method: 'POST',
    //   headers: { apikey: apiKey, 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ number: recipient, text: message }),
    // });
    console.log(`[Evolution] → ${recipient}: ${message}`);
  }
}
