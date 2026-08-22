import { Request, Response } from 'express';
import { getAllEdges, getAllNodes, getAllUserNodeStates, getNodeById, getUserNodeState } from '../db/index.js';
import { getChildNodes, getPrerequisites } from '../engine/graph.js';
import { evaluateRoutingDecision } from '../engine/routing.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { generateDynamicModuleContent } from '../services/contentGenerator.js';
import { RoutingEvaluateSchema } from '../validation/schemas.js';

/**
 * RoutingController
 * Manages Knowledge Graph queries, dynamic content generation, and adaptive routing evaluation.
 */
export class RoutingController {
  /**
   * Retrieves full Knowledge Graph structure (Nodes & Edges).
   */
  static async getGraph(req: Request, res: Response) {
    const nodes = getAllNodes();
    const edges = getAllEdges();
    return res.json({ nodes, edges });
  }

  /**
   * Retrieves user node state progression across all Knowledge Graph nodes.
   */
  static async getUserState(req: AuthenticatedRequest, res: Response) {
    const userId = req.user!.userId;
    const states = getAllUserNodeStates(userId);
    return res.json({ userId, states });
  }

  /**
   * Retrieves dynamically synthesized module content and unique adaptive quiz.
   */
  static async getNodeContent(req: Request, res: Response) {
    const nodeId = req.params.id;
    const userId = req.query.userId as string | undefined;

    const node = getNodeById(nodeId);
    if (!node) {
      throw new AppError(`Node with id '${nodeId}' not found.`, 404);
    }

    const userState = userId ? getUserNodeState(userId, nodeId) : undefined;
    const dynamicContent = generateDynamicModuleContent(node, userState);

    return res.json({ node, dynamicContent });
  }

  /**
   * Evaluates telemetry signals against pure routing rules to recommend next action.
   */
  static async evaluate(req: AuthenticatedRequest, res: Response) {
    const parseResult = RoutingEvaluateSchema.safeParse(req.body);
    if (!parseResult.success) {
      throw new AppError('Validation failed', 400);
    }

    const userId = req.user!.userId;
    const { nodeId, signal } = parseResult.data;

    const currentNode = getNodeById(nodeId);
    if (!currentNode) {
      throw new AppError(`Node with id '${nodeId}' not found.`, 404);
    }

    const allNodes = getAllNodes();
    const allEdges = getAllEdges();
    const existingState = getUserNodeState(userId, nodeId) ?? {
      userId,
      nodeId,
      status: 'available',
      highestQuizScore: 0,
      totalTimeSeconds: 0,
      confidenceLevel: 0,
      attemptsCount: 0,
      remediationCount: 0,
      updatedAt: new Date().toISOString(),
    };

    const prerequisites = getPrerequisites(nodeId, allNodes, allEdges);
    const childNodes = getChildNodes(nodeId, allNodes, allEdges);

    const telemetrySignal = signal ? { ...signal, userId } : { userId, nodeId, eventType: 'heartbeat' as const };

    const decision = evaluateRoutingDecision({
      signal: telemetrySignal,
      currentNode,
      userState: existingState,
      prerequisites,
      childNodes,
    });

    return res.json({ decision, currentNode, existingState });
  }
}
