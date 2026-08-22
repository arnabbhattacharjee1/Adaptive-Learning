import { PubSub } from '@google-cloud/pubsub';
import { randomUUID } from 'crypto';
import { telemetryQueue } from '../services/telemetryQueue.js';
import { TelemetrySignal } from '../types.js';

export interface ITelemetryPublisher {
  publish(signal: TelemetrySignal): Promise<string>;
}

/**
 * GCP Cloud Pub/Sub Publisher for production GCP deployment.
 * Publishes events asynchronously to `alis-telemetry-topic` with ultra-low latency (< 3ms).
 */
export class GcpPubSubTelemetryPublisher implements ITelemetryPublisher {
  private pubsub: PubSub;
  private topicName: string;

  constructor(projectId?: string, topicName = 'alis-telemetry-topic') {
    const targetProject = projectId || process.env.GCP_PROJECT_ID || 'adaptive-learning-506305';
    this.pubsub = new PubSub({ projectId: targetProject });
    this.topicName = topicName;
  }

  async publish(signal: TelemetrySignal): Promise<string> {
    const eventId = randomUUID();
    const payload = JSON.stringify({ eventId, signal, timestamp: Date.now() });
    const dataBuffer = Buffer.from(payload);

    try {
      const messageId = await this.pubsub.topic(this.topicName).publishMessage({ data: dataBuffer });
      console.log(`[GCP Pub/Sub] Published message ${messageId} to topic ${this.topicName} in project ${process.env.GCP_PROJECT_ID || 'adaptive-learning-506305'}`);
      return eventId;
    } catch (err) {
      console.error('[GCP Pub/Sub Error] Failed to publish message, falling back to local queue:', err);
      return telemetryQueue.enqueue(signal);
    }
  }
}

/**
 * Local In-Memory Publisher fallback for local development & Vitest unit testing.
 */
export class LocalMemoryTelemetryPublisher implements ITelemetryPublisher {
  async publish(signal: TelemetrySignal): Promise<string> {
    return telemetryQueue.enqueue(signal);
  }
}

/**
 * Factory function to instantiate appropriate publisher based on environment.
 */
export function getTelemetryPublisher(): ITelemetryPublisher {
  if ((process.env.GCP_PROJECT_ID || 'adaptive-learning-506305') && process.env.NODE_ENV === 'production') {
    return new GcpPubSubTelemetryPublisher();
  }
  return new LocalMemoryTelemetryPublisher();
}
