import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Mail } from 'lucide-react';
import { api, apiErrorMessage } from '@/lib/api';
import { cn, formatDateTime } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import type { Contact } from '@/types';

type StatusFilter = 'ALL' | Contact['status'];

const STATUS_LABEL: Record<Contact['status'], string> = {
  NEW: 'Novo',
  READ: 'Lido',
  RESOLVED: 'Resolvido',
};

const STATUS_STYLE: Record<Contact['status'], string> = {
  NEW: 'bg-primary/10 text-primary',
  READ: 'bg-secondary text-secondary-foreground',
  RESOLVED: 'bg-mint/10 text-mint',
};

export function AdminContacts() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<StatusFilter>('ALL');

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['admin', 'contacts'],
    queryFn: async () => (await api.get<Contact[]>('/contacts')).data,
  });

  const statusMut = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Contact['status'] }) =>
      api.patch(`/contacts/${id}/status`, { status }),
    onSuccess: () => {
      toast.success('Status atualizado');
      queryClient.invalidateQueries({ queryKey: ['admin', 'contacts'] });
    },
    onError: (e) => toast.error('Erro', apiErrorMessage(e)),
  });

  const filtered = filter === 'ALL' ? contacts : contacts.filter((c) => c.status === filter);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Contatos (Fale Conosco)</h1>
        <p className="text-muted-foreground">Mensagens enviadas pelo site público.</p>
      </div>

      <div className="flex gap-2">
        {(['ALL', 'NEW', 'READ', 'RESOLVED'] as StatusFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              'rounded-full px-3 py-1 text-sm transition-colors',
              filter === s ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground',
            )}
          >
            {s === 'ALL' ? 'Todos' : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <Mail className="h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-medium">Nenhum contato</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <Card key={c.id}>
              <CardContent className="space-y-2 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{c.subject}</p>
                    <p className="text-sm text-muted-foreground">
                      {c.name} · {c.email} · {formatDateTime(c.createdAt)}
                    </p>
                  </div>
                  <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_STYLE[c.status])}>
                    {STATUS_LABEL[c.status]}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-sm">{c.message}</p>
                <div className="flex gap-2 pt-1">
                  {(['NEW', 'READ', 'RESOLVED'] as Contact['status'][]).map((s) => (
                    <button
                      key={s}
                      disabled={c.status === s}
                      onClick={() => statusMut.mutate({ id: c.id, status: s })}
                      className={cn(
                        'rounded border px-2 py-1 text-xs transition-colors',
                        c.status === s ? 'cursor-default opacity-50' : 'hover:bg-secondary',
                      )}
                    >
                      Marcar como {STATUS_LABEL[s]}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
