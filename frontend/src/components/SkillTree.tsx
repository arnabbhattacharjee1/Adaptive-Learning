import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LearningNode, NodeEdge, NodeStatus, UserNodeState } from '../types';
import { Award, CheckCircle, AlertTriangle, Lock, Play, RefreshCw, Zap } from 'lucide-react';

interface SkillTreeProps {
  nodes: LearningNode[];
  edges: NodeEdge[];
  userStates: Record<string, UserNodeState>;
  selectedNodeId: string | null;
  onSelectNode: (node: LearningNode) => void;
  viewMode: 'graph' | 'tree';
}

const LEVEL_MAP: Record<string, { row: number; col: number }> = {
  // Tier 1: New Business & Underwriting Operations
  'LA-101': { row: 0, col: 1 },
  'LA-102': { row: 1, col: 0 },
  'LA-103': { row: 1, col: 2 },

  // Tier 2: In-Force Policy Administration
  'LA-201': { row: 2, col: 0 },
  'LA-203': { row: 2, col: 2 },
  'LA-202': { row: 3, col: 0 },
  'LA-204': { row: 3, col: 1 },

  // Tier 3: Annuity Payouts & Claims Adjudication
  'LA-301': { row: 3, col: 2 },
  'LA-302': { row: 4, col: 0 },
  'LA-303': { row: 4, col: 2 },

  // Tier 4: Operations & SLA Management
  'LA-401': { row: 5, col: 0 },
  'LA-402': { row: 5, col: 2 },
};

