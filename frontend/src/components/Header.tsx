import React from 'react';
import { BookOpen, LogOut, ShieldCheck, User } from 'lucide-react';

interface HeaderProps {
  user: { id: string; email: string; name?: string; picture?: string } | null;
  onLogout: () => void;
  onOpenAuth: () => void;
  viewMode: 'graph' | 'tree';
  setViewMode: (mode: 'graph' | 'tree') => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onLogout,
  onOpenAuth,
  viewMode,
  setViewMode,
}) => {
  return (
    <header className="bg-white border-b border-google-border px-6 py-4 flex flex-wrap items-center justify-between shadow-sm" role="banner">
      <div className="flex items-center space-x-3">
        <div className="flex items-center gap-1 p-2 bg-google-blue-light rounded-xl">
          <span className="w-2.5 h-2.5 rounded-full bg-google-blue"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-google-red"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-google-yellow"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-google-green"></span>
        </div>
        <div>
          <h1 className="text-xl font-bold text-google-text flex items-center gap-2 font-sans tracking-tight">
            ALIS <span className="text-xs bg-google-blue-light text-google-blue font-semibold px-2.5 py-0.5 rounded-full border border-google-blue/30">Adaptive Intelligence</span>
          </h1>
          <p className="text-xs text-google-secondary font-medium">Autonomous Adult Learning & Directed Knowledge Graph</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* WCAG Accessible View Mode Selector */}
        <div className="bg-google-bg-off p-1 rounded-xl border border-google-border flex text-xs font-medium" role="group" aria-label="Skill Tree View Mode">
          <button
            onClick={() => setViewMode('graph')}
            className={`px-3 py-1.5 rounded-lg transition ${
              viewMode === 'graph'
                ? 'bg-google-blue text-white font-bold shadow-sm'
                : 'text-google-secondary hover:text-google-text'
            }`}
            aria-pressed={viewMode === 'graph'}
          >
            Visual Graph View
          </button>
          <button
            onClick={() => setViewMode('tree')}
            className={`px-3 py-1.5 rounded-lg transition ${
              viewMode === 'tree'
                ? 'bg-google-blue text-white font-bold shadow-sm'
                : 'text-google-secondary hover:text-google-text'
            }`}
            aria-pressed={viewMode === 'tree'}
          >
            Accessible Tree View
          </button>
        </div>

        {/* User Auth State */}
        {user ? (
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-sm text-google-text bg-google-bg-off px-3 py-1.5 rounded-full border border-google-border font-medium">
              {user.picture ? (
                <img src={user.picture} alt={user.name || user.email} className="w-5 h-5 rounded-full border border-google-blue" />
              ) : (
                <User className="w-4 h-4 text-google-blue" aria-hidden="true" />
              )}
              <span>{user.name || user.email}</span>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center space-x-1 text-xs text-google-red hover:bg-google-red-light px-3 py-1.5 rounded-lg border border-google-red/30 transition font-medium"
              aria-label="Log out of application"
            >
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center space-x-2 text-xs bg-google-blue hover:bg-google-blue-hover text-white px-4 py-2 rounded-xl font-bold transition shadow-sm"
          >
            <ShieldCheck className="w-4 h-4" aria-hidden="true" />
            <span>Sign In with Google</span>
          </button>
        )}
      </div>
    </header>
  );
};
