import { LearningNode, NodeEdge } from '../types.js';

export interface GraphValidationResult {
  hasCycle: boolean;
  cyclePath?: string[];
  sortedNodes?: string[];
}

/**
 * Knowledge Graph DAG Engine.
 * Implements cycle detection via Topological Sort (Kahn's Algorithm).
 */
export function validateDAG(nodes: LearningNode[], edges: NodeEdge[]): GraphValidationResult {
  const inDegree: Record<string, number> = {};
  const adjList: Record<string, string[]> = {};
  const nodeMap = new Map<string, LearningNode>();

  for (const node of nodes) {
    nodeMap.set(node.id, node);
    inDegree[node.id] = 0;
    adjList[node.id] = [];
  }

  for (const edge of edges) {
    if (!adjList[edge.parentNodeId]) {
      adjList[edge.parentNodeId] = [];
    }
    adjList[edge.parentNodeId].push(edge.childNodeId);
    inDegree[edge.childNodeId] = (inDegree[edge.childNodeId] || 0) + 1;
  }

  // Queue of nodes with 0 in-degree (no prerequisites)
  const queue: string[] = [];
  for (const nodeId in inDegree) {
    if (inDegree[nodeId] === 0) {
      queue.push(nodeId);
    }
  }

  const sorted: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    sorted.push(current);

    const neighbors = adjList[current] || [];
    for (const neighbor of neighbors) {
      inDegree[neighbor]--;
      if (inDegree[neighbor] === 0) {
        queue.push(neighbor);
      }
    }
  }

  if (sorted.length !== nodes.length) {
    // Cycle detected! Find exact cycle path using DFS
    const cyclePath = findCycleDFS(nodes, edges);
    return {
      hasCycle: true,
      cyclePath,
    };
  }

  return {
    hasCycle: false,
    sortedNodes: sorted,
  };
}

function findCycleDFS(nodes: LearningNode[], edges: NodeEdge[]): string[] {
  const adjList: Record<string, string[]> = {};
  for (const node of nodes) {
    adjList[node.id] = [];
  }
  for (const edge of edges) {
    if (adjList[edge.parentNodeId]) {
      adjList[edge.parentNodeId].push(edge.childNodeId);
    }
  }

  const visited = new Set<string>();
  const recStack = new Set<string>();
  const path: string[] = [];

  function dfs(nodeId: string): boolean {
    visited.add(nodeId);
    recStack.add(nodeId);
    path.push(nodeId);

    for (const neighbor of adjList[nodeId] || []) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (recStack.has(neighbor)) {
        path.push(neighbor);
        return true;
      }
    }

    path.pop();
    recStack.delete(nodeId);
    return false;
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      if (dfs(node.id)) return path;
    }
  }

  return path;
}

/**
 * Get direct prerequisites for a target node.
 */
export function getPrerequisites(nodeId: string, nodes: LearningNode[], edges: NodeEdge[]): LearningNode[] {
  const parentIds = edges.filter(e => e.childNodeId === nodeId).map(e => e.parentNodeId);
  return nodes.filter(n => parentIds.includes(n.id));
}

/**
 * Get direct child nodes for a target node.
 */
export function getChildNodes(nodeId: string, nodes: LearningNode[], edges: NodeEdge[]): LearningNode[] {
  const childIds = edges.filter(e => e.parentNodeId === nodeId).map(e => e.childNodeId);
  return nodes.filter(n => childIds.includes(n.id));
}
