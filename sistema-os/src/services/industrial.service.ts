import { industrialApi } from "@/api/industrial.api";
import type { ServiceOrderStatus } from "@/types/industrial";

const sectorSequence: ServiceOrderStatus[] = [
  "orcamento",
  "venda",
  "engenharia",
  "pcp",
  "corte",
  "dobra",
  "solda",
  "montagem",
  "acabamento",
  "polimento",
  "expedicao",
];

export const industrialService = {
  dashboard: industrialApi.dashboard,
  serviceOrders: industrialApi.serviceOrders,
  stock: industrialApi.stock,
  pcpPlans: industrialApi.pcpPlans,
  moduleRows: industrialApi.moduleRows,
  moveOrder: industrialApi.moveOrder,

  nextSector(current: ServiceOrderStatus) {
    const index = sectorSequence.indexOf(current);
    return sectorSequence[Math.min(index + 1, sectorSequence.length - 1)];
  },

  calculateSlaRisk(elapsedHours: number, slaHours: number) {
    const usage = elapsedHours / slaHours;
    if (usage >= 1) return "critico";
    if (usage >= 0.85) return "gargalo";
    if (usage >= 0.65) return "atencao";
    return "ok";
  },
};
