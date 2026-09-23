import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MapPin, Building, Home, CheckCircle2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { ProjectDTO, UnitStatus } from '@realestate-crm/shared';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { UnitStatusBadge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCurrencyINR } from '@/lib/utils';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeBuildingId, setActiveBuildingId] = useState<string>('');

  const { data, isLoading } = useQuery<{ project: ProjectDTO }>({
    queryKey: ['project', id],
    queryFn: () => apiClient<{ project: ProjectDTO }>(`/api/properties/projects/${id}`),
  });

  const project = data?.project;

  // Set default active building tab
  React.useEffect(() => {
    if (project?.buildings && project.buildings.length > 0 && !activeBuildingId) {
      setActiveBuildingId(project.buildings[0].id);
    }
  }, [project, activeBuildingId]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center p-12 bg-white rounded-xl border">
        <p className="text-sm font-semibold text-slate-700">Project not found</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/properties')}>
          Back to Properties
        </Button>
      </div>
    );
  }

  const currentBuilding = project.buildings?.find((b) => b.id === activeBuildingId) || project.buildings?.[0];
  const units = currentBuilding?.units || [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/properties')}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">{project.name}</h2>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{project.location}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Building Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {project.buildings?.map((b) => (
          <button
            key={b.id}
            onClick={() => setActiveBuildingId(b.id)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              activeBuildingId === b.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {b.name} ({b.units?.length || 0} Units)
          </button>
        ))}
      </div>

      {/* Units in Current Building */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">
            Units in {currentBuilding?.name || 'Building'}
          </CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100 text-[11px]">
              <tr>
                <th className="px-5 py-3">Unit Number</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Booking Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {units.map((unit) => (
                <tr key={unit.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3.5 font-bold text-slate-900">Unit #{unit.unitNumber}</td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-700 text-[11px]">
                      {unit.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-bold text-slate-900">{formatCurrencyINR(unit.price)}</td>
                  <td className="px-5 py-3.5">
                    <UnitStatusBadge status={unit.status} size="sm" />
                  </td>
                  <td className="px-5 py-3.5">
                    {unit.booking ? (
                      <span className="text-slate-800 font-medium flex items-center gap-1 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Booked by {unit.booking.lead?.name}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
