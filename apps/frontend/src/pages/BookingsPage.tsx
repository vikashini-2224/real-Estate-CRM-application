import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  CalendarCheck,
  Building,
  User,
  DollarSign,
  Calendar,
  XCircle,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { BookingDTO, Role } from '@realestate-crm/shared';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCurrencyINR, formatCurrencyINRCompact, formatDate, formatDateTime } from '@/lib/utils';

export const BookingsPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { success, error } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [bookingToCancel, setBookingToCancel] = useState<BookingDTO | null>(null);

  // Query Bookings
  const { data, isLoading } = useQuery<{ bookings: BookingDTO[] }>({
    queryKey: ['bookings'],
    queryFn: () => apiClient<{ bookings: BookingDTO[] }>('/api/bookings'),
  });

  // Cancel Booking Mutation (Admin Only)
  const cancelBookingMutation = useMutation({
    mutationFn: (bookingId: string) =>
      apiClient(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['units'] });
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setBookingToCancel(null);
      success('Booking cancelled and property unit safely released back to available inventory.');
    },
    onError: (err: any) => {
      error(err.message || 'Failed to cancel booking');
    },
  });

  const bookings = data?.bookings || [];
  const totalVolume = bookings.reduce((sum, b) => sum + b.finalPrice, 0);

  return (
    <div className="space-y-6">
      {/* Header & Stats Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Confirmed Bookings & Contracts</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit-backed transactions connecting verified leads with dedicated property units
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="text-right">
            <span className="text-slate-400 block">Total Volume</span>
            <span className="font-extrabold text-slate-900 text-sm">{formatCurrencyINRCompact(totalVolume)}</span>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div className="text-right">
            <span className="text-slate-400 block">Active Bookings</span>
            <span className="font-extrabold text-blue-600 text-sm">{bookings.length} Units</span>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <Card>
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <EmptyState
            icon={<CalendarCheck className="w-8 h-8 text-slate-400" />}
            title="No Bookings Yet"
            description="Bookings created from the Lead detail page will appear here with full transaction records."
            actionLabel="View Leads Pipeline"
            onAction={() => navigate('/leads')}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100 text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Customer / Lead</th>
                  <th className="px-5 py-3.5">Allocated Unit</th>
                  <th className="px-5 py-3.5">Pricing Terms</th>
                  <th className="px-5 py-3.5">Agent In Charge</th>
                  <th className="px-5 py-3.5">Booking Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Lead info */}
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => navigate(`/leads/${b.leadId}`)}
                        className="font-bold text-slate-900 hover:text-blue-600 text-left transition-colors flex items-center gap-1"
                      >
                        <span>{b.lead?.name || 'Customer'}</span>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </button>
                      <p className="text-[11px] text-slate-400 mt-0.5">{b.lead?.phone}</p>
                    </td>

                    {/* Unit info */}
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-900">
                        Unit #{b.unit?.unitNumber} ({b.unit?.type})
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {b.unit?.building?.project?.name} &bull; {b.unit?.building?.name}
                      </p>
                    </td>

                    {/* Pricing */}
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-emerald-700">{formatCurrencyINR(b.finalPrice)}</p>
                      <p className="text-[11px] text-slate-400">
                        Token: {formatCurrencyINR(b.bookingAmount)}
                      </p>
                    </td>

                    {/* Agent */}
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[11px] font-medium">
                        {b.createdBy?.name || 'Agent'}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-5 py-3.5">
                      <span className="text-slate-700 font-medium">
                        {formatDate(b.bookingDate)}
                      </span>
                      <p className="text-[10px] text-slate-400">{formatDateTime(b.createdAt)}</p>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      {isAdmin && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setBookingToCancel(b)}
                          icon={<XCircle className="w-3.5 h-3.5" />}
                        >
                          Cancel Booking
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!bookingToCancel}
        onClose={() => setBookingToCancel(null)}
        onConfirm={() => bookingToCancel && cancelBookingMutation.mutate(bookingToCancel.id)}
        title="Cancel Confirmed Booking"
        message={`Are you sure you want to cancel the booking for Unit #${bookingToCancel?.unit?.unitNumber}? This will immediately return the unit to AVAILABLE inventory status and revert the lead status.`}
        confirmText="Cancel & Release Unit"
        variant="danger"
        isLoading={cancelBookingMutation.isPending}
      />
    </div>
  );
};
