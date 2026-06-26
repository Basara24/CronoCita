import { normalizePhoneForWhatsApp } from '../phone';
import { EvolutionProvider } from '../providers/EvolutionProvider';

describe('normalizePhoneForWhatsApp', () => {
  it('adiciona DDI 55 em número local com DDD', () => {
    expect(normalizePhoneForWhatsApp('(44) 97777-0001')).toBe('5544977770001');
  });

  it('mantém número que já tem DDI', () => {
    expect(normalizePhoneForWhatsApp('+55 44 97777-0001')).toBe('5544977770001');
  });

  it('remove zero à esquerda de discagem', () => {
    expect(normalizePhoneForWhatsApp('044977770001')).toBe('5544977770001');
  });
});

describe('EvolutionProvider', () => {
  const originalFetch = global.fetch;
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    global.fetch = jest.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
  });

  it('usa stub quando credenciais não estão configuradas', async () => {
    delete process.env.EVOLUTION_API_URL;
    delete process.env.EVOLUTION_API_KEY;
    const logSpy = jest.spyOn(console, 'log').mockImplementation();

    await new EvolutionProvider().send('(44) 97777-0001', 'Olá');

    expect(global.fetch).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('[Evolution:stub]'));
    logSpy.mockRestore();
  });

  it('envia mensagem via Evolution API quando configurado', async () => {
    process.env.EVOLUTION_API_URL = 'http://evolution:8080';
    process.env.EVOLUTION_API_KEY = 'secret-key';
    process.env.EVOLUTION_INSTANCE = 'cronocita';

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ key: { id: 'msg-1' } }),
    });

    await new EvolutionProvider().send('(44) 97777-0001', 'Consulta confirmada');

    expect(global.fetch).toHaveBeenCalledWith(
      'http://evolution:8080/message/sendText/cronocita',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ apikey: 'secret-key' }),
        body: JSON.stringify({
          number: '5544977770001',
          text: 'Consulta confirmada',
          linkPreview: false,
        }),
      }),
    );
  });

  it('propaga erro quando a API retorna falha', async () => {
    process.env.EVOLUTION_API_URL = 'http://evolution:8080';
    process.env.EVOLUTION_API_KEY = 'secret-key';

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => ({ message: 'Instância desconectada' }),
    });

    await expect(new EvolutionProvider().send('44977770001', 'Teste')).rejects.toThrow(
      'Evolution API 400: Instância desconectada',
    );
  });
});
