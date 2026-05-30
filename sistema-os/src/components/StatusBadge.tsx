import { cn } from "@/lib/utils";

type Status =
  | "pendente" | "em_projeto" | "em_revisao" | "em_producao"
  | "concluida" | "cancelada" | "convertido"
  | "em_andamento" | "PENDENTE" | "PAGO"
  | "autorizacao" | "corte" | "dobra" | "solda"
  | "refrigeracao" | "acabamento" | "finalizacao" | "montagem"
  | string;

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  pendente:      { label: "Pendente",      classes: "bg-yellow-500/15 text-yellow-500 border-yellow-500/20" },
  em_projeto:    { label: "Em Projeto",    classes: "bg-blue-400/15 text-blue-400 border-blue-400/20" },
  em_revisao:    { label: "Em Revisão",    classes: "bg-purple-400/15 text-purple-400 border-purple-400/20" },
  em_producao:   { label: "Em Produção",   classes: "bg-blue-500/15 text-blue-500 border-blue-500/20" },
  em_andamento:  { label: "Em Andamento",  classes: "bg-blue-500/15 text-blue-500 border-blue-500/20" },
  concluida:     { label: "Concluída",     classes: "bg-green-500/15 text-green-500 border-green-500/20" },
  cancelada:     { label: "Cancelada",     classes: "bg-red-500/15 text-red-500 border-red-500/20" },
  convertido:    { label: "Convertido",    classes: "bg-teal-500/15 text-teal-500 border-teal-500/20" },
  PENDENTE:      { label: "Pendente",      classes: "bg-yellow-500/15 text-yellow-500 border-yellow-500/20" },
  PAGO:          { label: "Pago",          classes: "bg-green-500/15 text-green-500 border-green-500/20" },
  autorizacao:   { label: "Autorização",   classes: "bg-white/10 text-white/80 border-white/15" },
  corte:         { label: "Corte",         classes: "bg-orange-400/15 text-orange-400 border-orange-400/20" },
  dobra:         { label: "Dobra",         classes: "bg-amber-400/15 text-amber-400 border-amber-400/20" },
  solda:         { label: "Solda",         classes: "bg-red-400/15 text-red-400 border-red-400/20" },
  refrigeracao:  { label: "Refrigeração",  classes: "bg-cyan-400/15 text-cyan-400 border-cyan-400/20" },
  acabamento:    { label: "Acabamento",    classes: "bg-violet-400/15 text-violet-400 border-violet-400/20" },
  finalizacao:   { label: "Finalização",   classes: "bg-indigo-400/15 text-indigo-400 border-indigo-400/20" },
  montagem:      { label: "Montagem",      classes: "bg-sky-400/15 text-sky-400 border-sky-400/20" },
};

interface Props {
  status: Status;
  className?: string;
}

export function StatusBadge({ status, className }: Props) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    classes: "bg-white/10 text-white/80 border-white/15",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border",
        config.classes,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
