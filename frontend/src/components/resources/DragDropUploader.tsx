import React, { useState, useRef } from 'react';
import { Upload, X, File as FileIcon, AlertCircle } from 'lucide-react';
import { resourceService } from '../../services/resource.service';
import type { Group } from '../../services/group.service';

interface Props {
  groupId?: number;
  groups?: Group[];
  onUploadSuccess: () => void;
  onClose: () => void;
}

export function DragDropUploader({ groupId, groups, onUploadSuccess, onClose }: Props) {
  const [selectedGroupId, setSelectedGroupId] = useState<number | undefined>(groupId || (groups && groups.length > 0 ? groups[0].id : undefined));
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    setError(null);
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'text/markdown'];
    const validExtensions = ['.pdf', '.docx', '.pptx', '.md'];
    
    const isValid = allowed.includes(file.type) || validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
    
    if (!isValid) {
      setError("Unsupported file type. Please upload PDF, DOCX, PPTX, or MD.");
      return;
    }
    
    if (file.size > 50 * 1024 * 1024) { // 50MB
      setError("File is too large. Maximum size is 50MB.");
      return;
    }
    
    setFile(file);
  };

  const handleUpload = async () => {
    if (!file || !selectedGroupId) return;
    
    setUploading(true);
    setProgress(10); // Fake progress to indicate start
    
    try {
      // We simulate upload progress since standard fetch doesn't easily support upload progress events
      const progressInterval = setInterval(() => {
        setProgress(p => p >= 90 ? 90 : p + 10);
      }, 300);
      
      await resourceService.uploadResource(selectedGroupId, file);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      setTimeout(() => {
        onUploadSuccess();
      }, 500);
    } catch (err: any) {
      setError(err.message || "Failed to upload file");
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface border border-border w-full max-w-lg rounded-2xl shadow-xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-bold text-lg">Upload Resource</h3>
          <button onClick={onClose} disabled={uploading} className="p-1 hover:bg-border-soft rounded-md transition-colors disabled:opacity-50 text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!file ? (
            <div 
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-colors ${
                dragActive ? 'border-primary bg-primary-soft' : 'border-border hover:border-primary/50 hover:bg-border-soft/30'
              }`}
            >
              <input 
                ref={inputRef}
                type="file" 
                className="hidden" 
                accept=".pdf,.docx,.pptx,.md"
                onChange={handleChange}
              />
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-colors ${dragActive ? 'bg-primary text-white' : 'bg-border-soft text-muted-foreground'}`}>
                <Upload className="w-6 h-6" />
              </div>
              <p className="font-semibold text-[15px] mb-1">Click to upload or drag and drop</p>
              <p className="text-muted-foreground text-[13px]">PDF, DOCX, PPTX, or MD (max. 50MB)</p>
            </div>
          ) : (
            <div className="border border-border rounded-xl p-5 bg-background">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0">
                  <FileIcon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[14px] truncate" title={file.name}>{file.name}</p>
                  <p className="text-muted-foreground text-[12px] mt-0.5">{resourceService.formatFileSize(file.size)}</p>
                  
                  {uploading && (
                    <div className="mt-4">
                      <div className="flex justify-between text-[11px] font-medium mb-1.5">
                        <span className="text-primary">Uploading...</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-border-soft rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                {!uploading && (
                  <button onClick={() => setFile(null)} className="p-1.5 hover:bg-border-soft rounded-md text-muted-foreground">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {!groupId && groups && groups.length > 0 && (
            <div className="mt-4">
              <label className="block text-[13px] font-semibold mb-1.5">Upload to group</label>
              <select 
                value={selectedGroupId || ''}
                onChange={(e) => setSelectedGroupId(Number(e.target.value))}
                disabled={uploading}
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-2.5 text-red-600">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p className="text-[13px] font-medium">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-border-soft/20 flex justify-end gap-3">
          <button 
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 text-[14px] font-semibold text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleUpload}
            disabled={!file || uploading || !selectedGroupId}
            className="px-5 py-2 text-[14px] font-semibold bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              'Upload Resource'
            )}
          </button>
        </div>
        
      </div>
    </div>
  );
}
