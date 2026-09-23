import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Plus, UserCheck, Mail, Shield, UserX, Check } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { UserDTO, Role } from '@realestate-crm/shared';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { RoleBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDate } from '@/lib/utils';

export const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { success, error } = useToast();
  const queryClient = useQueryClient();

  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    password: '',
    role: Role.SALES_EMPLOYEE,
  });
  const [newUserErrors, setNewUserErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  // Query Users
  const { data, isLoading } = useQuery<{ users: (UserDTO & { assignedLeadsCount?: number; bookingsCount?: number })[] }>({
    queryKey: ['users-management'],
    queryFn: () => apiClient<{ users: any[] }>('/api/users'),
  });

  // Create User Mutation
  const createUserMutation = useMutation({
    mutationFn: (payload: any) =>
      apiClient('/api/users', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-management'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsAddUserModalOpen(false);
      setNewUserForm({ name: '', email: '', password: '', role: Role.SALES_EMPLOYEE });
      success('User created successfully');
    },
    onError: (err: any) => error(err.message || 'Failed to create user'),
  });

  // Toggle User Active Mutation
  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiClient(`/api/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-management'] });
      success('User status updated');
    },
    onError: (err: any) => error(err.message || 'Failed to update user status'),
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { name?: string; email?: string; password?: string } = {};
    if (!newUserForm.name.trim()) errors.name = 'Full Name is required.';
    if (!newUserForm.email.trim()) errors.email = 'Email Address is required.';
    if (!newUserForm.password) errors.password = 'Temporary Password is required.';

    if (Object.keys(errors).length > 0) {
      setNewUserErrors(errors);
      return;
    }
    setNewUserErrors({});
    createUserMutation.mutate(newUserForm);
  };

  const users = data?.users || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Staff & Sales Rep Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure system roles, access credentials, and representative capacity
          </p>
        </div>
        <Button size="sm" onClick={() => setIsAddUserModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
          Add Sales Employee
        </Button>
      </div>

      <Card>
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100 text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Name</th>
                  <th className="px-5 py-3.5">Email</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Assigned Leads</th>
                  <th className="px-5 py-3.5">Bookings</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold">
                        {u.name.charAt(0)}
                      </div>
                      <span>{u.name}</span>
                      {u.id === currentUser?.id && (
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-semibold">
                          You
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-slate-600">{u.email}</td>

                    <td className="px-5 py-3.5">
                      <RoleBadge role={u.role} />
                    </td>

                    <td className="px-5 py-3.5 font-semibold text-slate-800">
                      {u.assignedLeadsCount || 0}
                    </td>

                    <td className="px-5 py-3.5 font-semibold text-slate-800">
                      {u.bookingsCount || 0}
                    </td>

                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          u.isActive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            u.isActive ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        {u.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      {u.id !== currentUser?.id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            toggleActiveMutation.mutate({
                              id: u.id,
                              isActive: !u.isActive,
                            })
                          }
                        >
                          {u.isActive ? 'Deactivate' : 'Reactivate'}
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

      {/* Add User Modal */}
      <Modal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        title="Add New Team Member"
        description="Create account for sales representative or administrator"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4" noValidate>
          <Input
            label="Full Name"
            required
            placeholder="e.g. John Miller"
            value={newUserForm.name}
            onChange={(e) => {
              setNewUserForm({ ...newUserForm, name: e.target.value });
              setNewUserErrors(prev => ({ ...prev, name: undefined }));
            }}
            error={newUserErrors.name}
          />

          <Input
            label="Email Address"
            type="email"
            required
            placeholder="e.g. john@realestatecrm.com"
            value={newUserForm.email}
            onChange={(e) => {
              setNewUserForm({ ...newUserForm, email: e.target.value });
              setNewUserErrors(prev => ({ ...prev, email: undefined }));
            }}
            error={newUserErrors.email}
          />

          <Input
            label="Temporary Password"
            type="password"
            required
            placeholder="••••••••"
            value={newUserForm.password}
            onChange={(e) => {
              setNewUserForm({ ...newUserForm, password: e.target.value });
              setNewUserErrors(prev => ({ ...prev, password: undefined }));
            }}
            error={newUserErrors.password}
          />

          <Select
            label="Role"
            value={newUserForm.role}
            onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as Role })}
          >
            <option value={Role.SALES_EMPLOYEE}>Sales Employee (Sales Rep)</option>
            <option value={Role.ADMIN}>Administrator (Full System Access)</option>
          </Select>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAddUserModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={createUserMutation.isPending}>
              Create User
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
