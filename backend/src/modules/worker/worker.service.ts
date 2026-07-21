import { Injectable, OnModuleDestroy } from "@nestjs/common";

type JobHandler = (payload: any) => Promise<void>;
type FailedJob = { queueName: string; payload: any; error: string; attempts: number; failedAt: Date };

/**
 * In-process job queue. No Redis required.
 * Supports concurrency, retries, and Dead Letter Queue (DLQ).
 * Upgrade path: replace with BullMQ for Redis-backed persistence.
 */
@Injectable()
export class WorkerService implements OnModuleDestroy {
  private readonly handlers = new Map<string, JobHandler>();
  private readonly queues = new Map<string, Array<{ payload: any; attempts: number }>>();
  private readonly dlq: FailedJob[] = [];
  private readonly maxRetries = 3;
  private readonly concurrency = 5;
  private processing = new Map<string, boolean>();
  private timers: NodeJS.Timeout[] = [];

  registerHandler(queueName: string, handler: JobHandler) {
    this.handlers.set(queueName, handler);
    if (!this.queues.has(queueName)) {
      this.queues.set(queueName, []);
    }
    this.startProcessor(queueName);
  }

  async enqueue(queueName: string, payload: any) {
    if (!this.queues.has(queueName)) {
      this.queues.set(queueName, []);
    }
    this.queues.get(queueName)!.push({ payload, attempts: 0 });
  }

  private startProcessor(queueName: string) {
    const timer = setInterval(async () => {
      if (this.processing.get(queueName)) return;
      const queue = this.queues.get(queueName);
      if (!queue || queue.length === 0) return;

      this.processing.set(queueName, true);
      const batch = queue.splice(0, this.concurrency);

      await Promise.allSettled(
        batch.map(async (job) => {
          const handler = this.handlers.get(queueName);
          if (!handler) return;
          try {
            await handler(job.payload);
          } catch (err: any) {
            job.attempts += 1;
            if (job.attempts < this.maxRetries) {
              // Retry: push back to queue
              queue.push(job);
            } else {
              // Dead Letter Queue
              this.dlq.push({
                queueName,
                payload: job.payload,
                error: err.message || "Unknown error",
                attempts: job.attempts,
                failedAt: new Date(),
              });
              console.error(`[DLQ] Job failed after ${job.attempts} attempts in queue "${queueName}":`, err.message);
            }
          }
        })
      );

      this.processing.set(queueName, false);
    }, 500);

    this.timers.push(timer);
  }

  getDlq() {
    return this.dlq;
  }

  getQueueStats() {
    const stats: Record<string, { pending: number; dlqCount: number }> = {};
    for (const [name, queue] of this.queues.entries()) {
      stats[name] = {
        pending: queue.length,
        dlqCount: this.dlq.filter((j) => j.queueName === name).length,
      };
    }
    return stats;
  }

  onModuleDestroy() {
    this.timers.forEach(clearInterval);
  }
}
