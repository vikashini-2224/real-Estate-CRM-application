import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  Calendar,
  MoreHorizontal,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { LeadDTO, LeadStage, UserDTO, Role } from '@realestate-crm/shared';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { LeadStageBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCurrencyINR, formatDate } from '@/lib/utils';

export const LeadsPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { success, error } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Filters & Search state
  const [search, setSearch] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');
  const [myLeadsOnly, setMyLeadsOnly] = useState<boolean>(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<LeadDTO | null>(null);

  // New Lead Form State
  const [newLead, setNewLead] = useState({
    name: '',
    email: '',
    phone: '',
    stage: LeadStage.NEW,
    budget: '',
    requirement: '',
    followUpDate: '',
    assignedToId: '',
  });
  const [createErrors, setCreateErrors] = useState<{ name?: string; phone?: string }>({});

  // Query Leads
  const { data, isLoading } = useQuery<{ leads: LeadDTO[] }>({
    queryKey: ['leads', search, selectedStage, selectedAssignee, myLeadsOnly],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedStage) params.append('stage', selectedStage);
      if (selectedAssignee) params.append('assignedToId', selectedAssignee);
      if (myLeadsOnly) params.append('myLeads', 'true');
      return apiClient<{ leads: LeadDTO[] }>(`/api/leads?${params.toString()}`);
    },
  });

  // Query Users (for assignment dropdown)
  const { data: usersData } = useQuery<{ users: UserDTO[] }>({
    queryKey: ['users'],
    queryFn: () => apiClient<{ users: UserDTO[] }>('/api/users'),
  });

  // Create Lead Mutation
  const createLeadMutation = useMutation({
    mutationFn: (payload: any) =>
      apiClient<{ lead: LeadDTO }>('/api/leads', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setIsAddModalOpen(false);
      setNewLead({
        name: '',
        email: '',
        phone: '',
        stage: LeadStage.NEW,
        budget: '',
        requirement: '',
        followUpDate: '',
        assignedToId: '',
      });
      success('New lead created successfully');
    },
    onError: (err: any) => {
      error(err.message || 'Failed to create lead');
    },
  });

  // Delete Lead Mutation (Admin Only)
  const deleteLeadMutation = useMutation({
    mutationFn: (leadId: string) =>
      apiClient(`/api/leads/${leadId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setLeadToDelete(null);
      success('Lead removed successfully');
    },
    onError: (err: any) => {
      error(err.message || 'Failed to delete lead');
    },
  });

  // Quick Stage Update Mutation
  const updateStageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: LeadStage }) =>
      apiClient(`/api/leads/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ stage }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      success('Lead stage updated');
    },
    onError: (err: any) => {
      error(err.message || 'Failed to update stage');
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { name?: string; phone?: string } = {};
    if (!newLead.name.trim()) errors.name = 'Full Name is required.';
    if (!newLead.phone.trim()) errors.phone = 'Phone Number is required.';

    if (Object.keys(errors).length > 0) {
      setCreateErrors(errors);
      return;
    }
    setCreateErrors({});

    createLeadMutation.mutate({
      name: newLead.name,
      email: newLead.email || null,
      phone: newLead.phone,
      stage: newLead.stage,
      budget: newLead.budget ? parseFloat(newLead.budget) : null,
      requirement: newLead.requirement || null,
      followUpDate: newLead.followUpDate ? new Date(newLead.followUpDate).toISOString() : null,
      assignedToId: newLead.assignedToId || null,
    });
  };

  const leads = data?.leads || [];

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Leads & Prospects Pipeline</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage customer inquiries, assign sales representatives, and log follow-ups</p>
        </div>
        <Button size="md" onClick={() => setIsAddModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
          Add New Lead
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, phone, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          {/* Stage Filter */}
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          >
            <option value="">All Stages</option>
            {Object.values(LeadStage).map((st) => (
              <option key={st} value={st}>
                Stage: {st}
              </option>
            ))}
          </select>

          {/* Assignee Filter */}
          <select
            value={selectedAssignee}
            onChange={(e) => setSelectedAssignee(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          >
            <option value="">All Assigned Reps</option>
            <option value="unassigned">Unassigned Only</option>
            {usersData?.users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>

          {/* Toggle My Leads */}
          <button
            type="button"
            onClick={() => setMyLeadsOnly(!myLeadsOnly)}
            className={`h-9 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-colors ${
              myLeadsOnly
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{myLeadsOnly ? 'Showing My Assigned Leads' : 'Filter My Leads'}</span>
          </button>
        </div>
      </Card>

      {/* Leads Table */}
      <Card>
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : leads.length === 0 ? (
          <EmptyState
            icon={<Users className="w-8 h-8 text-slate-400" />}
            title="No leads found"
            description="No prospects match the selected filters or search keyword. Create a new lead to get started."
            actionLabel="Add Lead"
            onAction={() => setIsAddModalOpen(true)}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100 text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Lead Name</th>
                  <th className="px-5 py-3.5">Contact Details</th>
                  <th className="px-5 py-3.5">Stage</th>
                  <th className="px-5 py-3.5">Budget</th>
                  <th className="px-5 py-3.5">Follow-up</th>
                  <th className="px-5 py-3.5">Assigned Agent</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => navigate(`/leads/${lead.id}`)}
                        className="font-bold text-slate-900 hover:text-blue-600 text-left transition-colors"
                      >
                        {lead.name}
                      </button>
                      {lead.requirement && (
                        <p className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                          {lead.requirement}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-3.5 space-y-0.5">
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{lead.phone}</span>
                      </div>
                      {lead.email && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                          <Mail className="w-3 h-3 text-slate-300" />
                          <span>{lead.email}</span>
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      {/* Quick stage dropdown */}
                      <select
                        value={lead.stage}
                        onChange={(e) =>
                          updateStageMutation.mutate({
                            id: lead.id,
                            stage: e.target.value as LeadStage,
                          })
                        }
                        className="h-7 px-2 rounded border border-slate-200 bg-white text-[11px] font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        {Object.values(LeadStage).map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-5 py-3.5 font-semibold text-slate-900">
                      {formatCurrencyINR(lead.budget)}
                    </td>

                    <td className="px-5 py-3.5">
                      {lead.followUpDate ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700">
                          <Calendar className="w-3 h-3 text-amber-500" />
                          {formatDate(lead.followUpDate)}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[11px] font-medium">
                        {lead.assignedTo?.name || 'Unassigned'}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/leads/${lead.id}`)}
                          icon={<ExternalLink className="w-3 h-3" />}
                        >
                          Details
                        </Button>
                        {isAdmin && (
                          <button
                            onClick={() => setLeadToDelete(lead)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="Delete Lead"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add Lead Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create New Lead"
        description="Add a prospective real estate customer into the pipeline"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Full Name"
              required
              placeholder="e.g. Eleanor Vance"
              value={newLead.name}
              onChange={(e) => {
                setNewLead({ ...newLead, name: e.target.value });
                setCreateErrors(prev => ({ ...prev, name: undefined }));
              }}
              error={createErrors.name}
            />
            <Input
              label="Phone Number"
              required
              maxLength={15}
              placeholder="e.g. +1 (555) 123-4567"
              value={newLead.phone}
              onChange={(e) => {
                setNewLead({ ...newLead, phone: e.target.value });
                setCreateErrors(prev => ({ ...prev, phone: undefined }));
              }}
              error={createErrors.phone}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Email Address (Optional)"
              type="email"
              placeholder="e.g. eleanor@example.com"
              value={newLead.email}
              onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
            />
            <Input
              label="Target Budget (₹)"
              type="number"
              min="0"
              placeholder="e.g. 750000"
              value={newLead.budget}
              onChange={(e) => setNewLead({ ...newLead, budget: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Initial Stage"
              value={newLead.stage}
              onChange={(e) => setNewLead({ ...newLead, stage: e.target.value as LeadStage })}
            >
              {Object.values(LeadStage).map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </Select>

            <Select
              label="Assign Sales Representative"
              value={newLead.assignedToId}
              onChange={(e) => setNewLead({ ...newLead, assignedToId: e.target.value })}
            >
              <option value="">Select an Agent (or assign later)</option>
              {usersData?.users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </Select>
          </div>

          <Input
            label="Next Follow-up Date (Optional)"
            type="datetime-local"
            value={newLead.followUpDate}
            onChange={(e) => setNewLead({ ...newLead, followUpDate: e.target.value })}
          />

          <Textarea
            label="Property Requirements / Specifics"
            placeholder="e.g. Looking for a high-floor 2BHK with balcony in Skyline Heights..."
            value={newLead.requirement}
            onChange={(e) => setNewLead({ ...newLead, requirement: e.target.value })}
          />

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={createLeadMutation.isPending}>
              Create Lead
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!leadToDelete}
        onClose={() => setLeadToDelete(null)}
        onConfirm={() => leadToDelete && deleteLeadMutation.mutate(leadToDelete.id)}
        title="Delete Lead"
        message={`Are you sure you want to permanently delete lead "${leadToDelete?.name}"? All associated notes will also be removed.`}
        confirmText="Delete Lead"
        variant="danger"
        isLoading={deleteLeadMutation.isPending}
      />
    </div>
  );
};
