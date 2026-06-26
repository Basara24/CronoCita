import { NotificationProvider } from '../NotificationProvider';
import { normalizePhoneForWhatsApp } from '../phone';

interface EvolutionErrorBody {
  message?: string | string[];
  error?: string;
  response?: { message?: string | string[] };
}

/**
 * Integração com a [Evolution API](https://doc.evolution-api.com/) (WhatsApp).
 * Usada apenas para notificações automáticas do CronoCita (agendamento, lembrete,
 * cancelamento). O chat in-app não passa por este provider.
 *
 * Variáveis de ambiente:
 * - EVOLUTION_API_URL   — base da API (ex.: http://localhost:8080)
 * - EVOLUTION_API_KEY   — chave global (header `apikey`)
 * - EVOLUTION_INSTANCE  — nome da instância conectada (padrão: cronocita)
 */
export class EvolutionProvider implements NotificationProvider {
  readonly name = 'evolution';

  async send(recipient: string, message: string): Promise<void> {
    const apiUrl = process.env.EVOLUTION_API_URL?.replace(/\/+$/, '');
    const apiKey = process.env.EVOLUTION_API_KEY;
    const instance = process.env.EVOLUTION_INSTANCE ?? 'cronocita';

    if (!apiUrl || !apiKey) {
      console.log(`[Evolution:stub] → ${recipient}: ${message}`);
      return;
    }

    const number = normalizePhoneForWhatsApp(recipient);
    const url = `${apiUrl}/message/sendText/${encodeURIComponent(instance)}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        apikey: apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        number,
        text: message,
        linkPreview: false,
      }),
    });

    const body = (await response.json().catch(() => ({}))) as EvolutionErrorBody;

    if (!response.ok) {
      const detail = extractEvolutionError(body) ?? response.statusText;
      throw new Error(`Evolution API ${response.status}: ${detail}`);
    }
  }
}

function extractEvolutionError(body: EvolutionErrorBody): string | undefined {
  const msg = body.message ?? body.response?.message ?? body.error;
  if (Array.isArray(msg)) return msg.join(', ');
  return msg;
}
