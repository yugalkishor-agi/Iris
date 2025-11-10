import { createContext, useContext, useState, ReactNode } from 'react';

interface UploadContextType {
  isUploading: boolean;
  uploadProgress: number;
  uploadType: 'story' | 'post' | 'glimpse' | null;
  startUpload: (type: 'story' | 'post' | 'glimpse') => void;
  updateProgress: (progress: number) => void;
  completeUpload: () => void;
  cancelUpload: () => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export function UploadProvider({ children }: { children: ReactNode }) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadType, setUploadType] = useState<'story' | 'post' | 'glimpse' | null>(null);

  const startUpload = (type: 'story' | 'post' | 'glimpse') => {
    setIsUploading(true);
    setUploadProgress(0);
    setUploadType(type);
  };

  const updateProgress = (progress: number) => {
    setUploadProgress(progress);
  };

  const completeUpload = () => {
    setUploadProgress(100);
    setTimeout(() => {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadType(null);
    }, 2000);
  };

  const cancelUpload = () => {
    setIsUploading(false);
    setUploadProgress(0);
    setUploadType(null);
  };

  return (
    <UploadContext.Provider
      value={{
        isUploading,
        uploadProgress,
        uploadType,
        startUpload,
        updateProgress,
        completeUpload,
        cancelUpload,
      }}
    >
      {children}
    </UploadContext.Provider>
  );
}

export function useUpload() {
  const context = useContext(UploadContext);
  if (context === undefined) {
    throw new Error('useUpload must be used within an UploadProvider');
  }
  return context;
}
