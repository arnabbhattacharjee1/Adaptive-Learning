import { describe, expect, it } from 'vitest';
import { evaluateRoutingDecision } from '../engine/routing.js';
import { LearningNode, TelemetrySignal, UserNodeState } from '../types.js';

const mockNode: LearningNode = {
  id: 'LA-102',
  code: 'LA-102',
  title: 'Medical Record (APS) Assembly',
  description: 'Evaluate underwriting risk parameters and medical records',
  category: '1. New Business & Underwriting',
  estimatedMinutes: 20,
  difficulty: 'intermediate',
};

const mockPrereq: LearningNode = {
  id: 'LA-101',
  code: 'LA-101',
  title: 'Intake & KYC Operations',
  description: 'Policy application processing and compliance clearance',
  category: '1. New Business & Underwriting',
  estimatedMinutes: 15,
  difficulty: 'beginner',
};

const mockChild: LearningNode = {
  id: 'LA-103',
  code: 'LA-103',
  title: 'Policy Issuance & Free-Look Management',
  description: 'Contract creation and free-look period processing',
  category: '1. New Business & Underwriting',
  estimatedMinutes: 25,
  difficulty: 'advanced',
};

const baseUserState: UserNodeState = {
  userId: 'user-1',
  nodeId: 'LA-102',
  status: 'in_progress',
  highestQuizScore: 0,
  totalTimeSeconds: 300,
  confidenceLevel: 3,
  attemptsCount: 1,
  remediationCount: 0,
  updatedAt: new Date().toISOString(),
};

describe('Routing Engine Boolean Logic & PRD Rules for L&A Insurance', () => {
  it('triggers FAST_TRACK when skip is performed with high quiz score (>= 80%)', () => {
    const signal: TelemetrySignal = {
      userId: 'user-1',
      nodeId: 'LA-102',
      eventType: 'skip',
      quizScore: 85,
    };

    const decision = evaluateRoutingDecision({
      signal,
      currentNode: mockNode,
      userState: baseUserState,
      prerequisites: [mockPrereq],
      childNodes: [mockChild],
    });

    expect(decision.action).toBe('FAST_TRACK');
    expect(decision.updatedStatus).toBe('mastered');
    expect(decision.targetNodeId).toBe(mockChild.id);
  });

  it('triggers STANDARD_PROGRESSION when quiz score >= 70% with normal metrics', () => {
    const signal: TelemetrySignal = {
      userId: 'user-1',
      nodeId: 'LA-102',
      eventType: 'quiz_submit',
      quizScore: 75,
      confidenceLevel: 4,
      timeOnTaskSeconds: 600,
    };

    const decision = evaluateRoutingDecision({
      signal,
      currentNode: mockNode,
      userState: baseUserState,
      prerequisites: [mockPrereq],
      childNodes: [mockChild],
    });

    expect(decision.action).toBe('STANDARD_PROGRESSION');
    expect(decision.updatedStatus).toBe('mastered');
    expect(decision.targetNodeId).toBe(mockChild.id);
  });

  it('triggers REMEDIATION when quiz score is failing (< 60%)', () => {
    const signal: TelemetrySignal = {
      userId: 'user-1',
      nodeId: 'LA-102',
      eventType: 'quiz_submit',
      quizScore: 45,
      confidenceLevel: 2,
    };

    const decision = evaluateRoutingDecision({
      signal,
      currentNode: mockNode,
      userState: baseUserState,
      prerequisites: [mockPrereq],
      childNodes: [mockChild],
    });

    expect(decision.action).toBe('REMEDIATION');
    expect(decision.updatedStatus).toBe('remediation');
    expect(decision.targetNodeId).toBe(mockPrereq.id);
  });

  it('triggers REMEDIATION when time-on-task exceeds 2.5x estimated time', () => {
    const signal: TelemetrySignal = {
      userId: 'user-1',
      nodeId: 'LA-102',
      eventType: 'heartbeat',
      timeOnTaskSeconds: 3200,
    };

    const decision = evaluateRoutingDecision({
      signal,
      currentNode: mockNode,
      userState: baseUserState,
      prerequisites: [mockPrereq],
      childNodes: [mockChild],
    });

    expect(decision.action).toBe('REMEDIATION');
    expect(decision.updatedStatus).toBe('remediation');
    expect(decision.targetNodeId).toBe(mockPrereq.id);
  });

  it('prevents INFINITE REMEDIATION when remediation count reaches 3 or more', () => {
    const highRemediationState: UserNodeState = {
      ...baseUserState,
      remediationCount: 3,
    };

    const signal: TelemetrySignal = {
      userId: 'user-1',
      nodeId: 'LA-102',
      eventType: 'quiz_submit',
      quizScore: 40,
    };

    const decision = evaluateRoutingDecision({
      signal,
      currentNode: mockNode,
      userState: highRemediationState,
      prerequisites: [mockPrereq],
      childNodes: [mockChild],
    });

    expect(decision.action).toBe('REMEDIATION');
    expect(decision.reason).toContain('Remediation threshold exceeded');
  });

  it('triggers LATERAL_REINFORCEMENT when quiz score >= 85% but self-reported confidence <= 2', () => {
    const signal: TelemetrySignal = {
      userId: 'user-1',
      nodeId: 'LA-102',
      eventType: 'quiz_submit',
      quizScore: 90,
      confidenceLevel: 1,
    };

    const decision = evaluateRoutingDecision({
      signal,
      currentNode: mockNode,
      userState: baseUserState,
      prerequisites: [mockPrereq],
      childNodes: [mockChild],
    });

    expect(decision.action).toBe('LATERAL_REINFORCEMENT');
    expect(decision.updatedStatus).toBe('reinforcement');
    expect(decision.targetNodeId).toBe(mockNode.id);
  });

  it('triggers CALIBRATION_DROP when low score (< 50%) is paired with max overconfidence (5/5)', () => {
    const signal: TelemetrySignal = {
      userId: 'user-1',
      nodeId: 'LA-102',
      eventType: 'quiz_submit',
      quizScore: 30,
      confidenceLevel: 5,
    };

    const decision = evaluateRoutingDecision({
      signal,
      currentNode: mockNode,
      userState: baseUserState,
      prerequisites: [mockPrereq],
      childNodes: [mockChild],
    });

    expect(decision.action).toBe('CALIBRATION_DROP');
    expect(decision.updatedStatus).toBe('remediation');
    expect(decision.reason).toContain('metacognitive misalignment');
  });
});
