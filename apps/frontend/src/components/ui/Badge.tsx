import React from 'react';
import { cn } from '@/lib/utils';
import { LeadStage, UnitStatus, Role } from '@realestate-crm/shared';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'purple' | 'info' | 'neutral';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'default',
  size = 'md',
}) => {
  const variantStyles = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    primary: 'bg-blue-50 text-blue-700 border-blue-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    neutral: 'bg-slate-800 text-white border-transparent',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-0.5 font-semibold',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border tracking-wide uppercase',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  );
};

export const LeadStageBadge: React.FC<{ stage: LeadStage | string; size?: 'sm' | 'md' }> = ({
  stage,
  size = 'md',
}) => {
  const stageMap: Record<string, { label: string; variant: BadgeProps['variant']; dotColor: string }> = {
    [LeadStage.NEW]: { label: 'New', variant: 'info', dotColor: 'bg-sky-500' },
    [LeadStage.CONTACTED]: { label: 'Contacted', variant: 'primary', dotColor: 'bg-blue-500' },
    [LeadStage.SITE_VISIT]: { label: 'Site Visit', variant: 'purple', dotColor: 'bg-purple-500' },
    [LeadStage.INTERESTED]: { label: 'Interested', variant: 'warning', dotColor: 'bg-amber-500' },
    [LeadStage.NEGOTIATION]: { label: 'Negotiation', variant: 'warning', dotColor: 'bg-orange-500' },
    [LeadStage.BOOKED]: { label: 'Booked', variant: 'success', dotColor: 'bg-emerald-500' },
    [LeadStage.LOST]: { label: 'Lost', variant: 'danger', dotColor: 'bg-rose-500' },
  };

  const config = stageMap[stage] || { label: stage, variant: 'default', dotColor: 'bg-slate-400' };

  return (
    <Badge variant={config.variant} size={size}>
      <span className={cn('w-1.5 h-1.5 rounded-full inline-block', config.dotColor)} />
      {config.label}
    </Badge>
  );
};

export const UnitStatusBadge: React.FC<{ status: UnitStatus | string; size?: 'sm' | 'md' }> = ({
  status,
  size = 'md',
}) => {
  const statusMap: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    [UnitStatus.AVAILABLE]: { label: 'Available', variant: 'success' },
    [UnitStatus.RESERVED]: { label: 'Reserved', variant: 'warning' },
    [UnitStatus.BOOKED]: { label: 'Booked', variant: 'danger' },
  };

  const config = statusMap[status] || { label: status, variant: 'default' };

  return (
    <Badge variant={config.variant} size={size}>
      {config.label}
    </Badge>
  );
};

export const RoleBadge: React.FC<{ role: Role | string }> = ({ role }) => {
  return role === Role.ADMIN ? (
    <Badge variant="neutral" size="sm">
      Admin
    </Badge>
  ) : (
    <Badge variant="primary" size="sm">
      Sales Rep
    </Badge>
  );
};
