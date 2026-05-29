import type { ReactNode } from 'react';
import { useAuthStore, type UserRole } from '@/stores/auth.store';
import { usePermissions } from '@/stores/permissions.store';
import type { PermissionAction, Resource, Setor } from '@/types/permissions';

interface Props {
  roles?: UserRole[];
  permissions?: { resource: Resource; action: PermissionAction }[];
  setores?: Setor[];
  requireAll?: boolean; // Se true, requer todas as permissões/setores; se false, requer qualquer uma
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGuard({ 
  roles, 
  permissions, 
  setores, 
  requireAll = false,
  children, 
  fallback = null 
}: Props) {
  const hasRole = useAuthStore((s) => s.hasRole);
  const { hasPermission, hasSetor, hasAnyPermission, hasAllPermissions, hasAnySetor } = usePermissions();
  
  // Verificação de roles
  if (roles && !hasRole(...roles)) {
    return <>{fallback}</>;
  }
  
  // Verificação de permissões
  if (permissions && permissions.length > 0) {
    const checkPermission = requireAll ? hasAllPermissions : hasAnyPermission;
    const permissionIds = permissions.map(p => `${p.resource}_${p.action}`);
    if (!checkPermission(permissionIds)) {
      return <>{fallback}</>;
    }
  }
  
  // Verificação de setores
  if (setores && setores.length > 0) {
    const checkSetor = requireAll ? 
      () => setores.every(s => hasSetor(s)) : 
      () => hasAnySetor(setores);
    if (!checkSetor()) {
      return <>{fallback}</>;
    }
  }
  
  return <>{children}</>;
}
