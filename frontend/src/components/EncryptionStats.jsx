import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from 'recharts';
import { Activity, Clock, Database } from 'lucide-react';

const EncryptionStats = ({ files }) => {
  if (files.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        No stats available. Upload files to generate metrics.
      </div>
    );
  }

  // Aggregate stats by algorithm
  const timeStats = files.reduce((acc, file) => {
    if (!acc[file.algorithm]) {
      acc[file.algorithm] = { name: file.algorithm, encryptMs: 0, decryptMs: 0, count: 0, totalSize: 0 };
    }
    acc[file.algorithm].encryptMs += file.encryptionTimeMs || 0;
    
    // Only aggregate if decrypted at least once
    if (file.decryptionTimeMs) {
      acc[file.algorithm].decryptMs += file.decryptionTimeMs;
    }
    
    acc[file.algorithm].count += 1;
    acc[file.algorithm].totalSize += file.originalSize || 0;
    return acc;
  }, {});

  const avgData = Object.values(timeStats).map(stat => ({
    name: stat.name,
    avgEncrypt: Math.round(stat.encryptMs / stat.count),
    avgDecrypt: stat.decryptMs > 0 ? Math.round(stat.decryptMs / files.filter(f => f.algorithm === stat.name && f.decryptionTimeMs).length || 1) : 0,
    totalFiles: stat.count
  }));

  // Scatter plot for File Size vs Encryption Time
  const scatterData = files.map(file => ({
    name: file.originalFilename,
    algorithm: file.algorithm,
    sizeKb: Math.round((file.originalSize || 0) / 1024),
    timeMs: file.encryptionTimeMs || 0
  }));

  const algorithmColors = {
    'AES': '#34d399', // emerald-400
    'DES': '#fb923c', // orange-400
    'RSA': '#a78bfa', // purple-400
    'HYBRID': '#60a5fa' // blue-400
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-xl text-xs">
          <p className="font-bold text-white mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}ms
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const ScatterTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-xl text-xs">
          <p className="font-bold text-white mb-1">{data.name}</p>
          <p className="text-slate-300">Algorithm: {data.algorithm}</p>
          <p className="text-slate-300">Size: {data.sizeKb} KB</p>
          <p className="text-slate-300">Time: {data.timeMs} ms</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="font-medium text-slate-300">Total Encrypted</h3>
          </div>
          <p className="text-3xl font-bold text-white">{files.length}</p>
          <p className="text-sm text-slate-400 mt-2">Files secured in vault</p>
        </div>

        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="font-medium text-slate-300">Fastest Algorithm</h3>
          </div>
          <p className="text-3xl font-bold text-white">
            {avgData.length > 0 ? [...avgData].sort((a,b) => a.avgEncrypt - b.avgEncrypt)[0].name : '-'}
          </p>
          <p className="text-sm text-slate-400 mt-2">Based on average MS per file</p>
        </div>

        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="font-medium text-slate-300">Total Computing ms</h3>
          </div>
          <p className="text-3xl font-bold text-white">
            {files.reduce((sum, f) => sum + (f.encryptionTimeMs || 0) + (f.decryptionTimeMs || 0), 0)}
          </p>
          <p className="text-sm text-slate-400 mt-2">Spent encrypting & decrypting</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Average Time Chart */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6">
          <h3 className="font-medium text-slate-300 mb-6">Average Time Comparison (ms)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={avgData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="avgEncrypt" name="Avg Encrypt" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={30} />
                <Bar dataKey="avgDecrypt" name="Avg Decrypt" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Size vs Time Scatter Plot */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6">
          <h3 className="font-medium text-slate-300 mb-6">File Size vs Processing Time</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis type="number" dataKey="sizeKb" name="Size" unit=" KB" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis type="number" dataKey="timeMs" name="Time" unit=" ms" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ScatterTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                
                {['AES', 'DES', 'RSA', 'HYBRID'].map(alg => {
                  const filteredData = scatterData.filter(d => d.algorithm === alg);
                  if (filteredData.length === 0) return null;
                  return (
                    <Scatter key={alg} name={alg} data={filteredData} fill={algorithmColors[alg]} shape="circle" />
                  );
                })}
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EncryptionStats;
