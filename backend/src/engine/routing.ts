import { LearningNode, NodeEdge, RoutingDecision, TelemetrySignal, UserNodeState } from '../types.js';

export interface EvaluateRoutingParams {
  signal: TelemetrySignal;
  currentNode: LearningNode;
  userState: UserNodeState;
  prerequisites: LearningNode[];
  childNodes: LearningNode[];
}

/**
 * Pure Functional Routing Logic Engine.
 * Evaluates telemetry signals against PRD rules and returns a RoutingDecision.
 */
export function evaluateRoutingDecision(params: EvaluateRoutingParams): RoutingDecision {
  const { signal, currentNode, userState, prerequisites, childNodes } = params;

  const quizScore = signal.quizScore ?? userState.highestQuizScore;
  const confidence = signal.confidenceLevel ?? userState.confidenceLevel;
  const timeOnTask = signal.timeOnTaskSeconds ?? userState.totalTimeSeconds;
  const estimatedSeconds = currentNode.estimatedMinutes * 60;
  const isSkip = signal.eventType === 'skip' || (signal.skipsCount !== undefined && signal.skipsCount > 0);

  // 1. Calibration Drop: Low score (< 50) + High Overconfidence (5)
  if (quizScore < 50 && confidence === 5) {
    const targetNode = prerequisites.length > 0 ? prerequisites[0] : currentNode;
    return {
      action: 'CALIBRATION_DROP',
      currentNodeId: currentNode.id,
      targetNodeId: targetNode.id,
      reason: 'Low score combined with maximum confidence indicates metacognitive misalignment. Re-calibrating foundational concepts.',
      updatedStatus: 'remediation',
    };
  }

  // 2. Fast-Tracking: Skip + Passing Quiz (Score >= 80)
  if (isSkip && quizScore >= 80) {
    const targetNode = childNodes.length > 0 ? childNodes[0] : currentNode;
    return {
      action: 'FAST_TRACK',
      currentNodeId: currentNode.id,
      targetNodeId: targetNode.id,
      reason: 'Demonstrated mastery via fast-track skip and high quiz performance. Auto-mastering current node.',
      updatedStatus: 'mastered',
    };
  }

  // 3. Infinite Remediation Prevention: If remediation attempt count >= 3, prevent endless looping
  if (userState.remediationCount >= 3 && quizScore < 60) {
    const foundationalNode = prerequisites.length > 0 ? prerequisites[prerequisites.length - 1] : currentNode;
    return {
      action: 'REMEDIATION',
      currentNodeId: currentNode.id,
      targetNodeId: foundationalNode.id,
      reason: 'Remediation threshold exceeded (3+ attempts). Routing to foundational prerequisite to break learning impasse.',
      updatedStatus: 'remediation',
    };
  }

  // 4. Remediation: Score < 60 OR excessive time (> 2.5x estimated time)
  const isExcessiveTime = timeOnTask > estimatedSeconds * 2.5;
  if (quizScore < 60 || isExcessiveTime) {
    const prereqNode = prerequisites.length > 0 ? prerequisites[0] : currentNode;
    const reasonMsg = quizScore < 60
      ? `Quiz score (${quizScore}%) below passing threshold.`
      : `Time-on-task (${Math.round(timeOnTask / 60)}m) exceeded 2.5x estimated time (${currentNode.estimatedMinutes}m).`;

    return {
      action: 'REMEDIATION',
      currentNodeId: currentNode.id,
      targetNodeId: prereqNode.id,
      reason: `${reasonMsg} Routing to prerequisite review.`,
      updatedStatus: 'remediation',
    };
  }

  // 5. Lateral Reinforcement: High score (>= 85) + Low self-reported confidence (<= 2)
  if (quizScore >= 85 && confidence > 0 && confidence <= 2) {
    return {
      action: 'LATERAL_REINFORCEMENT',
      currentNodeId: currentNode.id,
      targetNodeId: currentNode.id,
      reason: 'High score achieved with low self-confidence. Providing lateral application problem to solidify self-efficacy.',
      updatedStatus: 'reinforcement',
    };
  }

  // 6. Standard Progression: Quiz score >= 70
  if (quizScore >= 70) {
    const targetNode = childNodes.length > 0 ? childNodes[0] : currentNode;
    return {
      action: 'STANDARD_PROGRESSION',
      currentNodeId: currentNode.id,
      targetNodeId: targetNode.id,
      reason: 'Module completed successfully with standard progression criteria.',
      updatedStatus: 'mastered',
    };
  }

  // Default fallback: remain in progress
  return {
    action: 'STANDARD_PROGRESSION',
    currentNodeId: currentNode.id,
    targetNodeId: currentNode.id,
    reason: 'Telemetry registered. Module remains in progress.',
    updatedStatus: 'in_progress',
  };
}
