import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ fullScreen = false }) => {
  const content = (
    <div className="flex flex-col items-center justify-center gap-2">
      <Loader2 className="w-8 h-8 text-brand-green animate-spin" />
      <span className="text-sm text-gray-500 font-medium">Memuat...</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return <div className="p-8 w-full flex justify-center">{content}</div>;
};

export default LoadingSpinner;
