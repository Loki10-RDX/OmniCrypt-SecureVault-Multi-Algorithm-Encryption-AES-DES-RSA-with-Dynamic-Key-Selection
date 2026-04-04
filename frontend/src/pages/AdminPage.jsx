import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ShieldAlert, Activity, User, Server } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AdminPage = () => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get('/audit/logs');
        setLogs(res.data);
      } catch (error) {
        toast.error('Failed to fetch audit logs. Admin access required.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const getActionColor = (action) => {
    if (action.includes('REGISTER') || action.includes('LOGIN')) return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    if (action.includes('ENCRYPT')) return 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20';
    if (action.includes('DECRYPT')) return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
    if (action.includes('DELETE')) return 'text-red-400 bg-red-400/10 border-red-400/20';
    return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-rose-500" />
            Security Audit Center
          </h1>
          <p className="text-slate-400 text-sm">System-wide monitoring and immutable audit trails.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="font-medium text-slate-300">Total Events Logged</h3>
          </div>
          <p className="text-3xl font-bold text-white">{logs.length}</p>
        </div>
        
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <User className="w-5 h-5" />
            </div>
            <h3 className="font-medium text-slate-300">Active Users</h3>
          </div>
          <p className="text-3xl font-bold text-white">{new Set(logs.map(l => l.userEmail)).size}</p>
        </div>

        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg">
              <Server className="w-5 h-5" />
            </div>
            <h3 className="font-medium text-slate-300">System Status</h3>
          </div>
          <p className="text-xl font-bold text-emerald-400 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
            Operational
          </p>
        </div>
      </div>

      <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-xl">
        <div className="p-6 border-b border-slate-700/50">
          <h2 className="text-xl font-bold text-white">Recent Security Logs</h2>
        </div>
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-sm text-left text-slate-300">
            <thead className="text-xs text-slate-400 uppercase bg-slate-900/50 sticky top-0 border-b border-white/5 shadow-md">
              <tr>
                <th scope="col" className="px-6 py-4 font-medium">User</th>
                <th scope="col" className="px-6 py-4 font-medium">Action</th>
                <th scope="col" className="px-6 py-4 font-medium">Details</th>
                <th scope="col" className="px-6 py-4 font-medium">IP Address</th>
                <th scope="col" className="px-6 py-4 font-medium text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    No activity logs recorded yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{log.userEmail || 'System'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-md border text-xs font-medium ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 max-w-xs truncate" title={log.details}>
                      {log.details}
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                      {log.ipAddress || 'UNKNOWN'}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-right whitespace-nowrap">
                      {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
