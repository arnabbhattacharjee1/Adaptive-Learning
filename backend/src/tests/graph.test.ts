import { describe, expect, it } from 'vitest';
import { validateDAG } from '../engine/graph.js';
import { LearningNode, NodeEdge } from '../types.js';

const nodeA: LearningNode = { id: 'A', code: 'A', title: 'Node A', description: '', category: 'CS', estimatedMinutes: 10, difficulty: 'beginner' };
const nodeB: LearningNode = { id: 'B', code: 'B', title: 'Node B', description: '', category: 'CS', estimatedMinutes: 10, difficulty: 'beginner' };
const nodeC: LearningNode = { id: 'C', code: 'C', title: 'Node C', description: '', category: 'CS', estimatedMinutes: 10, difficulty: 'beginner' };

describe('Knowledge Graph DAG Validation & Cycle Detection', () => {
  it('validates a correct acyclic graph (A -> B -> C)', () => {
    const nodes = [nodeA, nodeB, nodeC];
    const edges: NodeEdge[] = [
      { parentNodeId: 'A', childNodeId: 'B' },
      { parentNodeId: 'B', childNodeId: 'C' },
    ];

    const result = validateDAG(nodes, edges);
    expect(result.hasCycle).toBe(false);
    expect(result.sortedNodes).toEqual(['A', 'B', 'C']);
  });

  it('detects a cycle (A -> B -> C -> A) and returns cycle path', () => {
    const nodes = [nodeA, nodeB, nodeC];
    const edges: NodeEdge[] = [
      { parentNodeId: 'A', childNodeId: 'B' },
      { parentNodeId: 'B', childNodeId: 'C' },
      { parentNodeId: 'C', childNodeId: 'A' }, // Creates cycle!
    ];

    const result = validateDAG(nodes, edges);
    expect(result.hasCycle).toBe(true);
    expect(result.cyclePath).toBeDefined();
    expect(result.cyclePath?.length).toBeGreaterThan(0);
  });
});
