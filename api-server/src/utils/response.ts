export const response = {
  success: <T>(data: T, meta?: unknown) => ({
    success: true,
    data,
    meta: meta ?? null,
    error: null,
  }),
  error: (message: string, code = "ERROR", details?: unknown) => ({
    success: false,
    data: null,
    error: {
      message,
      code,
      details: details ?? null,
    },
  }),
};
