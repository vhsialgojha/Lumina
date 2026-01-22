
import React, { useRef, useEffect, useState, useCallback } from 'react';

interface CameraViewProps {
  onCapture: (base64: string) => void;
  onCancel: () => void;
}

const CameraView: React.FC<CameraViewProps> = ({ onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const startCamera = useCallback(async () => {
    // Stop any existing stream before starting a new one
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    try {
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { min: 640, ideal: 1920 },
          height: { min: 480, ideal: 1080 },
          aspectRatio: { ideal: 0.5625 } 
        },
        audio: false
      };
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsReady(false); // Reset ready state while new stream loads
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Unable to access camera. Please check permissions.");
    }
  }, [facingMode]);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Horizontal flip if front camera is active for natural feel
        if (facingMode === 'user') {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        onCapture(dataUrl);
      }
    }
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50">
      {/* Immersive Camera Layer */}
      <div className="absolute inset-0 flex items-center justify-center bg-zinc-950">
        {error ? (
          <div className="p-8 text-center max-w-xs z-20">
            <p className="text-white text-base font-medium mb-4">{error}</p>
            <button 
              onClick={onCancel}
              className="w-full py-3 bg-white text-black rounded-full font-bold text-sm"
            >
              Go Back
            </button>
          </div>
        ) : (
          <video 
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onLoadedMetadata={() => setIsReady(true)}
            className={`w-full h-full transition-opacity duration-700 ${isReady ? 'opacity-100' : 'opacity-0'} object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
          />
        )}

        {/* Framing Overlay */}
        {!error && isReady && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-10">
            <div className="absolute inset-0 border-[5vw] border-black/20"></div>
            <div className="relative w-[85vw] h-[80vh] border border-white/20 rounded-[4rem]">
               <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-white/60 rounded-tl-[4rem]"></div>
               <div className="absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2 border-white/60 rounded-tr-[4rem]"></div>
               <div className="absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2 border-white/60 rounded-bl-[4rem]"></div>
               <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-white/60 rounded-br-[4rem]"></div>
            </div>
            <p className="mt-8 text-white/70 text-[10px] font-bold uppercase tracking-[0.4em] bg-black/60 px-4 py-2 rounded-full backdrop-blur-md border border-white/10 shadow-2xl">
              Center Your Silhouette
            </p>
          </div>
        )}
      </div>

      {/* Top Controls */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20">
        <button 
          onClick={onCancel}
          className="p-3 rounded-full bg-black/40 backdrop-blur-xl text-white border border-white/10 active:scale-90 transition-transform shadow-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="px-4 py-1.5 bg-black/40 backdrop-blur-xl rounded-full border border-white/10 shadow-lg">
          <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/90">Lumina Eye</span>
        </div>

        <button 
          onClick={toggleCamera}
          className="p-3 rounded-full bg-black/40 backdrop-blur-xl text-white border border-white/10 active:scale-90 transition-transform shadow-lg"
          aria-label="Toggle camera"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Bottom Shutter Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-10 pb-16 flex flex-col items-center bg-gradient-to-t from-black/90 via-black/40 to-transparent z-20">
        <button 
          onClick={handleCapture}
          disabled={!isReady || !!error}
          className={`
            relative w-20 h-20 rounded-full border-4 border-white p-1.5 transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.2)]
            ${isReady ? 'opacity-100 scale-100 active:scale-95' : 'opacity-30 scale-90'}
          `}
        >
          <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
             <div className="w-3 h-3 bg-black/20 rounded-full"></div>
          </div>
          {/* Animated rings for focus effect */}
          {isReady && (
            <div className="absolute -inset-3 border-2 border-white/10 rounded-full animate-ping [animation-duration:3s]"></div>
          )}
        </button>
      </div>
      
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraView;
