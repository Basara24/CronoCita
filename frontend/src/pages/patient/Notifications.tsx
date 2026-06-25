import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Calendar, Gift, MessageSquare, Info, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDateTime, cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { NotificationType, UserNotification } from '@/types';

const ICONS: Record<NotificationType, typeof Bell> = {
  APPOINTMENT: Calendar,
  REMINDER: Clock,
  CHAT: MessageSquare,
  PROMOTION: Gift,
  SYSTEM: Info,
};

export function PatientNotificationsPage() {
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['me', 'notifications'],
    queryFn: async () => (await api.get<UserNotification[]>('/me/notifications')).data,
  });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['me', 'notifications'] });
    queryClient.invalidateQueries({ queryKey: ['me', 'dashboard'] });
  }

  const markRead = useMutation({
    mutationFn: async (id: string) => api.patch(`/me/notifications/${id}/read`),
    onSuccess: invalidate,
  });

  const markAll = useMutation({
    mutationFn: async () => api.patch('/me/notifications/read-all'),
    onSuccess: invalidate,
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Central de Notificações</h1>
          <p className="text-muted-foreground">Toda a comunicação das clínicas com você.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => markAll.mutate()} disabled={markAll.isPending}>
          Marcar todas como lidas
        </Button>
      </div>

      <div className="space-y-2">
        {notifications.map((n) => {
          const Icon = ICONS[n.type] ?? Bell;
          return (
            <Card
              key={n.id}
              data-cy="notification"
              className={cn('transition-colors', !n.isRead && 'border-primary/40 bg-primary/5')}
            >
              <CardContent className="flex items-start gap-3 p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{n.title}</p>
                    {!n.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  </div>
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(n.createdAt)}</p>
                </div>
                {!n.isRead && (
                  <Button variant="ghost" size="sm" onClick={() => markRead.mutate(n.id)}>
                    Marcar lida
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}

        {notifications.length === 0 && (
          <p className="text-center text-muted-foreground">Nenhuma notificação por aqui.</p>
        )}
      </div>
    </div>
  );
}
