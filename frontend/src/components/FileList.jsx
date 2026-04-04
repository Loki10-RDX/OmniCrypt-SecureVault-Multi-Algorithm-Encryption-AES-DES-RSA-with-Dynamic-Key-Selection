import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Download, Trash2, FileKey, ShieldAlert, Loader2, KeyRound } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const FileList = ({ files, onFileDeleted, onRefresh }) => {
  const [downloadingId, setDownloadingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const handleDownload = async (fileId, filename) => {
    setDownloadingId(fileId);
    try {
      const response = await api.get(`/files/${fileId}/download`, {
        responseType: 'blob', // Important for downloading binary data
      });
      
      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename); // use original filename from backend
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Decrypted and downloaded successfully');
      onRefresh(); // Refresh to update decryption stats length
    } catch (error) {
      toast.error('Failed to decrypt and download file');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm("Are you sure you want to delete this file? It cannot be recovered.")) {
      return;
    }
    
    setDeletingId(fileId);
    try {
      await api.delete(`/files/${fileId}`);
      toast.success('File securely deleted');
      onFileDeleted(fileId);
    } catch (error) {
      toast.error('Failed to delete file');
    } finally {
      setDeletingId(null);
    }
  };

  if (files.length === 0) {
    return (
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-12 text-center">
        <div className="mx-auto w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mb-4">
          <FileKey className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-white mb-1">No secure files yet</h3>
        <p className="text-slate-400">Upload and encrypt your first file to get started.</p>
      </div>
    );
  }

  const getAlgorithmColor = (alg) => {
    switch (alg) {
      case 'AES': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'DES': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'RSA': return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
      case 'HYBRID': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-300">
          <thead className="text-xs text-slate-400 uppercase bg-slate-900/50 border-b border-white/5">
            <tr>
              <th scope="col" className="px-6 py-4 font-medium">Filename</th>
              <th scope="col" className="px-6 py-4 font-medium">Algorithm</th>
              <th scope="col" className="px-6 py-4 font-medium hidden md:table-cell">Metrics</th>
              <th scope="col" className="px-6 py-4 font-medium hidden sm:table-cell">Uploaded</th>
              <th scope="col" className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {files.map((file) => (
              <tr key={file.id} className="hover:bg-slate-700/20 transition-colors group">
                <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                  <div className="bg-slate-700 p-2 rounded-lg text-slate-300 group-hover:text-indigo-400 transition-colors">
                    {file.algorithm === 'RSA' || file.algorithm === 'HYBRID' ? (
                      <KeyRound className="w-4 h-4" />
                    ) : (
                      <ShieldAlert className="w-4 h-4" />
                    )}
                  </div>
                  <span className="truncate max-w-[150px] sm:max-w-[300px] block" title={file.originalFilename}>
                    {file.originalFilename}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-md border text-xs font-medium ${getAlgorithmColor(file.algorithm)}`}>
                    {file.algorithm}
                  </span>
                </td>
                <td className="px-6 py-4 hidden md:table-cell">
                  <div className="flex flex-col text-xs space-y-1">
                    <span className="text-slate-400">Size: <span className="text-slate-200">{formatSize(file.originalSize)}</span></span>
                    <span className="text-slate-400">Enc time: <span className="text-emerald-400">{file.encryptionTimeMs}ms</span></span>
                  </div>
                </td>
                <td className="px-6 py-4 hidden sm:table-cell text-slate-400">
                  {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleDownload(file.id, file.originalFilename)}
                      disabled={downloadingId === file.id}
                      className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition-colors flex items-center gap-2"
                      title="Decrypt and Download"
                    >
                      {downloadingId === file.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      <span className="hidden lg:inline text-xs font-medium">Decrypt</span>
                    </button>
                    <button
                      onClick={() => handleDelete(file.id)}
                      disabled={deletingId === file.id}
                      className="p-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Delete Permanently"
                    >
                      {deletingId === file.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FileList;