export const SkillTree: React.FC<SkillTreeProps> = React.memo(({
  nodes,
  edges,
  userStates,
  selectedNodeId,
  onSelectNode,
  viewMode,
}) => {
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(selectedNodeId || nodes[0]?.id || null);
  const graphContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedNodeId) {
      setFocusedNodeId(selectedNodeId);
    }
  }, [selectedNodeId]);

  // Memoized Node Status Lookup
  const getNodeStatus = useCallback((nodeId: string): NodeStatus => {
    if (userStates[nodeId]) {
      return userStates[nodeId].status;
    }
    return nodeId === 'LA-101' ? 'available' : 'locked';
  }, [userStates]);

  // Memoized Node Position Map (Calculated once)
  const nodePositions = useMemo(() => {
    const posMap: Record<string, { x: number; y: number }> = {};
    nodes.forEach((node, index) => {
      const pos = LEVEL_MAP[node.id] || { row: Math.floor(index / 3), col: index % 3 };
      posMap[node.id] = {
        x: 120 + pos.col * 220,
        y: 80 + pos.row * 125,
      };
    });
    return posMap;
  }, [nodes]);

  const handleKeyDown = (e: React.KeyboardEvent, nodeId: string) => {
    const currentIndex = nodes.findIndex((n) => n.id === nodeId);
    if (currentIndex === -1) return;

    let nextIndex = currentIndex;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (currentIndex + 1) % nodes.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (currentIndex - 1 + nodes.length) % nodes.length;
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const node = nodes.find((n) => n.id === nodeId);
      if (node && getNodeStatus(node.id) !== 'locked') {
        onSelectNode(node);
      }
      return;
    }

    const nextNode = nodes[nextIndex];
    if (nextNode) {
      setFocusedNodeId(nextNode.id);
      const element = document.getElementById(`node-element-${nextNode.id}`);
      element?.focus();
    }
  };

  const getStatusBadge = (status: NodeStatus) => {
    switch (status) {
      case 'mastered':
        return { bg: 'bg-google-green-light text-[#137333] border-google-green/40', icon: CheckCircle, label: 'Mastered' };
      case 'remediation':
        return { bg: 'bg-google-red-light text-[#C5221F] border-google-red/40', icon: AlertTriangle, label: 'Remediation' };
      case 'reinforcement':
        return { bg: 'bg-google-yellow-light text-[#B06000] border-google-yellow/40', icon: RefreshCw, label: 'Reinforcement' };
      case 'in_progress':
        return { bg: 'bg-google-blue-light text-google-blue border-google-blue/40', icon: Play, label: 'In Progress' };
      case 'available':
        return { bg: 'bg-google-blue-light text-google-blue border-google-blue/40', icon: Zap, label: 'Available' };
      case 'locked':
      default:
        return { bg: 'bg-[#F1F3F4] text-google-secondary border-google-border', icon: Lock, label: 'Locked' };
    }
  };

  return (
    <section className="bg-white border border-google-border rounded-2xl p-6 shadow-sm" aria-label="Life & Annuities Insurance Operations Skill Tree">
      <div className="flex items-center justify-between mb-4 border-b border-google-border pb-3">
        <div>
          <h2 className="text-lg font-bold text-google-text flex items-center gap-2">
            <span>L&A Insurance Back-Office Operations DAG</span>
          </h2>
          <p className="text-xs text-google-secondary font-medium">
            4-Tier Operational Curriculum. Navigate using <kbd className="bg-google-bg-off px-1.5 py-0.5 rounded text-google-text border border-google-border">Tab</kbd> / <kbd className="bg-google-bg-off px-1.5 py-0.5 rounded text-google-text border border-google-border">Arrow Keys</kbd>. Press <kbd className="bg-google-bg-off px-1.5 py-0.5 rounded text-google-text border border-google-border">Enter</kbd> to launch.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-[#137333] font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-google-green inline-block"></span> Mastered
          </span>
          <span className="flex items-center gap-1.5 text-[#C5221F] font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-google-red inline-block"></span> Remediation
          </span>
          <span className="flex items-center gap-1.5 text-[#B06000] font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-google-yellow inline-block"></span> Reinforcement
          </span>
          <span className="flex items-center gap-1.5 text-google-blue font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-google-blue inline-block"></span> Available
          </span>
          <span className="flex items-center gap-1.5 text-google-secondary font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-[#80868B] inline-block"></span> Locked
          </span>
        </div>
      </div>

      {viewMode === 'graph' ? (
        <div className="relative overflow-x-auto min-h-[780px] bg-google-bg-off rounded-xl border border-google-border p-4" ref={graphContainerRef}>
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ minWidth: '760px', minHeight: '780px' }}>
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#80868B" />
              </marker>
              <marker id="arrow-active" viewBox="0 0 10 10" refX="28" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#1A73E8" />
              </marker>
            </defs>

            {edges.map((edge, idx) => {
              const parentPos = nodePositions[edge.parentNodeId];
              const childPos = nodePositions[edge.childNodeId];
              if (!parentPos || !childPos) return null;

              const parentStatus = getNodeStatus(edge.parentNodeId);
              const isMasteredEdge = parentStatus === 'mastered';

              return (
                <line
                  key={`edge-${idx}`}
                  x1={parentPos.x + 80}
                  y1={parentPos.y + 30}
                  x2={childPos.x + 80}
                  y2={childPos.y + 30}
                  stroke={isMasteredEdge ? '#1A73E8' : '#BDC1C6'}
                  strokeWidth={isMasteredEdge ? 2.5 : 1.5}
                  strokeDasharray={isMasteredEdge ? undefined : '4 4'}
                  markerEnd={isMasteredEdge ? 'url(#arrow-active)' : 'url(#arrow)'}
                />
              );
            })}
          </svg>

          <div className="relative z-10" style={{ minWidth: '760px', minHeight: '780px' }}>
            {nodes.map((node) => {
              const pos = nodePositions[node.id] || { x: 120, y: 80 };
              const status = getNodeStatus(node.id);
              const badge = getStatusBadge(status);
              const isSelected = selectedNodeId === node.id;
              const isFocused = focusedNodeId === node.id;
              const isLocked = status === 'locked';
              const stateData = userStates[node.id];
              const Icon = badge.icon;

              return (
                <button
                  key={node.id}
                  id={`node-element-${node.id}`}
                  tabIndex={isFocused ? 0 : -1}
                  onClick={() => !isLocked && onSelectNode(node)}
                  onKeyDown={(e) => handleKeyDown(e, node.id)}
                  disabled={isLocked}
                  aria-label={`${node.code} ${node.title}. Status: ${badge.label}. ${
                    stateData?.highestQuizScore ? `Quiz score: ${stateData.highestQuizScore}%.` : ''
                  }`}
                  aria-disabled={isLocked}
                  style={{
                    position: 'absolute',
                    left: `${pos.x}px`,
                    top: `${pos.y}px`,
                    width: '180px',
                  }}
                  className={`group text-left p-3.5 rounded-xl border transition-all transform ${
                    isLocked
                      ? 'bg-google-bg-off border-google-border text-google-secondary opacity-60 cursor-not-allowed'
                      : isSelected
                      ? 'bg-white border-google-blue ring-2 ring-google-blue/40 shadow-md scale-105'
                      : 'bg-white hover:bg-google-blue-light/30 border-google-border text-google-text cursor-pointer hover:scale-102'
                  } focus:outline-none focus:ring-4 focus:ring-google-blue focus:border-google-blue`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono font-bold tracking-wider text-google-secondary bg-google-bg-off px-1.5 py-0.5 rounded border border-google-border">
                      {node.code}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${badge.bg}`}>
                      <Icon className="w-2.5 h-2.5" aria-hidden="true" />
                      <span>{badge.label}</span>
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-google-text line-clamp-2 mb-1.5 leading-snug">
                    {node.title}
                  </h3>

                  <div className="flex items-center justify-between text-[10px] text-google-secondary border-t border-google-border pt-1.5 mt-1 font-medium">
                    <span>Est: {node.estimatedMinutes}m</span>
                    {stateData?.highestQuizScore !== undefined && stateData.highestQuizScore > 0 && (
                      <span className="font-bold text-[#137333]">Score: {stateData.highestQuizScore}%</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-google-bg-off rounded-xl border border-google-border p-4" role="tree" aria-label="Hierarchical Learning Tree">
          <ul className="space-y-3" role="group">
            {nodes.map((node) => {
              const status = getNodeStatus(node.id);
              const badge = getStatusBadge(status);
              const isLocked = status === 'locked';
              const stateData = userStates[node.id];
              const Icon = badge.icon;

              return (
                <li
                  key={node.id}
                  role="treeitem"
                  aria-selected={selectedNodeId === node.id}
                  aria-level={1}
                  className="bg-white border border-google-border hover:border-google-blue/60 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-xl border ${badge.bg}`}>
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-google-blue bg-google-blue-light px-2 py-0.5 rounded border border-google-blue/30">
                          {node.code}
                        </span>
                        <h3 className="text-sm font-bold text-google-text">{node.title}</h3>
                      </div>
                      <p className="text-xs text-google-secondary mt-0.5">{node.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {stateData?.highestQuizScore ? (
                      <span className="text-xs font-bold text-[#137333] bg-google-green-light px-2.5 py-1 rounded-lg border border-google-green/30">
                        Score: {stateData.highestQuizScore}%
                      </span>
                    ) : null}

                    <button
                      onClick={() => !isLocked && onSelectNode(node)}
                      disabled={isLocked}
                      className={`px-4 py-2 text-xs font-bold rounded-xl border transition ${
                        isLocked
                          ? 'bg-google-bg-off text-google-secondary border-google-border cursor-not-allowed'
                          : 'bg-google-blue hover:bg-google-blue-hover text-white border-google-blue cursor-pointer shadow-sm'
                      }`}
                      aria-label={`Launch ${node.title}`}
                    >
                      {isLocked ? 'Locked Prereq' : 'Open Module'}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
});
