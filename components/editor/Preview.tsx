'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  RefreshCw, ExternalLink, Smartphone, Tablet, Monitor,
  Maximize2, Minimize2, Globe, Copy, Check, X, ChevronDown
} from 'lucide-react';

interface PreviewProps {
  url?: string;
  html?: string;
  port?: number;
  onRefresh?: () => void;
  className?: string;
}

type DeviceMode = 'desktop' | 'tablet' | 'mobile';

const deviceSizes: Record<DeviceMode, { width: number; height: number; label: string }> = {
  mobile: { width: 375, height: 667, label: 'iPhone SE' },
  tablet: { width: 768, height: 1024, label: 'iPad' },
  desktop: { width: 1280, height: 800, label: 'Desktop' },
};

export function Preview({
  url,
  html,
  port = 3000,
  onRefresh,
  className = '',
}: PreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [customUrl, setCustomUrl] = useState(url || `http://localhost:${port}`);
  const [showUrlBar, setShowUrlBar] = useState(true);
  const [copied, setCopied] = useState(false);

  const previewUrl = url || `http://localhost:${port}`;

  useEffect(() => {
    setCustomUrl(previewUrl);
  }, [previewUrl]);

  const handleLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  const handleError = () => {
    setIsLoading(false);
    setError('Failed to load preview. Make sure the development server is running.');
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setError(null);
    
    if (iframeRef.current) {
      // Force reload
      const currentSrc = iframeRef.current.src;
      iframeRef.current.src = '';
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.src = currentSrc;
        }
      }, 100);
    }
    
    onRefresh?.();
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (iframeRef.current) {
      iframeRef.current.src = customUrl;
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(customUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenExternal = () => {
    window.open(customUrl, '_blank');
  };

  const renderContent = () => {
    if (html) {
      // Render HTML directly using srcdoc
      return (
        <iframe
          ref={iframeRef}
          srcDoc={html}
          className="w-full h-full border-0 bg-white"
          onLoad={handleLoad}
          onError={handleError}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          title="Preview"
        />
      );
    }

    return (
      <iframe
        ref={iframeRef}
        src={customUrl}
        className="w-full h-full border-0 bg-white"
        onLoad={handleLoad}
        onError={handleError}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        title="Preview"
      />
    );
  };

  const deviceSize = deviceSizes[deviceMode];

  return (
    <div className={`flex flex-col h-full bg-gray-950 ${isFullscreen ? 'fixed inset-0 z-50' : ''} ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-2">
          {/* Navigation */}
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {/* URL Bar */}
          {showUrlBar && (
            <form onSubmit={handleUrlSubmit} className="flex items-center">
              <div className="flex items-center bg-gray-800 rounded-lg overflow-hidden">
                <div className="px-3 py-1.5 border-r border-gray-700">
                  <Globe className="w-4 h-4 text-gray-500" />
                </div>
                <input
                  type="text"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="w-64 px-3 py-1.5 bg-transparent text-sm focus:outline-none"
                  placeholder="Enter URL"
                />
                <button
                  type="button"
                  onClick={handleCopyUrl}
                  className="px-2 py-1.5 hover:bg-gray-700 border-l border-gray-700"
                  title="Copy URL"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Device Mode */}
          <div className="flex items-center bg-gray-800 rounded-lg p-0.5">
            <button
              onClick={() => setDeviceMode('mobile')}
              className={`p-1.5 rounded ${deviceMode === 'mobile' ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
              title="Mobile view"
            >
              <Smartphone className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeviceMode('tablet')}
              className={`p-1.5 rounded ${deviceMode === 'tablet' ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
              title="Tablet view"
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeviceMode('desktop')}
              className={`p-1.5 rounded ${deviceMode === 'desktop' ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
              title="Desktop view"
            >
              <Monitor className="w-4 h-4" />
            </button>
          </div>

          <div className="w-px h-6 bg-gray-700" />

          {/* Actions */}
          <button
            onClick={handleOpenExternal}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Preview Container */}
      <div className="flex-1 flex items-center justify-center bg-gray-800 overflow-auto p-4">
        <div
          className={`bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-300 ${
            deviceMode === 'desktop' ? 'w-full h-full' : ''
          }`}
          style={deviceMode !== 'desktop' ? {
            width: deviceSize.width,
            height: deviceSize.height,
            maxWidth: '100%',
            maxHeight: '100%',
          } : undefined}
        >
          {/* Device Frame (for mobile/tablet) */}
          {deviceMode !== 'desktop' && (
            <div className="h-6 bg-gray-200 flex items-center justify-center border-b border-gray-300">
              <div className="w-16 h-1 bg-gray-400 rounded-full" />
            </div>
          )}

          {/* Content */}
          <div className={`${deviceMode !== 'desktop' ? 'h-[calc(100%-24px)]' : 'h-full'} relative`}>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <div className="flex flex-col items-center gap-3">
                  <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
                  <span className="text-gray-500">Loading preview...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 p-8">
                <div className="flex flex-col items-center gap-4 text-center max-w-md">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <X className="w-8 h-8 text-red-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Preview Unavailable</h3>
                  <p className="text-gray-600">{error}</p>
                  <button
                    onClick={handleRefresh}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {renderContent()}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-1 bg-gray-900 border-t border-gray-800 text-xs text-gray-500">
        <div className="flex items-center gap-4">
          <span className={`flex items-center gap-1 ${isLoading ? 'text-yellow-500' : 'text-green-500'}`}>
            <span className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
            {isLoading ? 'Loading...' : 'Ready'}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span>{deviceSize.label}</span>
          <span>{deviceSize.width} x {deviceSize.height}</span>
        </div>
      </div>
    </div>
  );
}

export default Preview;
