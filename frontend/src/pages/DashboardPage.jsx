import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import FileUploadZone from '../components/FileUploadZone';
import FileList from '../components/FileList';
import EncryptionStats from '../components/EncryptionStats';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const DashboardPage = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('files');

  const fetchFiles = async () => {
    try {
      const res = await api.get('/files');
      setFiles(res.data);
    } catch (error) {
      toast.error('Failed to fetch files');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleUploadComplete = () => {
    fetchFiles();
    setActiveTab('files'); // Switch to files list after successful upload
  };

  const handleFileDeleted = (fileId) => {
    setFiles(files.filter(f => f.id !== fileId));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Secure Vault</h1>
          <p className="text-slate-400 text-sm">Manage, encrypt and decrypt your sensitive files safely.</p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-white/10 mb-8">
        <button
          className={`pb-4 px-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'files' 
              ? 'border-indigo-500 text-indigo-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
          }`}
          onClick={() => setActiveTab('files')}
        >
          My Files
        </button>
        <button
          className={`pb-4 px-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'upload' 
              ? 'border-indigo-500 text-indigo-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
          }`}
          onClick={() => setActiveTab('upload')}
        >
          Encrypt New File
        </button>
        <button
          className={`pb-4 px-2 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'stats' 
              ? 'border-indigo-500 text-indigo-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
          }`}
          onClick={() => setActiveTab('stats')}
        >
          Encryption Metrics
        </button>
      </div>

      <div className="min-h-[400px]">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : (
          <>
            {activeTab === 'files' && (
              <FileList files={files} onFileDeleted={handleFileDeleted} onRefresh={fetchFiles} />
            )}
            
            {activeTab === 'upload' && (
              <div className="max-w-3xl mx-auto">
                <FileUploadZone onComplete={handleUploadComplete} />
              </div>
            )}

            {activeTab === 'stats' && (
              <EncryptionStats files={files} />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
