import type { LucideIcon } from "lucide-react";

export type ServiceOrderStatus =
  | "orcamento"
  | "venda"
  | "engenharia"
  | "pcp"
  | "corte"
  | "dobra"
  | "solda"
  | "montagem"
  | "acabamento"
  | "polimento"
  | "expedicao";

export type ModuleKey =
  | "dashboard"
  | "comercial"
  | "orcamentos"
  | "vendas"
  | "engenharia"
  | "estrutura-produto"
  | "producao"
  | "pcp"
  | "fluxo-producao"
  | "estoque"
  | "compras"
  | "financeiro"
  | "rh"
  | "qualidade"
  | "assistencia-tecnica"
  | "configuracoes"
  | "usuarios-permissoes"
  | "etiquetas";

export interface IndustrialModule {
  key: ModuleKey;
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  group: string;
  accent: string;
}

export interface ServiceOrder {
  id: number;
  number: string;
  client: string;
  product: string;
  quantity: number;
  currentSector: string;
  status: ServiceOrderStatus;
  priority: "baixa" | "normal" | "alta" | "critica";
  deliveryDate: string;
  progress: number;
  slaHours: number;
  elapsedHours: number;
  operator: string;
  margin: number;
}

export interface SectorLoad {
  sector: string;
  orders: number;
  capacity: number;
  efficiency: number;
  status: "operando" | "atencao" | "gargalo" | "parado";
}

export interface MaterialStock {
  code: string;
  material: string;
  category: string;
  location: string;
  available: number;
  reserved: number;
  unit: string;
  lot: string;
  status: "ok" | "baixo" | "critico";
}
