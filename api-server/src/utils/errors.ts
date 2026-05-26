export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number = 400,
    public readonly code: string = "ERROR",
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Recurso") {
    super(`${resource} não encontrado`, 404, "NOT_FOUND");
  }
}

export class ForbiddenError extends AppError {
  constructor() {
    super("Acesso negado", 403, "FORBIDDEN");
  }
}

export class ValidationError extends AppError {
  constructor(details?: unknown) {
    super("Dados inválidos", 422, "VALIDATION_ERROR", details);
  }
}
