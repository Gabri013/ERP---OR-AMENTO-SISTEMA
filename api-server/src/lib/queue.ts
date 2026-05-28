import Queue, { Job as BullJob, QueueOptions } from "bull";
import { logger } from "./logger";

type QueueData = Record<string, unknown>;

type QueueProcessor<T extends QueueData> = (job: LocalJob<T> | BullJob<T>) => Promise<any>;

interface QueueAdapter<T extends QueueData> {
  add(data: T, opts?: any): Promise<BullJob<T> | LocalJob<T>>;
  process(fn: QueueProcessor<T>): void;
  on(event: string, listener: (...args: unknown[]) => void): void;
  getJob(id: string | number): Promise<BullJob<T> | LocalJob<T> | null>;
}

export interface LocalJob<T extends QueueData> {
  id: string;
  data: T;
  state: string;
  progress: number;
  returned?: unknown;
  failedReason?: unknown;
  timestamp: number;
}

class LocalQueue<T extends QueueData> implements QueueAdapter<T> {
  private jobs = new Map<string, LocalJob<T>>();
  private listeners = new Map<string, Array<(...args: unknown[]) => void>>();
  private processor?: QueueProcessor<T>;

  public async add(data: T): Promise<LocalJob<T>> {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const job: LocalJob<T> = {
      id,
      data,
      state: "waiting",
      progress: 0,
      timestamp: Date.now(),
    };

    this.jobs.set(id, job);
    setImmediate(() => this.runJob(job));

    return job;
  }

  public process(fn: QueueProcessor<T>): void {
    this.processor = fn;
  }

  public on(event: string, listener: (...args: unknown[]) => void): void {
    const existing = this.listeners.get(event) ?? [];
    existing.push(listener);
    this.listeners.set(event, existing);
  }

  public async getJob(id: string | number): Promise<LocalJob<T> | null> {
    return this.jobs.get(String(id)) ?? null;
  }

  private emit(event: string, ...args: unknown[]): void {
    const listeners = this.listeners.get(event) ?? [];
    listeners.forEach((listener) => listener(...args));
  }

  private async runJob(job: LocalJob<T>): Promise<void> {
    if (!this.processor) {
      return;
    }

    job.state = "active";
    try {
      const result = await this.processor(job);
      job.state = "completed";
      job.returned = result;
      this.emit("completed", job, result);
    } catch (error) {
      job.state = "failed";
      job.failedReason = error;
      this.emit("failed", job, error);
    }
  }
}

function createQueue<T extends QueueData>(name: string): QueueAdapter<T> {
  const isTest = process.env.NODE_ENV === "test" || process.env.JEST_WORKER_ID !== undefined;
  if (isTest) {
    logger.info({ queue: name }, "Test environment detected, using in-memory queue fallback");
    return new LocalQueue<T>();
  }

  const redisOptions = process.env.REDIS_URL
    ? { url: process.env.REDIS_URL }
    : process.env.REDIS_HOST
    ? {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT ?? 6379),
        password: process.env.REDIS_PASSWORD,
      }
    : undefined;

  if (!redisOptions) {
    logger.info({ queue: name }, "Redis not configured, using in-memory queue fallback");
    return new LocalQueue<T>();
  }

  const options: QueueOptions = {
    redis: redisOptions,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
    },
  };

  const queue = new Queue<T>(name, options);
  queue.on("error", (err) => logger.error({ err, queue: name }, "Queue error"));
  queue.on("failed", (job, err) => logger.warn({ jobId: job?.id, err, queue: name }, "Queue job failed"));
  queue.on("completed", (job) => logger.info({ jobId: job?.id, queue: name }, "Queue job completed"));

  return queue as unknown as QueueAdapter<T>;
}

export type EmailQueuePayload = {
  type: "orcamento" | "os" | "venda";
  clienteEmail: string;
  numero: string;
  modelId: number;
};

export type PdfQueuePayload = {
  type: "orcamento" | "os";
  id: number;
};

export type ReportQueuePayload = {
  type: "vendas" | "financeiro";
  userId?: number;
  query?: Record<string, unknown>;
};

export const emailQueue = createQueue<EmailQueuePayload>("emailQueue");
export const pdfQueue = createQueue<PdfQueuePayload>("pdfQueue");
export const reportQueue = createQueue<ReportQueuePayload>("reportQueue");
