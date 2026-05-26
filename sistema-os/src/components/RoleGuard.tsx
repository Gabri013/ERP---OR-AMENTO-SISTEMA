import type { ReactNode } from 'react';
import { useAuthStore, type UserRole } from '@/stores/auth.store';

interface Props {
  roles: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGuard({ roles, children, fallback = null }: Props) {
  const hasRole = useAuthStore((s) => s.hasRole);
  if (!hasRole(...roles)) return <>{fallback}</>;
  return <>{children}</>;
}
