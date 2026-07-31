import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught Error in Hub application:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#080b12] flex items-center justify-center p-6 text-slate-100 font-sans">
          <div className="tech-card p-10 max-w-lg w-full bg-[#0c121d] border border-red-500/30 rounded-2xl space-y-6 shadow-2xl">
            <div className="flex items-center gap-4 text-red-400">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <ShieldAlert size={28} />
              </div>
              <div>
                <span className="mono-label !text-red-400 block">// SYSTEM_RUNTIME_EXCEPTION</span>
                <h2 className="text-xl font-black uppercase text-white tracking-tight">APPLICATION ERROR</h2>
              </div>
            </div>

            <div className="border border-red-500/20 bg-red-500/5 p-4 rounded-xl font-mono text-xs text-red-300 overflow-auto max-h-48 leading-relaxed">
              <p className="font-bold">{this.state.error?.name}: {this.state.error?.message}</p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer font-bold"
              >
                <RefreshCw size={14} />
                Reload System
              </button>
              <button
                onClick={() => { window.location.href = '/hub'; }}
                className="py-3 px-4 bg-white/5 hover:bg-white/10 text-slate-300 font-mono text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Back to Hub
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
