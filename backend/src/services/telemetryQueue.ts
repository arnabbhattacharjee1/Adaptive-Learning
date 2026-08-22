import { randomUUID } from 'crypto';
import { getAllEdges, getAllNodes, getNodeById, getUserNodeState, saveTelemetryEvent, upsertUserNodeState } from '../db/index.js';
import { getChildNodes, getPrerequisites } from '../engine/graph.js';
import { evaluateRoutingDecision } from '../engine/routing.js';
import { RoutingDecision, TelemetrySignal, UserNodeState } from '../types.js';

interface QueuedItem {
  eventId: string;
  signal: TelemetrySignal;
}

class TelemetryQueueService {
  private queue: QueuedItem[] = [];
  private isProcessing = false;
  private listeners: Array<(decision: RoutingDecision) => void> = [];

  public enqueue(signal: TelemetrySignal): string {
    const eventId = randomUUID();
    this.queue.push({ eventId, signal });
    setImmediate(() => this.processNext());
    return eventId;
  }

  public onRoutingDecision(listener: (decision: RoutingDecision) => void) {
    this.listeners.push(listener);
  }

  private async processNext() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    const item = this.queue.shift();
    if (item) {
      try {
        const { eventId, signal } = item;

        // 1. Save append-only event to telemetry_events firehose
        saveTelemetryEvent(eventId, signal);

        // 2. Fetch current node & existing user state
        const currentNode = getNodeById(signal.nodeId);
        if (currentNode) {
          const allNodes = getAllNodes();
          const allEdges = getAllEdges();

          const existingState = getUserNodeState(signal.userId, signal.nodeId) ?? {
            userId: signal.userId,
            nodeId: signal.nodeId,
            status: 'in_progress',
            highestQuizScore: 0,
            totalTimeSeconds: 0,
            confidenceLevel: 0,
            attemptsCount: 0,
            remediationCount: 0,
            updatedAt: new Date().toISOString(),
          };

          const prerequisites = getPrerequisites(signal.nodeId, allNodes, allEdges);
          const childNodes = getChildNodes(signal.nodeId, allNodes, allEdges);

          // 3. Evaluate Routing Logic Engine
          const decision = evaluateRoutingDecision({
            signal,
            currentNode,
            userState: existingState,
            prerequisites,
            childNodes,
          });

          // 4. Update materialized user_node_state
          const isRemediation = decision.action === 'REMEDIATION' || decision.action === 'CALIBRATION_DROP';
          const isAttempt = signal.eventType === 'quiz_submit' || signal.eventType === 'skip';

          const updatedState: UserNodeState = {
            userId: signal.userId,
            nodeId: signal.nodeId,
            status: decision.updatedStatus,
            highestQuizScore: signal.quizScore ?? existingState.highestQuizScore,
            totalTimeSeconds: signal.timeOnTaskSeconds ?? 0,
            confidenceLevel: signal.confidenceLevel ?? existingState.confidenceLevel,
            attemptsCount: isAttempt ? 1 : 0,
            remediationCount: isRemediation ? 1 : 0,
            updatedAt: new Date().toISOString(),
          };

          upsertUserNodeState(updatedState);

          // Auto-unlock child nodes if mastered
          if (decision.updatedStatus === 'mastered') {
            for (const child of childNodes) {
              const childState = getUserNodeState(signal.userId, child.id);
              if (!childState || childState.status === 'locked') {
                upsertUserNodeState({
                  userId: signal.userId,
                  nodeId: child.id,
                  status: 'available',
                  highestQuizScore: 0,
                  totalTimeSeconds: 0,
                  confidenceLevel: 0,
                  attemptsCount: 0,
                  remediationCount: 0,
                  updatedAt: new Date().toISOString(),
                });
              }
            }
          }

          // Broadcast decision
          this.listeners.forEach(fn => fn(decision));
        }
      } catch (err) {
        console.error('Error processing telemetry queue item:', err);
      }
    }

    this.isProcessing = false;
    if (this.queue.length > 0) {
      setImmediate(() => this.processNext());
    }
  }
}

export const telemetryQueue = new TelemetryQueueService();
