import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { industrialService } from "@/services/industrial.service";

export function useIndustrialDashboard() {
  return useQuery({
    queryKey: ["industrial", "dashboard"],
    queryFn: industrialService.dashboard,
    refetchInterval: 30000,
  });
}

export function useIndustrialOrders() {
  return useQuery({
    queryKey: ["industrial", "service-orders"],
    queryFn: industrialService.serviceOrders,
    refetchInterval: 30000,
  });
}

export function useIndustrialStock() {
  return useQuery({
    queryKey: ["industrial", "stock"],
    queryFn: industrialService.stock,
  });
}

export function useIndustrialPcpPlans() {
  return useQuery({
    queryKey: ["industrial", "pcp", "plans"],
    queryFn: industrialService.pcpPlans,
    refetchInterval: 30000,
  });
}

export function useIndustrialModuleRows(moduleKey: string) {
  return useQuery({
    queryKey: ["industrial", "module", moduleKey],
    queryFn: () => industrialService.moduleRows(moduleKey),
    refetchInterval: 30000,
  });
}

export function useMoveIndustrialOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, sector }: { orderId: number; sector: string }) =>
      industrialService.moveOrder(orderId, sector),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["industrial"] });
    },
  });
}
