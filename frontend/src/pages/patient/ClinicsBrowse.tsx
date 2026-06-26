import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SkeletonCards } from '@/components/ui/skeleton';
import { ClinicCard } from '@/components/ClinicCard';
import type { PublicClinicSummary } from '@/types';

export function PatientClinicsPage() {
  const [params, setParams] = useSearchParams();
  const initialQ = params.get('q') ?? '';
  const [query, setQuery] = useState(initialQ);
  const activeQuery = params.get('q') ?? '';

  const { data, isLoading } = useQuery({
    queryKey: ['public', 'clinics', activeQuery],
    queryFn: async () => {
      const search = activeQuery ? `?q=${encodeURIComponent(activeQuery)}` : '';
      return (await api.get<PublicClinicSummary[]>(`/public/clinics${search}`)).data;
    },
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setParams(query.trim() ? { q: query.trim() } : {});
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Clínicas</h1>
        <p className="text-muted-foreground">Encontre clínicas por nome, cidade, especialidade, serviço ou profissional.</p>
      </div>

      <form onSubmit={submit} className="relative max-w-2xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar clínicas..." className="pl-9" />
        <Button type="submit" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2">
          Buscar
        </Button>
      </form>

      {isLoading ? (
        <SkeletonCards count={6} />
      ) : !data || data.length === 0 ? (
        <p className="py-12 text-center text-muted-foreground">Nenhuma clínica encontrada.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((c) => (
            <ClinicCard key={c.id} clinic={c} />
          ))}
        </div>
      )}
    </div>
  );
}
