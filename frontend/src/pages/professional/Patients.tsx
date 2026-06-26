import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MessageSquare, Phone } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import type { ProfessionalAppointment, ProfessionalPatient } from '@/types';

export function ProfessionalPatientsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [historyOf, setHistoryOf] = useState<ProfessionalPatient | null>(null);

  const highlightId = searchParams.get('highlight');

  const { data: patients = [], isLoading } = useQuery({
    queryKey: ['professional', 'patients'],
    queryFn: async () => (await api.get<ProfessionalPatient[]>('/professional/patients')).data,
  });

  const { data: highlightHistory = [] } = useQuery({
    queryKey: ['professional', 'patient-history', highlightId],
    queryFn: async () =>
      (await api.get<ProfessionalAppointment[]>(`/professional/patients/${highlightId}/history`)).data,
    enabled: !!highlightId,
  });

  const { data: history = [] } = useQuery({
    queryKey: ['professional', 'patient-history', historyOf?.id],
    queryFn: async () =>
      (await api.get<ProfessionalAppointment[]>(`/professional/patients/${historyOf!.id}/history`)).data,
    enabled: !!historyOf,
  });

  useEffect(() => {
    if (!highlightId) return;
    const fromList = patients.find((p) => p.id === highlightId);
    if (fromList) {
      setHistoryOf(fromList);
      return;
    }
    if (highlightHistory.length > 0) {
      const p = highlightHistory[0].patient;
      setHistoryOf({
        id: p.id,
        name: p.name,
        phone: p.phone,
        email: '',
        userId: p.userId ?? null,
        totalConsultations: highlightHistory.length,
        lastConsultation: highlightHistory[0].startsAt,
      });
    }
  }, [highlightId, patients, highlightHistory]);

  function closeHistory() {
    setHistoryOf(null);
    if (highlightId) setSearchParams({});
  }

  const filtered = patients.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Pacientes</h1>
        <p className="text-muted-foreground">Pacientes que você já atendeu.</p>
      </div>

      <Input placeholder="Buscar paciente..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground">Nenhum paciente encontrado.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <Card key={p.id} id={`patient-${p.id}`}>
              <CardContent className="space-y-2 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {p.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold">{p.name}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" /> {p.phone}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <span>Consultas: {p.totalConsultations}</span>
                  <span>Última: {p.lastConsultation ? formatDate(p.lastConsultation) : '—'}</span>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" onClick={() => setHistoryOf(p)}>
                    Ver histórico
                  </Button>
                  {p.userId && (
                    <Button size="sm" onClick={() => navigate(`/profissional/mensagens?with=${p.userId}`)}>
                      <MessageSquare className="h-4 w-4" /> Mensagem
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {historyOf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={closeHistory}>
          <div className="absolute inset-0 bg-black/50" />
          <Card className="relative z-10 max-h-[80vh] w-full max-w-lg overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardContent className="p-5">
              <h2 className="mb-3 text-lg font-semibold">Histórico — {historyOf.name}</h2>
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem registros.</p>
              ) : (
                <div className="divide-y">
                  {history.map((a) => (
                    <div key={a.id} className="flex items-center justify-between py-2 text-sm">
                      <div>
                        <p className="font-medium">{a.service.name}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(a.startsAt)}</p>
                      </div>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px]">{a.status}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 flex gap-2">
                {historyOf.userId && (
                  <Button
                    className="flex-1"
                    onClick={() => navigate(`/profissional/mensagens?with=${historyOf.userId}`)}
                  >
                    <MessageSquare className="h-4 w-4" /> Abrir Conversa
                  </Button>
                )}
                <Button variant="outline" className="flex-1" onClick={closeHistory}>
                  Fechar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
