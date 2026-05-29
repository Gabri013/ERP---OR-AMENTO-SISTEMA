// Funções de validação para formulários

export const validators = {
  // Validação de email
  email: (value: string) => {
    if (!value) return "Email é obrigatório";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return "Email inválido";
    return null;
  },

  // Validação de CNPJ
  cnpj: (value: string) => {
    if (!value) return null; // Opcional
    const cnpj = value.replace(/[^\d]/g, "");
    if (cnpj.length !== 14) return "CNPJ deve ter 14 dígitos";
    return null;
  },

  // Validação de CPF
  cpf: (value: string) => {
    if (!value) return null; // Opcional
    const cpf = value.replace(/[^\d]/g, "");
    if (cpf.length !== 11) return "CPF deve ter 11 dígitos";
    return null;
  },

  // Validação de telefone
  telefone: (value: string) => {
    if (!value) return "Telefone é obrigatório";
    const telefone = value.replace(/[^\d]/g, "");
    if (telefone.length < 10) return "Telefone inválido";
    return null;
  },

  // Validação de CEP
  cep: (value: string) => {
    if (!value) return null; // Opcional
    const cep = value.replace(/[^\d]/g, "");
    if (cep.length !== 8) return "CEP deve ter 8 dígitos";
    return null;
  },

  // Validação de valor monetário
  valorMonetario: (value: string) => {
    if (!value) return "Valor é obrigatório";
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) return "Valor deve ser maior que zero";
    return null;
  },

  // Validação de estoque
  estoque: (value: string) => {
    if (!value) return "Estoque é obrigatório";
    const num = parseInt(value);
    if (isNaN(num) || num < 0) return "Estoque deve ser um número não negativo";
    return null;
  },

  // Validação de campo obrigatório
  obrigatorio: (value: string, fieldName: string = "Campo") => {
    if (!value || value.trim() === "") return `${fieldName} é obrigatório`;
    return null;
  },

  // Validação de comprimento mínimo
  minLength: (value: string, min: number, fieldName: string = "Campo") => {
    if (!value) return `${fieldName} é obrigatório`;
    if (value.length < min) return `${fieldName} deve ter no mínimo ${min} caracteres`;
    return null;
  },

  // Validação de comprimento máximo
  maxLength: (value: string, max: number, fieldName: string = "Campo") => {
    if (value && value.length > max) return `${fieldName} deve ter no máximo ${max} caracteres`;
    return null;
  },
};

// Função para sanitizar input (prevenir XSS)
export const sanitizeInput = (value: string): string => {
  return value
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
};

// Função para validar formulário completo
export const validateForm = <T extends Record<string, string>>(
  data: T,
  rules: Partial<Record<keyof T, (value: string) => string | null>>
): { valid: boolean; errors: Partial<Record<keyof T, string>> } => {
  const errors: Partial<Record<keyof T, string>> = {};
  let valid = true;

  Object.keys(rules).forEach((key) => {
    const rule = rules[key as keyof T];
    if (rule) {
      const error = rule(data[key as keyof T]);
      if (error) {
        errors[key as keyof T] = error;
        valid = false;
      }
    }
  });

  return { valid, errors };
};
