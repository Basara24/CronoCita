import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Send } from 'lucide-react';
import { api, resolveAssetUrl } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { useAuth } from '@/lib/auth';
import { cn, formatTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import type { ChatMessage, ChatThread } from '@/types';

export function Chat() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const { data: threads = [] } = useQuery({
    queryKey: ['messages', 'threads'],
    queryFn: async () => (await api.get<ChatThread[]>('/messages/threads')).data,
    refetchInterval: 15_000,
  });

  const { data: conversation } = useQuery({
    queryKey: ['messages', 'conversation', selected],
    queryFn: async () =>
      (await api.get<{ user: ChatThread['user']; messages: ChatMessage[] }>(`/messages/${selected}`)).data,
    enabled: !!selected,
  });

  const sendMutation = useMutation({
    mutationFn: async () => (await api.post('/messages', { receiverId: selected, content: text.trim() })).data,
    onSuccess: () => {
      setText('');
      queryClient.invalidateQueries({ queryKey: ['messages', 'conversation', selected] });
      queryClient.invalidateQueries({ queryKey: ['messages', 'threads'] });
    },
  });

  // Tempo real: recebe novas mensagens e atualiza a conversa/threads
  useEffect(() => {
    const socket = getSocket();
    const handler = (message: ChatMessage) => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'threads'] });
      if (selected && (message.senderId === selected || message.receiverId === selected)) {
        queryClient.invalidateQueries({ queryKey: ['messages', 'conversation', selected] });
      }
    };
    socket.on('message:new', handler);
    return () => {
      socket.off('message:new', handler);
    };
  }, [queryClient, selected]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages.length]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Mensagens</h1>
        <p className="text-muted-foreground">Converse com {user?.role === 'PATIENT' ? 'os profissionais' : 'seus pacientes'}.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Lista de conversas */}
        <Card className="md:col-span-1">
          <CardContent className="space-y-1 p-2">
            {threads.map((t) => (
              <button
                key={t.user.id}
                data-cy="chat-thread"
                onClick={() => setSelected(t.user.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-secondary',
                  selected === t.user.id && 'bg-secondary',
                )}
              >
                {t.user.avatarUrl ? (
                  <img src={resolveAssetUrl(t.user.avatarUrl)} alt={t.user.name} className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {t.user.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t.user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{t.lastMessage}</p>
                </div>
                {t.unread > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                    {t.unread}
                  </span>
                )}
              </button>
            ))}
            {threads.length === 0 && (
              <p className="p-4 text-center text-sm text-muted-foreground">Nenhuma conversa ainda.</p>
            )}
          </CardContent>
        </Card>

        {/* Janela da conversa */}
        <Card className="flex min-h-[60vh] flex-col md:col-span-2">
          {selected ? (
            <>
              <div className="border-b p-4 font-semibold">{conversation?.user.name ?? '...'}</div>
              <div className="flex-1 space-y-2 overflow-y-auto p-4">
                {conversation?.messages.map((m) => {
                  const mine = m.senderId === user?.id;
                  return (
                    <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                      <div
                        data-cy="chat-message"
                        className={cn(
                          'max-w-[75%] rounded-lg px-3 py-2 text-sm',
                          mine ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground',
                        )}
                      >
                        <p>{m.content}</p>
                        <p className={cn('mt-1 text-[10px]', mine ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                          {formatTime(m.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>
              <form
                className="flex items-center gap-2 border-t p-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (text.trim()) sendMutation.mutate();
                }}
              >
                <Input
                  data-cy="chat-input"
                  placeholder="Digite sua mensagem..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                <Button type="submit" size="icon" data-cy="chat-send" disabled={sendMutation.isPending || !text.trim()}>
                  {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-muted-foreground">
              Selecione uma conversa para começar.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
