import React, { useEffect, useState } from 'react';
import { A11yLiveAnnouncer } from './components/A11yLiveAnnouncer';
import { AuthModal } from './components/AuthModal';
import { Header } from './components/Header';
import { ModulePlayer } from './components/ModulePlayer';
import { SkillTree } from './components/SkillTree';
import { fetchGraph, fetchUserState, logoutUser } from './services/api';
import { LearningNode, NodeEdge, RoutingDecision, UserNodeState } from './types';
import { Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  const [nodes, setNodes] = useState<LearningNode[]>([]);
  const [edges, setEdges] = useState<NodeEdge[]>([]);
  const [userStates, setUserStates] = useState<Record<string, UserNodeState>>({});
  const [selectedNode, setSelectedNode] = useState<LearningNode | null>(null);
  const [user, setUser] = useState<{ id: string; email: string; name?: string; picture?: string } | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'graph' | 'tree'>('graph');
  const [announceMsg, setAnnounceMsg] = useState('');

  useEffect(() => {
    fetchGraph()
      .then((data) => {
        setNodes(data.nodes);
        setEdges(data.edges);
        if (data.nodes.length > 0 && !selectedNode) {
          setSelectedNode(data.nodes[0]);
        }
      })
      .catch((err) => console.error('Failed to load graph:', err));
  }, []);

  const syncUserState = async () => {
    try {
      const res = await fetchUserState();
      const stateMap: Record<string, UserNodeState> = {};
      res.states.forEach((s) => {
        stateMap[s.nodeId] = s;
      });
      setUserStates(stateMap);
    } catch (err: any) {
      if (err.message === 'UNAUTHORIZED') {
        setUser(null);
      }
    }
  };

  useEffect(() => {
    syncUserState();
  }, [user]);

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    setUserStates({});
    setAnnounceMsg('Logged out successfully.');
  };

  const handleDecisionTriggered = (decision: RoutingDecision) => {
    syncUserState();

    if (decision.targetNodeId !== selectedNode?.id) {
      const targetNode = nodes.find((n) => n.id === decision.targetNodeId);
      if (targetNode) {
        setSelectedNode(targetNode);
      }
    }
  };

  return (
    <div className="min-h-screen bg-google-bg-off text-google-text flex flex-col font-sans">
      <A11yLiveAnnouncer message={announceMsg} />

      <Header
        user={user}
        onLogout={handleLogout}
        onOpenAuth={() => setIsAuthOpen(true)}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6" id="main-content" role="main">
        {/* Cold Start Onboarding / Welcome Banner */}
        {!user && (
          <div className="bg-white border border-google-border rounded-2xl p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 text-google-blue font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-google-yellow" aria-hidden="true" /> Cold-Start Adaptive Sequencing Engine
              </div>
              <h2 className="text-xl font-bold text-google-text tracking-tight">
                Self-Guided Adult Learning powered by Telemetry Signals
              </h2>
              <p className="text-xs text-google-secondary leading-relaxed">
                ALIS dynamically sequences learning modules based on your quiz performance, time-on-task, skipping behavior, and confidence ratings.
                Sign in with Google to save your progress across the Knowledge Graph.
              </p>
            </div>
            <button
              onClick={() => setIsAuthOpen(true)}
              className="bg-google-blue hover:bg-google-blue-hover text-white font-bold text-xs px-5 py-3 rounded-xl shadow-sm transition flex items-center space-x-2"
            >
              <span>Sign In with Google</span>
            </button>
          </div>
        )}

        {/* Skill Tree DAG Grid View */}
        <SkillTree
          nodes={nodes}
          edges={edges}
          userStates={userStates}
          selectedNodeId={selectedNode?.id || null}
          onSelectNode={(node) => {
            setSelectedNode(node);
            setAnnounceMsg(`Selected module ${node.code}: ${node.title}`);
          }}
          viewMode={viewMode}
        />

        {/* Module Player View */}
        {selectedNode && (
          <ModulePlayer
            node={selectedNode}
            userId={user?.id || 'guest-user'}
            userState={userStates[selectedNode.id]}
            onDecisionTriggered={handleDecisionTriggered}
            onAnnounce={setAnnounceMsg}
          />
        )}
      </main>

      <footer className="bg-white border-t border-google-border p-6 text-center text-xs text-google-secondary" role="contentinfo">
        <p>Adaptive Learning Intelligence System (ALIS) MVP — Google Sans Typography & WCAG 2.1 AA Compliant</p>
      </footer>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(u) => {
          setUser(u);
          setAnnounceMsg(`Authenticated with Google as ${u.name || u.email}`);
        }}
      />
    </div>
  );
};

export default App;
