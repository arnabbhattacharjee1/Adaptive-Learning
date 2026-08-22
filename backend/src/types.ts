export type EventType = 'heartbeat' | 'quiz_submit' | 'skip' | 'confidence_rating';

export type NodeStatus = 
  | 'locked'
  | 'available'
  | 'in_progress'
  | 'mastered'
  | 'remediation'
  | 'reinforcement';

export interface TelemetrySignal {
  userId: string;
  nodeId: string;
  eventType: EventType;
  quizScore?: number; // 0 - 100
  timeOnTaskSeconds?: number;
  skipsCount?: number;
  confidenceLevel?: number; // 1 - 5
  timestamp?: number;
}

export interface LearningNode {
  id: string;
  code: string;
  title: string;
  description: string;
  category: string;
  estimatedMinutes: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  wikipediaUrl?: string;
  wikipediaSummary?: string;
}

export interface NodeEdge {
  parentNodeId: string;
  childNodeId: string;
}

export interface UserNodeState {
  userId: string;
  nodeId: string;
  status: NodeStatus;
  highestQuizScore: number;
  totalTimeSeconds: number;
  confidenceLevel: number;
  attemptsCount: number;
  remediationCount: number;
  updatedAt: string;
}

export type RoutingActionType = 
  | 'FAST_TRACK'
  | 'STANDARD_PROGRESSION'
  | 'REMEDIATION'
  | 'LATERAL_REINFORCEMENT'
  | 'CALIBRATION_DROP';

export interface RoutingDecision {
  action: RoutingActionType;
  currentNodeId: string;
  targetNodeId: string;
  reason: string;
  updatedStatus: NodeStatus;
}
