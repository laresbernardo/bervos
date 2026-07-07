import React from 'react';
import { motion } from 'framer-motion';
import { Star, GitFork, Clock, Users, Download, ArrowUpRight, Info, RefreshCw, List } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';

export interface InitiativeMetric {
  id: string;
  name: string;
  type: 'SoftwareApplication' | 'SoftwareSourceCode';
  url?: string;
  description?: string;
  uptime?: boolean;
  latency?: number;
  stars?: number;
  openIssues?: number;
  lastUpdated?: string;
  version?: string;
  mau?: number;
  downloads?: number;
  applicationCategory?: string;
  totalUsers?: number;
  active30d?: number;
  commits?: Array<{
    hash: string;
    author: string;
    date: string;
    message: string;
    timestamp?: string;
    commitUrl?: string;
  }>;
  backlogCount?: number;
  backlogContent?: string;
  backlogUpdatedAt?: string;
}

interface InitiativeCardProps {
  item: InitiativeMetric;
  onUsersClick?: (projectName: string) => void;
  onRefresh?: (projectId: string) => void;
  isRefreshing?: boolean;
  onShowBacklog?: (projectId: string) => void;
}

export const InitiativeCard: React.FC<InitiativeCardProps> = ({ item, onUsersClick, onRefresh, isRefreshing, onShowBacklog }) => {
  const isWebApp = item.type === 'SoftwareApplication' && item.applicationCategory !== 'UtilitiesApplication';
  const isDesktop = item.type === 'SoftwareApplication' && item.applicationCategory === 'UtilitiesApplication';
  const isOS = item.type === 'SoftwareSourceCode';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.3 }}
      className="tech-card p-8 flex flex-col justify-between min-h-[360px] group"
    >
      <div>
        <div className="flex justify-between items-start mb-6">
          <div className="space-y-1">
            <span className="mono-label !text-indigo-400">
              {isOS ? 'OSS_MODULE' : isDesktop ? 'DESKTOP_APP' : 'WEB_SOLUTION'} // {item.version || '0.0.0'}
            </span>
            <h3 className="text-2xl font-black text-white tracking-tight mt-1">{item.name}</h3>
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            {!isOS && item.uptime !== undefined && (
              <div 
                title={item.uptime ? "Uptime status: The deployment server is responding to network requests successfully." : "Uptime status: The deployment server is currently offline or unreachable."}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-mono tracking-tighter uppercase border ${
                   item.uptime 
                     ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                     : 'bg-red-500/10 text-red-400 border-red-500/20'
                 }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${item.uptime ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                {item.uptime ? 'ONLINE' : 'OFFLINE'}
              </div>
            )}

            <div className="flex items-center gap-1.5">
              {onShowBacklog && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onShowBacklog(item.id);
                  }}
                  title={`Backlog (${item.backlogCount || 0} items)`}
                  className="relative p-1.5 bg-white/5 border border-white/10 hover:border-indigo-500/40 hover:text-indigo-400 rounded-lg text-slate-400 transition-all cursor-pointer flex items-center justify-center"
                >
                  <List size={11} />
                  {(item.backlogCount || 0) > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] flex items-center justify-center bg-red-500 text-white text-[8px] font-mono font-bold rounded-full px-[3px] leading-none">
                      {item.backlogCount}
                    </span>
                  )}
                </button>
              )}

              {onRefresh && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRefresh(item.id);
                  }}
                  disabled={isRefreshing}
                  title="Refresh project metrics"
                  className="p-1.5 bg-white/5 border border-white/10 hover:border-indigo-500/40 hover:text-indigo-400 rounded-lg text-slate-400 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center"
                >
                  <RefreshCw size={11} className={isRefreshing ? 'animate-spin text-indigo-400' : ''} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-6 mb-6">
          {isOS && (
            <>
              <div className="space-y-1">
                <span className="mono-label !text-slate-500 flex items-center gap-1">
                  Stars
                  <span title="GitHub stars: Indicates popularity and developer interest in this open-source repository.">
                    <Info size={10} className="text-slate-500/80 cursor-help" />
                  </span>
                </span>
                <div className="flex items-center gap-1.5 text-white">
                  <Star size={14} className="text-yellow-500/60 animate-pulse" />
                  <span className="font-mono text-sm font-bold">{item.stars !== undefined ? item.stars.toLocaleString() : 'N/A'}</span>
                </div>
              </div>
              <div className="space-y-1">
                <span className="mono-label !text-slate-500 flex items-center gap-1">
                  Issues
                  <span title="GitHub open issues: Total number of active bug reports, feature requests, or tasks currently open.">
                    <Info size={10} className="text-slate-500/80 cursor-help" />
                  </span>
                </span>
                <div className="flex items-center gap-1.5 text-white">
                  <GitFork size={14} className="text-cyan-500/60" />
                  <span className="font-mono text-sm font-bold">{item.openIssues !== undefined ? item.openIssues.toLocaleString() : 'N/A'}</span>
                </div>
              </div>
            </>
          )}

          {isWebApp && (
            <>
              <button
                onClick={() => onUsersClick && onUsersClick(item.name)}
                disabled={!onUsersClick}
                type="button"
                className={`space-y-1 text-left ${onUsersClick ? 'cursor-pointer group/btn select-none hover:opacity-85 transition-opacity' : ''}`}
              >
                <span className="mono-label !text-slate-500 flex items-center gap-1 group-hover/btn:text-indigo-400 transition-colors">
                  Users
                  <span title="Total users: Total number of registered users created inside the project database.">
                    <Info size={10} className="text-slate-500/80 cursor-help" />
                  </span>
                </span>
                <div className="flex items-center gap-1.5 text-white">
                  <Users size={14} className="text-indigo-500/60 group-hover/btn:text-indigo-400 transition-colors" />
                  <span className="font-mono text-sm font-bold group-hover/btn:text-indigo-400 transition-colors">{item.totalUsers !== undefined ? item.totalUsers.toLocaleString() : '0'}</span>
                </div>
              </button>
              <div className="space-y-1">
                <span className="mono-label !text-slate-500 flex items-center gap-1">
                  Active (30d)
                  <span title="Active users (30d): Number of unique users who signed in or made requests in the last 30 days.">
                    <Info size={10} className="text-slate-500/80 cursor-help" />
                  </span>
                </span>
                <div className="flex items-center gap-1.5 text-white">
                  <Users size={14} className="text-cyan-500/60" />
                  <span className="font-mono text-sm font-bold">{item.active30d !== undefined ? item.active30d.toLocaleString() : '0'}</span>
                </div>
              </div>
            </>
          )}

          {isDesktop && (
            <>
              <div className="space-y-1">
                <span className="mono-label !text-slate-500 flex items-center gap-1">
                  Downloads
                  <span title="Total downloads: Total number of recorded application installation/file downloads logged in the telemetry database.">
                    <Info size={10} className="text-slate-500/80 cursor-help" />
                  </span>
                </span>
                <div className="flex items-center gap-1.5 text-white">
                  <Download size={14} className="text-green-500/60" />
                  <span className="font-mono text-sm font-bold">{item.downloads !== undefined ? item.downloads.toLocaleString() : '0'}</span>
                </div>
              </div>
              <div className="space-y-1">
                <span className="mono-label !text-slate-500 flex items-center gap-1">
                  Latency
                  <span title="Network latency: Time taken for a round-trip ping between this device and the live deployment server, measured in milliseconds.">
                    <Info size={10} className="text-slate-500/80 cursor-help" />
                  </span>
                </span>
                <div className="flex items-center gap-1.5 text-white">
                  <Clock size={14} className="text-cyan-500/60" />
                  <span className="font-mono text-sm font-bold">{item.latency !== undefined ? `${item.latency}ms` : 'N/A'}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {isOS && item.lastUpdated && (
          <div className="text-[10px] font-mono text-slate-500 mb-4 flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-slate-500" />
            <span>LAST_COMMIT // {(() => {
              const d = new Date(item.lastUpdated);
              return !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : item.lastUpdated;
            })()}</span>
          </div>
        )}
        {item.commits && item.commits.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/5 space-y-2 mb-4">
            <span className="mono-label !text-slate-500 block mb-1.5 text-[9px]">RECENT_COMMITS</span>
            <div className="space-y-2">
              {item.commits.map((commit) => (
                <div key={commit.hash} className="text-[10px] font-mono leading-relaxed text-slate-400">
                  {commit.commitUrl ? (
                    <a
                      href={commit.commitUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400/80 hover:text-indigo-300 hover:underline transition-colors mr-1.5 font-bold"
                    >
                      {commit.hash}
                    </a>
                  ) : (
                    <span className="text-indigo-400/80 mr-1.5 font-bold">{commit.hash}</span>
                  )}
                  <span className="text-slate-500 mr-1.5">
                    ({(() => {
                      if (commit.timestamp) {
                        const d = new Date(commit.timestamp);
                        if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
                      }
                      return commit.date;
                    })()})
                  </span>
                  <span className="text-slate-200 block md:inline font-sans text-[11px] leading-normal">{commit.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {item.url && (
          <div className="flex justify-between items-center">
            {isOS ? (
              <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-500">
                <FaGithub size={12} />
                <span>GITHUB_REPO</span>
              </div>
            ) : (
              <span className="text-[9px] font-mono text-slate-500">SERVER_IP // HOST</span>
            )}
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Access <ArrowUpRight size={14} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 w-16 h-px bg-indigo-500/0 group-hover:bg-indigo-500/40 transition-all duration-700" />
      <div className="absolute bottom-0 left-0 w-px h-16 bg-indigo-500/0 group-hover:bg-indigo-500/40 transition-all duration-700" />
    </motion.div>
  );
};
