/**
 * State Machine para validação de transições de status
 * Garante que transições inválidas não ocorram no sistema
 */

// Transições válidas para Orçamentos
const ORCAMENTO_TRANSITIONS: Record<string, string[]> = {
  pendente: ['em_projeto', 'em_revisao', 'convertido', 'cancelada'],
  em_projeto: ['em_revisao', 'em_producao', 'concluida', 'cancelada'],
  em_revisao: ['em_projeto', 'em_producao', 'concluida', 'cancelada'],
  em_producao: ['concluida', 'cancelada'],
  concluida: [], // Estado final
  cancelada: [], // Estado final
  convertido: [], // Estado final
};

// Transições válidas para Vendas
const VENDA_TRANSITIONS: Record<string, string[]> = {
  em_andamento: ['concluida', 'cancelada'],
  concluida: [], // Estado final
  cancelada: [], // Estado final
};

// Transições válidas para OS
const OS_TRANSITIONS: Record<string, string[]> = {
  pendente: ['em_projeto', 'em_revisao', 'em_producao', 'cancelada'],
  em_projeto: ['em_revisao', 'em_producao', 'cancelada'],
  em_revisao: ['em_projeto', 'em_producao', 'cancelada'],
  em_producao: ['concluida', 'cancelada'],
  concluida: [], // Estado final
  cancelada: [], // Estado final
};

// Transições válidas para Etapas de Produção
const ETAPA_TRANSITIONS: Record<string, string[]> = {
  autorizacao: ['corte', 'concluida'],
  corte: ['dobra', 'concluida'],
  dobra: ['solda', 'concluida'],
  solda: ['refrigeracao', 'concluida'],
  refrigeracao: ['acabamento', 'concluida'],
  acabamento: ['finalizacao', 'concluida'],
  finalizacao: ['montagem', 'concluida'],
  montagem: ['concluida'],
  concluida: [], // Estado final
};

/**
 * Valida se uma transição de status é válida
 */
export function canTransition(
  currentStatus: string,
  newStatus: string,
  type: 'orcamento' | 'venda' | 'os' | 'etapa'
): { valid: boolean; error?: string } {
  const transitions = type === 'orcamento' ? ORCAMENTO_TRANSITIONS :
                      type === 'venda' ? VENDA_TRANSITIONS :
                      type === 'os' ? OS_TRANSITIONS :
                      ETAPA_TRANSITIONS;

  const validTransitions = transitions[currentStatus] || [];

  if (!validTransitions.includes(newStatus)) {
    return {
      valid: false,
      error: `Transição inválida de ${currentStatus} para ${newStatus} em ${type}. Transições permitidas: ${validTransitions.join(', ') || 'nenhuma'}`
    };
  }

  return { valid: true };
}

/**
 * Valida transição de orçamento
 */
export function canTransitionOrcamento(currentStatus: string, newStatus: string) {
  return canTransition(currentStatus, newStatus, 'orcamento');
}

/**
 * Valida transição de venda
 */
export function canTransitionVenda(currentStatus: string, newStatus: string) {
  return canTransition(currentStatus, newStatus, 'venda');
}

/**
 * Valida transição de OS
 */
export function canTransitionOS(currentStatus: string, newStatus: string) {
  return canTransition(currentStatus, newStatus, 'os');
}

/**
 * Valida transição de etapa de produção
 */
export function canTransitionEtapa(currentEtapa: string, newEtapa: string) {
  return canTransition(currentEtapa, newEtapa, 'etapa');
}

/**
 * Obtém próximos status possíveis
 */
export function getNextPossibleStatuses(
  currentStatus: string,
  type: 'orcamento' | 'venda' | 'os' | 'etapa'
): string[] {
  const transitions = type === 'orcamento' ? ORCAMENTO_TRANSITIONS :
                      type === 'venda' ? VENDA_TRANSITIONS :
                      type === 'os' ? OS_TRANSITIONS :
                      ETAPA_TRANSITIONS;

  return transitions[currentStatus] || [];
}

/**
 * Verifica se um status é final (não tem transições)
 */
export function isFinalStatus(status: string, type: 'orcamento' | 'venda' | 'os' | 'etapa'): boolean {
  return getNextPossibleStatuses(status, type).length === 0;
}
