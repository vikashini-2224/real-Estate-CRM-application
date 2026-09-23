import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Building,
  CalendarCheck,
  PhoneCall,
  MapPin,
  TrendingUp,
  Plus,
  ArrowRight,
  Clock,
  FilePlus,
  Phone,
  Star,
  Calendar,
  Handshake,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { DashboardStatsDTO, LeadStage } from '@realestate-crm/shared';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LeadStageBadge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCurrencyINR, formatCurrencyINRCompact, formatDate } from '@/lib/utils';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery<{ stats: DashboardStatsDTO }>({
    queryKey: ['dashboard-stats'],
    queryFn: () => apiClient<{ stats: DashboardStatsDTO }>('/api/dashboard/stats'),
    refetchInterval: 15000,
  });

  const stats = data?.stats;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-80 rounded-xl lg:col-span-2" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Active Leads',
      value: stats?.totalLeads || 0,
      sub: `${stats?.leadsByStage[LeadStage.NEW] || 0} newly registered`,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Site Visits Scheduled',
      value: stats?.siteVisitsCount || 0,
      sub: 'High-intent buyer tours',
      icon: MapPin,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Confirmed Bookings',
      value: stats?.totalBookings || 0,
      sub: `${formatCurrencyINRCompact(stats?.totalRevenue)} total volume`,
      icon: CalendarCheck,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      title: 'Available Units',
      value: `${stats?.availableUnits || 0} / ${stats?.totalUnits || 0}`,
      sub: `${(((stats?.availableUnits || 0) / (stats?.totalUnits || 1)) * 100).toFixed(0)}% available inventory`,
      icon: Building,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
  ];

  const stagesList = [
    { 
      stage: LeadStage.NEW, 
      label: 'New', 
      sub: 'Fresh inquiries',
      color: 'bg-gradient-to-r from-blue-400 to-blue-500',
      bgClass: 'bg-blue-50',
      textClass: 'text-blue-600',
      Icon: FilePlus 
    },
    { 
      stage: LeadStage.CONTACTED, 
      label: 'Contacted', 
      sub: 'Initial communication',
      color: 'bg-gradient-to-r from-indigo-400 to-indigo-500',
      bgClass: 'bg-indigo-50',
      textClass: 'text-indigo-600',
      Icon: Phone 
    },
    { 
      stage: LeadStage.INTERESTED, 
      label: 'Interested', 
      sub: 'Showing interest',
      color: 'bg-gradient-to-r from-amber-400 to-amber-500',
      bgClass: 'bg-amber-50',
      textClass: 'text-amber-600',
      Icon: Star 
    },
    { 
      stage: LeadStage.SITE_VISIT, 
      label: 'Site Visit', 
      sub: 'Property tours',
      color: 'bg-gradient-to-r from-purple-400 to-purple-500',
      bgClass: 'bg-purple-50',
      textClass: 'text-purple-600',
      Icon: Calendar 
    },
    { 
      stage: LeadStage.NEGOTIATION, 
      label: 'Negotiation', 
      sub: 'Price discussions',
      color: 'bg-gradient-to-r from-orange-400 to-orange-500',
      bgClass: 'bg-orange-50',
      textClass: 'text-orange-600',
      Icon: Handshake 
    },
    { 
      stage: LeadStage.BOOKED, 
      label: 'Booked', 
      sub: 'Successful conversions',
      color: 'bg-gradient-to-r from-emerald-400 to-emerald-500',
      bgClass: 'bg-emerald-50',
      textClass: 'text-emerald-600',
      Icon: CheckCircle 
    },
    { 
      stage: LeadStage.LOST, 
      label: 'Lost', 
      sub: 'Did not convert',
      color: 'bg-gradient-to-r from-red-400 to-red-500',
      bgClass: 'bg-red-50',
      textClass: 'text-red-600',
      Icon: XCircle 
    },
  ];

  const maxStageCount = Math.max(...Object.values(stats?.leadsByStage || { NEW: 1 }), 1);

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Sales & Inventory Command Center</h2>
          <p className="text-xs text-slate-500 mt-0.5">Real-time pipeline metrics and property allocation status</p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={() => navigate('/properties')} icon={<Building className="w-4 h-4" />}>
            View Units
          </Button>
          <Button size="sm" onClick={() => navigate('/leads')} icon={<Plus className="w-4 h-4" />}>
            Manage Leads
          </Button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Card key={idx} className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">{card.title}</p>
                <p className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">{card.value}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">{card.sub}</p>
              </div>
              <div className={`w-11 h-11 rounded-xl ${card.bgColor} ${card.color} flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Main Grid: Pipeline Funnel + Upcoming Follow-ups */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Funnel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Lead Pipeline Funnel</CardTitle>
              <p className="text-xs text-slate-500">Distribution of leads across conversion lifecycle</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/leads')} 
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium"
              icon={<ArrowRight className="w-4 h-4 text-blue-600" />}
            >
              View Pipeline
            </Button>
          </CardHeader>
          <CardContent className="space-y-6 pt-2 pb-6">
            {stagesList.map((item) => {
              const count = stats?.leadsByStage[item.stage] || 0;
              const percentage = ((count / (stats?.totalLeads || 1)) * 100).toFixed(0);
              const barWidth = `${percentage}%`;

              return (
                <div key={item.stage} className="flex items-center gap-4 group">
                  {/* Left: Icon and Labels */}
                  <div className="flex items-center gap-3.5 w-[220px] shrink-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.bgClass} ${item.textClass}`}>
                      <item.Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{item.label}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.sub}</p>
                    </div>
                  </div>

                  {/* Middle: Progress Bar */}
                  <div className="flex-1">
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${item.color} transition-all duration-500 ease-out`}
                        style={{ width: barWidth }}
                      />
                    </div>
                  </div>

                  {/* Right: Stats */}
                  <div className="flex items-center justify-end gap-5 w-[130px] shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">
                        {count} <span className="text-xs font-semibold text-slate-700">leads</span>
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">of {stats?.totalLeads || 0} total</p>
                    </div>
                    <div className={`w-12 py-1 rounded-full text-center text-[11px] font-bold ${item.bgClass} ${item.textClass}`}>
                      {percentage}%
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Priority Follow-ups */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Upcoming Follow-ups</CardTitle>
              <p className="text-xs text-slate-500">{stats?.followUpsCount || 0} scheduled actions</p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {stats?.upcomingFollowUps && stats.upcomingFollowUps.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {stats.upcomingFollowUps.map((lead) => (
                  <div
                    key={lead.id}
                    onClick={() => navigate(`/leads/${lead.id}`)}
                    className="p-3.5 hover:bg-slate-50 cursor-pointer transition-colors flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{lead.name}</p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <PhoneCall className="w-3 h-3 text-slate-400" />
                        <span>{lead.phone}</span>
                      </p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Clock className="w-3 h-3 text-amber-500" />
                        <span className="text-[11px] text-amber-700 font-medium">
                          {formatDate(lead.followUpDate)}
                        </span>
                      </div>
                    </div>
                    <LeadStageBadge stage={lead.stage} size="sm" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">
                No immediate pending follow-ups scheduled.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Leads Table */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Recent Leads</CardTitle>
            <p className="text-xs text-slate-500">Latest prospect acquisitions</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/leads')}>
            Explore All Leads
          </Button>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100 text-[11px]">
              <tr>
                <th className="px-5 py-3">Lead Name</th>
                <th className="px-5 py-3">Contact</th>
                <th className="px-5 py-3">Stage</th>
                <th className="px-5 py-3">Budget</th>
                <th className="px-5 py-3">Assigned Rep</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats?.recentLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3 font-semibold text-slate-900">{lead.name}</td>
                  <td className="px-5 py-3">
                    <p className="text-slate-800">{lead.phone}</p>
                    <p className="text-[11px] text-slate-400">{lead.email || '—'}</p>
                  </td>
                  <td className="px-5 py-3">
                    <LeadStageBadge stage={lead.stage} size="sm" />
                  </td>
                  <td className="px-5 py-3 font-medium text-slate-800">
                    {formatCurrencyINR(lead.budget)}
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium">
                      {lead.assignedTo?.name || 'Unassigned'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/leads/${lead.id}`)}
                    >
                      View
                    </Button>
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
