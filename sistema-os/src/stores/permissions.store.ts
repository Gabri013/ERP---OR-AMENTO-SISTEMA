import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Permission, Setor, UserPermission, SetorPermission } from "@/types/permissions";

interface PermissionsStore {
  // Permissões do usuário atual
  userPermissions: Permission[];
  // Setores do usuário atual
  userSetores: Setor[];
  // Todas as permissões disponíveis
  allPermissions: Permission[];
  // Permissões por setor
  setorPermissions: Record<string, Permission[]>;
  
  // Actions
  setUserPermissions: (permissions: Permission[]) => void;
  setUserSetores: (setores: Setor[]) => void;
  setAllPermissions: (permissions: Permission[]) => void;
  setSetorPermissions: (setor: string, permissions: Permission[]) => void;
  
  // Verificações
  hasPermission: (resource: string, action: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  hasSetor: (setor: Setor) => boolean;
  hasAnySetor: (setores: Setor[]) => boolean;
  
  // Utilitários
  clearPermissions: () => void;
}

export const usePermissionsStore = create<PermissionsStore>()(
  persist<PermissionsStore>(
    (set, get) => ({
      userPermissions: [],
      userSetores: [],
      allPermissions: [],
      setorPermissions: {},
      
      setUserPermissions: (permissions) => set({ userPermissions: permissions }),
      setUserSetores: (setores) => set({ userSetores: setores }),
      setAllPermissions: (permissions) => set({ allPermissions: permissions }),
      setSetorPermissions: (setor, permissions) => 
        set((state) => ({
          setorPermissions: {
            ...state.setorPermissions,
            [setor]: permissions,
          },
        })),
      
      hasPermission: (resource, action) => {
        const { userPermissions } = get();
        return userPermissions.some(
          (p) => p.resource === resource && p.action === action
        );
      },
      
      hasAnyPermission: (permissions) => {
        const { userPermissions } = get();
        return permissions.some((perm) => {
          const [resource, action] = perm.split("_");
          return userPermissions.some(
            (p) => p.resource === resource && p.action === action
          );
        });
      },
      
      hasAllPermissions: (permissions) => {
        const { userPermissions } = get();
        return permissions.every((perm) => {
          const [resource, action] = perm.split("_");
          return userPermissions.some(
            (p) => p.resource === resource && p.action === action
          );
        });
      },
      
      hasSetor: (setor) => {
        const { userSetores } = get();
        return userSetores.includes(setor);
      },
      
      hasAnySetor: (setores) => {
        const { userSetores } = get();
        return setores.some((setor) => userSetores.includes(setor));
      },
      
      clearPermissions: () => set({
        userPermissions: [],
        userSetores: [],
        setorPermissions: {},
      }),
    }),
    { name: "erp-permissions" },
  ),
);

// Hook customizado para usar permissões
export function usePermissions() {
  const store = usePermissionsStore();
  
  return {
    ...store,
    // Wrappers convenientes
    canCreate: (resource: string) => store.hasPermission(resource, "create"),
    canRead: (resource: string) => store.hasPermission(resource, "read"),
    canUpdate: (resource: string) => store.hasPermission(resource, "update"),
    canDelete: (resource: string) => store.hasPermission(resource, "delete"),
    canExport: (resource: string) => store.hasPermission(resource, "export"),
    canImport: (resource: string) => store.hasPermission(resource, "import"),
    canApprove: (resource: string) => store.hasPermission(resource, "approve"),
    isAdmin: (resource: string) => store.hasPermission(resource, "admin"),
  };
}
