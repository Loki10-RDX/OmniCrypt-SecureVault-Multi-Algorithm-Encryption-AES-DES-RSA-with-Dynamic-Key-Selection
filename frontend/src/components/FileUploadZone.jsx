import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, CheckCircle2, Lock, Shield, Settings, FileBox } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const ALGORITHMS = [
  { id: 'AES', name: 'AES-256', desc: 'Fast, secure symmetric encryption. Best for all file sizes.', icon: Shield },
  { id: 'RSA', name: 'RSA-2048', desc: 'Secure asymmetric encryption. Limited to very small text files (<245 bytes).', icon: Lock },
  { id: 'DES', name: 'DES', desc: 'Legacy symmetric encryption (56-bit). Weaker security, kept for educational/comparison purposes.', icon: Settings },
  { id: 'HYBRID', name: 'Hybrid (AES+RSA)', desc: 'Enterprise standard. Combines AES speed with RSA key security.', icon: FileBox },
];

const FileUploadZone = ({ onComplete }) => {
  const [file, setFile] = useState(null);
  const [algorithm, setAlgorithm] = useState('AES');
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles?.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const handleUpload = async () => {
    if (!file) return;

    if (algorithm === 'RSA' && file.size > 245) {
      toast.error('RSA only supports files smaller than 245 bytes. Try AES or Hybrid for larger files.');
      return;
    }

    setIsUploading(true);
    setProgress(10);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('algorithm', algorithm);

    try {
      setProgress(40);
      await api.post('/files/upload-encrypt', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          // Scale upload progress to 90%, last 10% is server processing
          setProgress(Math.min(90, percentCompleted));
        },
      });
      
      setProgress(100);
      toast.success(`${file.name} encrypted successfully via ${algorithm}`);
      setTimeout(() => {
        setFile(null);
        setProgress(0);
        onComplete();
      }, 500);
    } catch (error) {
      setProgress(0);
      toast.error(error.response?.data?.message || 'Error occurred during encryption');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-xl shadow-xl">
      <div className="p-6 md:p-8 space-y-8">
        
        {/* Upload Zone */}
        <div 
          {...getRootProps()} 
          className={`relative group border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[240px]
            ${isDragActive 
              ? 'border-indigo-500 bg-indigo-500/10' 
              : 'border-slate-600 hover:border-indigo-500/50 hover:bg-slate-700/30'
            }
          `}
        >
          <input {...getInputProps()} disabled={isUploading} />
          
          {file ? (
            <div className="space-y-4 relative z-10 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <p className="text-lg font-medium text-white">{file.name}</p>
                <p className="text-sm text-slate-400">{(file.size / 1024).toFixed(2)} KB</p>
              </div>
              {!isUploading && (
                <button 
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 mt-2"
                >
                  Remove or select another
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4 relative z-10 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-slate-700/50 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-indigo-400 transition-colors" />
              </div>
              <div>
                <p className="text-lg font-medium text-white">
                  {isDragActive ? "Drop the file here..." : "Drag & drop a file here"}
                </p>
                <p className="text-sm text-slate-400 mt-1">or click to browse from your computer</p>
              </div>
              <p className="text-xs text-slate-500">Maximum file size: 50MB</p>
            </div>
          )}
        </div>

        {/* Algorithm Selection */}
        {file && (
          <div className="space-y-4 animate-in slide-in-from-bottom flex flex-col">
            <h3 className="text-white font-medium">Select Encryption Algorithm</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ALGORITHMS.map((alg) => (
                <div 
                  key={alg.id}
                  onClick={() => !isUploading && setAlgorithm(alg.id)}
                  className={`relative flex flex-col p-4 rounded-xl border cursor-pointer transition-all ${
                    algorithm === alg.id 
                      ? 'bg-indigo-600/10 border-indigo-500' 
                      : 'bg-slate-900/50 border-slate-700 hover:border-slate-500 cursor-pointer disabled:opacity-50'
                  } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${algorithm === alg.id ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                      <alg.icon className="w-4 h-4" />
                    </div>
                    <span className={`font-medium ${algorithm === alg.id ? 'text-indigo-400' : 'text-slate-300'}`}>
                      {alg.name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{alg.desc}</p>
                  
                  {algorithm === alg.id && (
                    <div className="absolute top-4 right-4w-4 h-4 text-indigo-500 right-4 rounded-full">
                      <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Action Area */}
            <div className="pt-4 border-t border-slate-700/50 mt-4 h-24">
              {isUploading ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-indigo-400 font-medium">Encrypting and uploading...</span>
                    <span className="text-slate-400">{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleUpload}
                  className="w-full py-3 px-4 rounded-xl shadow-lg shadow-indigo-500/20 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 transition-all flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  Encrypt and Secure File
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploadZone;
