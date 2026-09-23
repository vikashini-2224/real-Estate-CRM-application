import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  User,
  DollarSign,
  MessageSquare,
  Building,
  CheckCircle2,
  Send,
  Edit,
  Sparkles,
  Check,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { LeadDTO, LeadStage, UnitDTO, UserDTO } from '@realestate-crm/shared';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { LeadStageBadge, UnitStatusBadge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCurrencyINR, formatDate, formatDateTime } from '@/lib/utils';

export const LeadDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBookUnitModalOpen, setIsBookUnitModalOpen] = useState(false);

  // New Note state
  const [noteContent, setNoteContent] = useState('');

  // Booking form state
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [bookingAmount, setBookingAmount] = useState('');
  const [finalPrice, setFinalPrice] = useState('');
  const [bookErrors, setBookErrors] = useState<{ unitId?: string; finalPrice?: string; bookingAmount?: string }>({});

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    budget: '',
    requirement: '',
    followUpDate: '',
    assignedToId: '',
  });
  const [editErrors, setEditErrors] = useState<{ name?: string; phone?: string }>({});

  // Query Lead Details
  const { data, isLoading } = useQuery<{ lead: LeadDTO }>({
    queryKey: ['lead', id],
    queryFn: () => apiClient<{ lead: LeadDTO }>(`/api/leads/${id}`),
  });

  // Query Available Units (for booking modal)
  const { data: unitsData } = useQuery<{ units: UnitDTO[] }>({
    queryKey: ['available-units'],
    queryFn: () => apiClient<{ units: UnitDTO[] }>('/api/properties/units?status=AVAILABLE'),
    enabled: isBookUnitModalOpen,
  });

  // Query Users (for assignment)
  const { data: usersData } = useQuery<{ users: UserDTO[] }>({
    queryKey: ['users'],
    queryFn: () => apiClient<{ users: UserDTO[] }>('/api/users'),
  });

  const lead = data?.lead;

  // Add Note Mutation
  const addNoteMutation = useMutation({
    mutationFn: (content: string) =>
      apiClient(`/api/leads/${id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      setNoteContent('');
      success('Note added to timeline');
    },
    onError: (err: any) => {
      error(err.message || 'Failed to add note');
    },
  });

  // Update Lead Mutation
  const updateLeadMutation = useMutation({
    mutationFn: (payload: any) =>
      apiClient(`/api/leads/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      setIsEditModalOpen(false);
      success('Lead information updated');
    },
    onError: (err: any) => {
      error(err.message || 'Failed to update lead');
    },
  });

  // Book Unit Mutation (ACID Transaction)
  const bookUnitMutation = useMutation({
    mutationFn: (payload: any) =>
      apiClient('/api/bookings', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lead', id] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['available-units'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setIsBookUnitModalOpen(false);
      success('🎉 Unit booked successfully! Lock confirmed.');
    },
    onError: (err: any) => {
      error(err.message || 'Unit booking failed. It might have been booked by another user.');
    },
  });

  const handleOpenEdit = () => {
    if (!lead) return;
    setEditForm({
      name: lead.name,
      email: lead.email || '',
      phone: lead.phone,
      budget: lead.budget ? String(lead.budget) : '',
      requirement: lead.requirement || '',
      followUpDate: lead.followUpDate ? lead.followUpDate.slice(0, 16) : '',
      assignedToId: lead.assignedToId || '',
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { name?: string; phone?: string } = {};
    if (!editForm.name.trim()) errors.name = 'Full Name is required.';
    if (!editForm.phone.trim()) errors.phone = 'Phone Number is required.';

    if (Object.keys(errors).length > 0) {
      setEditErrors(errors);
      return;
    }
    setEditErrors({});

    updateLeadMutation.mutate({
      name: editForm.name,
      email: editForm.email || null,
      phone: editForm.phone,
      budget: editForm.budget ? parseFloat(editForm.budget) : null,
      requirement: editForm.requirement || null,
      followUpDate: editForm.followUpDate ? new Date(editForm.followUpDate).toISOString() : null,
      assignedToId: editForm.assignedToId || null,
    });
  };

  const handleStageChange = (newStage: LeadStage) => {
    if (!lead || lead.stage === newStage) return;
    updateLeadMutation.mutate({ stage: newStage });
  };

  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors: { unitId?: string; finalPrice?: string; bookingAmount?: string } = {};
    if (!selectedUnitId) errors.unitId = 'Please select an available property unit.';
    if (!finalPrice) errors.finalPrice = 'Agreed final price is required.';
    if (!bookingAmount) errors.bookingAmount = 'Initial token amount is required.';

    if (Object.keys(errors).length > 0) {
      setBookErrors(errors);
      return;
    }

    setBookErrors({});
    bookUnitMutation.mutate({
      leadId: id,
      unitId: selectedUnitId,
      bookingAmount: parseFloat(bookingAmount),
      finalPrice: parseFloat(finalPrice),
    });
  };

  const handleSelectUnit = (unitId: string) => {
    setSelectedUnitId(unitId);
    setBookErrors((prev) => ({ ...prev, unitId: undefined }));
    const selected = unitsData?.units.find((u) => u.id === unitId);
    if (selected) {
      setFinalPrice(String(selected.price));
      setBookingAmount(String(Math.round(selected.price * 0.05))); // default 5% token
      setBookErrors((prev) => ({ ...prev, finalPrice: undefined, bookingAmount: undefined }));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 lg:col-span-2 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center p-12 bg-white rounded-xl border border-slate-200">
        <p className="text-sm font-semibold text-slate-700">Lead not found</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/leads')}>
          Back to Leads
        </Button>
      </div>
    );
  }

  const stagesList = [
    LeadStage.NEW,
    LeadStage.CONTACTED,
    LeadStage.SITE_VISIT,
    LeadStage.INTERESTED,
    LeadStage.NEGOTIATION,
    LeadStage.BOOKED,
  ];

  return (
    <div className="space-y-6">
      {/* Top Navigation & Status Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/leads')}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">{lead.name}</h2>
              <LeadStageBadge stage={lead.stage} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Created on {formatDate(lead.createdAt)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={handleOpenEdit} icon={<Edit className="w-3.5 h-3.5" />}>
            Edit Details
          </Button>

          {lead.booking ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Unit Booked</span>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={() => setIsBookUnitModalOpen(true)}
              icon={<Building className="w-4 h-4" />}
            >
              Book Property Unit
            </Button>
          )}
        </div>
      </div>

      {/* Stage Progression Stepper */}
      <Card className="py-3 px-4">
        <div className="w-full overflow-x-auto scrollbar-hide">
          <div className="flex w-[750px] lg:w-full items-start justify-between pt-1">
            {stagesList.map((st, idx) => {
              const isCurrent = lead.stage === st;
              const isPassed = stagesList.indexOf(lead.stage as LeadStage) >= idx;
              const isStrictlyPassed = isPassed && !isCurrent;
              const isLast = idx === stagesList.length - 1;

              let title = st.replace('_', ' ').toLowerCase();
              title = title.charAt(0).toUpperCase() + title.slice(1);
              if (st === LeadStage.SITE_VISIT) title = 'Site Visit';

              let subtitle = '';
              switch (st) {
                case LeadStage.NEW: subtitle = 'Fresh inquiry'; break;
                case LeadStage.CONTACTED: subtitle = 'Initial contact'; break;
                case LeadStage.SITE_VISIT: subtitle = 'Property tour'; break;
                case LeadStage.INTERESTED: subtitle = 'Showing interest'; break;
                case LeadStage.NEGOTIATION: subtitle = 'Price & terms'; break;
                case LeadStage.BOOKED: subtitle = 'Closed won'; break;
              }

              return (
                <div key={st} className="relative flex-1 flex flex-col items-center group">
                  {/* Connecting Line */}
                  {!isLast && (
                    <div 
                      className={`absolute top-[12px] left-[50%] w-full h-[2px] transition-colors duration-500 ${
                        isStrictlyPassed ? 'bg-blue-600' : 'bg-slate-200'
                      }`} 
                    />
                  )}

                  {/* Circle Button */}
                  <button
                    type="button"
                    onClick={() => handleStageChange(st)}
                    disabled={lead.stage === LeadStage.BOOKED && st !== LeadStage.BOOKED}
                    className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center border-[1.5px] transition-all duration-300 outline-none ${
                      isStrictlyPassed 
                        ? 'bg-blue-600 border-blue-600 text-white' 
                        : isCurrent 
                        ? 'bg-white border-blue-600 text-blue-600 ring-2 ring-blue-50 shadow-sm' 
                        : 'bg-white border-slate-300 text-slate-500 hover:border-slate-400 hover:text-slate-700'
                    }`}
                  >
                    {isStrictlyPassed ? (
                      <Check className="w-3.5 h-3.5" strokeWidth={3} />
                    ) : (
                      <span className="text-[10px] font-bold">{String(idx + 1).padStart(2, '0')}</span>
                    )}
                  </button>

                  {/* Labels */}
                  <div className="mt-2 text-center px-1">
                    <p className={`text-[11px] font-bold transition-colors ${
                      isCurrent || isStrictlyPassed ? 'text-slate-900' : 'text-slate-600'
                    }`}>
                      {title}
                    </p>
                    <p className="text-[9px] text-slate-500 mt-0.5 whitespace-nowrap">{subtitle}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Main Grid: Left Details & Right Notes Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Lead Profile & Booking Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-400">Phone</p>
                  <p className="font-semibold text-slate-800">{lead.phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-400">Email Address</p>
                  <p className="font-semibold text-slate-800">{lead.email || '—'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-400">Target Budget</p>
                  <p className="font-bold text-slate-900">{formatCurrencyINR(lead.budget)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-400">Assigned Representative</p>
                  <p className="font-semibold text-slate-800">{lead.assignedTo?.name || 'Unassigned'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] text-slate-400">Scheduled Follow-up</p>
                  <p className="font-semibold text-amber-700">{formatDateTime(lead.followUpDate)}</p>
                </div>
              </div>

              {lead.requirement && (
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Requirements
                  </p>
                  <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                    {lead.requirement}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Confirmed Booking Summary (if present) */}
          {lead.booking && (
            <Card className="border-emerald-200 bg-emerald-50/40">
              <CardHeader className="border-emerald-100">
                <CardTitle className="text-emerald-950 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Confirmed Property Booking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-emerald-100/80">
                  <span className="text-slate-500">Project:</span>
                  <span className="font-semibold text-slate-800">
                    {lead.booking.unit?.building?.project?.name}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-emerald-100/80">
                  <span className="text-slate-500">Building / Unit:</span>
                  <span className="font-bold text-slate-900">
                    {lead.booking.unit?.building?.name} — Unit #{lead.booking.unit?.unitNumber}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-emerald-100/80">
                  <span className="text-slate-500">Unit Type:</span>
                  <span className="font-semibold text-slate-800">{lead.booking.unit?.type}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-emerald-100/80">
                  <span className="text-slate-500">Final Agreed Price:</span>
                  <span className="font-bold text-emerald-700">
                    {formatCurrencyINR(lead.booking.finalPrice)}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Token Amount Paid:</span>
                  <span className="font-bold text-slate-800">
                    {formatCurrencyINR(lead.booking.bookingAmount)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Notes & Activity Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Activity & Notes Timeline</CardTitle>
                <p className="text-xs text-slate-500">Chronological history of interactions, calls, and meetings</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add Note Input Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!noteContent.trim()) return;
                  addNoteMutation.mutate(noteContent.trim());
                }}
                className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200/80"
              >
                <Textarea
                  placeholder="Type notes, client feedback, site visit summary, or negotiations..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="bg-white min-h-[70px]"
                />
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-slate-400">
                    Posting as: <strong className="text-slate-600">{user?.name}</strong>
                  </span>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!noteContent.trim() || addNoteMutation.isPending}
                    isLoading={addNoteMutation.isPending}
                    icon={<Send className="w-3.5 h-3.5" />}
                  >
                    Post Note
                  </Button>
                </div>
              </form>

              {/* Timeline Notes List */}
              <div className="space-y-4">
                {lead.notes && lead.notes.length > 0 ? (
                  <div className="relative pl-6 space-y-6 before:absolute before:left-[5px] before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                    {lead.notes.map((note) => (
                      <div key={note.id} className="relative group">
                        <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-blue-600 border-2 border-white ring-2 ring-slate-100 z-10" />
                        <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-sm space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-800">{note.author.name}</span>
                              <span className="text-[10px] text-slate-400">({note.author.role})</span>
                            </div>
                            <span className="text-[11px] text-slate-400 font-medium">
                              {formatDateTime(note.createdAt)}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {note.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-6 text-xs text-slate-400">
                    No notes recorded yet. Add the first note above.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Lead Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Lead Information"
        description="Update contact information, budget, or sales rep assignment"
        maxWidth="lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Full Name"
              required
              value={editForm.name}
              onChange={(e) => {
                setEditForm({ ...editForm, name: e.target.value });
                setEditErrors(prev => ({ ...prev, name: undefined }));
              }}
              error={editErrors.name}
            />
            <Input
              label="Phone Number"
              required
              maxLength={15}
              value={editForm.phone}
              onChange={(e) => {
                setEditForm({ ...editForm, phone: e.target.value });
                setEditErrors(prev => ({ ...prev, phone: undefined }));
              }}
              error={editErrors.phone}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Email Address"
              type="email"
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            />
            <Input
              label="Target Budget (₹)"
              type="number"
              min="0"
              value={editForm.budget}
              onChange={(e) => setEditForm({ ...editForm, budget: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Assigned Sales Representative"
              value={editForm.assignedToId}
              onChange={(e) => setEditForm({ ...editForm, assignedToId: e.target.value })}
            >
              <option value="">Unassigned</option>
              {usersData?.users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </Select>

            <Input
              label="Next Follow-up Date"
              type="datetime-local"
              value={editForm.followUpDate}
              onChange={(e) => setEditForm({ ...editForm, followUpDate: e.target.value })}
            />
          </div>

          <Textarea
            label="Property Requirements"
            value={editForm.requirement}
            onChange={(e) => setEditForm({ ...editForm, requirement: e.target.value })}
          />

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={updateLeadMutation.isPending}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Book Property Unit Modal */}
      <Modal
        isOpen={isBookUnitModalOpen}
        onClose={() => setIsBookUnitModalOpen(false)}
        title="Book Property Unit"
        description={`Allocate and lock an inventory unit for ${lead.name}`}
        maxWidth="lg"
      >
        <form onSubmit={handleBookSubmit} className="space-y-4" noValidate>
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-xs text-blue-800 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>ACID Concurrency Guarantee</span>
            </div>
            <p className="text-[11px] leading-relaxed text-blue-700">
              When submitted, this unit is instantly locked at the database level. If another agent is attempting to book the same unit simultaneously, strict transaction isolation prevents collision.
            </p>
          </div>

          <Select
            label="Select Available Unit"
            required
            value={selectedUnitId}
            onChange={(e) => handleSelectUnit(e.target.value)}
            error={bookErrors.unitId}
          >
            <option value="">-- Choose an Available Property Unit --</option>
            {unitsData?.units?.map((u) => (
              <option key={u.id} value={u.id}>
                {u.building?.project?.name} &bull; {u.building?.name} &bull; Unit #{u.unitNumber} ({u.type}) — {formatCurrencyINR(u.price)}
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Agreed Final Price (₹)"
              type="number"
              required
              min="0"
              placeholder="e.g. 950000"
              value={finalPrice}
              onChange={(e) => {
                setFinalPrice(e.target.value);
                setBookErrors((prev) => ({ ...prev, finalPrice: undefined }));
              }}
              error={bookErrors.finalPrice}
            />
            <Input
              label="Initial Token / Booking Amount (₹)"
              type="number"
              required
              min="0"
              placeholder="e.g. 50000"
              value={bookingAmount}
              onChange={(e) => {
                setBookingAmount(e.target.value);
                setBookErrors((prev) => ({ ...prev, bookingAmount: undefined }));
              }}
              error={bookErrors.bookingAmount}
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsBookUnitModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              isLoading={bookUnitMutation.isPending}
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              Confirm & Book Unit
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
