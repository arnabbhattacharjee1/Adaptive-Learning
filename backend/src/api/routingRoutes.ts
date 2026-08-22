import { Router } from 'express';
import { getAllEdges, getAllNodes, getAllUserNodeStates, getNodeById, getUserNodeState } from '../db/index.js';
import { getChildNodes, getPrerequisites } from '../engine/graph.js';
import { evaluateRoutingDecision } from '../engine/routing.js';
import { AuthenticatedRequest, requireAuth } from '../middleware/auth.js';
import { generateDynamicModuleContent } from '../services/contentGenerator.js';
import { RoutingEvaluateSchema } from '../validation/schemas.js';

export const routingRouter = Router();

// Get Knowledge Graph structure (Nodes & Edges)
routingRouter.get('/graph', (req, res) => {
  const nodes = getAllNodes();
  const edges = getAllEdges();
  return res.json({ nodes, edges });
});

// Get user progress state across all nodes
routingRouter.get('/user-state', requireAuth, (req: AuthenticatedRequest, res) => {
  const userId = req.user!.userId;
  const states = getAllUserNodeStates(userId);
  return res.json({ userId, states });
});

// GET dynamically generated module content & adaptive quiz
routingRouter.get('/nodes/:id/content', (req, res) => {
  const nodeId = req.params.id;
  const userId = req.query.userId as string | undefined;

  const node = getNodeById(nodeId);
  if (!node) {
    return res.status(404).json({ error: `Node with id '${nodeId}' not found.` });
  }

  const userState = userId ? getUserNodeState(userId, nodeId) : undefined;
  const dynamicContent = generateDynamicModuleContent(node, userState);

  return res.json({ node, dynamicContent });
});

// Evaluate routing logic for a specific node & return recommendation
routingRouter.post('/evaluate', requireAuth, (req: AuthenticatedRequest, res) => {
  const parseResult = RoutingEvaluateSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: 'Validation failed', details: parseResult.error.flatten() });
  }

  const userId = req.user!.userId;
  const { nodeId, signal } = parseResult.data;

  const currentNode = getNodeById(nodeId);
  if (!currentNode) {
    return res.status(404).json({ error: `Node with id '${nodeId}' not found.` });
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
});
