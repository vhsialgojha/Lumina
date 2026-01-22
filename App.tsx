
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { AppState, StylePreset } from './types';
import CameraView from './components/CameraView';
import StyleGrid from './components/StyleGrid';
import IntensitySlider from './components/IntensitySlider';
import { STYLE_PRESETS } from './constants';
import { analyzeOutfit, transformOutfit, generateVideoFromOutfit } from './services/geminiService';

const App: React.FC = () => {
  const [state, setState] = useState<AppState & { videoUrl?: string | null }>({
    step: 'welcome',
    capturedImage: null,
    selectedStyle: null,
    resultImage: null,
    error: null,
    videoUrl: null,
  });

  const [customPrompt, setCustomPrompt] = useState("");
  const [editableBaseDescription, setEditableBaseDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Tailoring your new look...");
  const [intensity, setIntensity] = useState(100);
  const [blurBackground, setBlurBackground] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem('lumina_favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [userStyles, setUserStyles] = useState<StylePreset[]>(() => {
    const saved = localStorage.getItem('lumina_user_styles');
    return saved ? JSON.parse(saved) : [];
  });
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [isNamingStyle, setIsNamingStyle] = useState(false);
  const [newStyleName, setNewStyleName] = useState("");
  
  const customInputRef = useRef<HTMLTextAreaElement>(null);
  const baseDescRef = useRef<HTMLTextAreaElement>(null);

  const allStyles = useMemo(() => [...STYLE_PRESETS, ...userStyles], [userStyles]);

  const loadingMessages = [
    "Analyzing silhouette...",
    "Selecting fabrics...",
    "Stitching details...",
    "Adjusting light...",
    "Applying filters...",
    "Almost ready..."
  ];

  const videoLoadingMessages = [
    "Rendering cinematic motion...",
    "Animating textures...",
    "Compositing scene...",
    "Perfecting camera movement...",
    "Finalizing fashion sequence..."
  ];

  // Deep linking logic
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedStyleId = params.get('style');
    const customEncoded = params.get('custom');

    if (sharedStyleId) {
      const found = allStyles.find(s => s.id === sharedStyleId);
      if (found) {
        setState(prev => ({ ...prev, selectedStyle: found }));
        showToast(`Imported ${found.name} style!`);
      }
    } else if (customEncoded) {
      try {
        const decoded = JSON.parse(atob(customEncoded));
        if (decoded.prompt) {
          setCustomPrompt(decoded.prompt);
          showToast("Imported custom shared style!");
        }
      } catch (e) {
        console.error("Failed to decode shared style", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('lumina_favorites', JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem('lumina_user_styles', JSON.stringify(userStyles));
  }, [userStyles]);

  useEffect(() => {
    let interval: number;
    if (state.step === 'transforming' || (state.step as any) === 'video_loading') {
      let i = 0;
      const msgs = (state.step as any) === 'video_loading' ? videoLoadingMessages : loadingMessages;
      setLoadingMessage(msgs[0]);
      interval = window.setInterval(() => {
        i = (i + 1) % msgs.length;
        setLoadingMessage(msgs[i]);
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [state.step]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const reset = () => {
    setState({
      step: 'welcome',
      capturedImage: null,
      selectedStyle: null,
      resultImage: null,
      error: null,
      videoUrl: null,
    });
    setCustomPrompt("");
    setEditableBaseDescription("");
    setIsAnalyzing(false);
    setShowOriginal(false);
    setShowOnlyFavorites(false);
    setIntensity(100);
    setBlurBackground(false);
    setIsNamingStyle(false);
    setNewStyleName("");
  };

  const handleCapture = useCallback(async (dataUrl: string) => {
    setState(prev => ({ ...prev, capturedImage: { dataUrl }, step: 'review', error: null }));
    setIsAnalyzing(true);
    try {
      const analysis = await analyzeOutfit(dataUrl);
      setState(prev => ({
        ...prev,
        capturedImage: prev.capturedImage ? { ...prev.capturedImage, analysis } : null
      }));
      setEditableBaseDescription(analysis);
    } catch (err) {
      setEditableBaseDescription("modern clothes");
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const handleTransform = async () => {
    const activePrompt = customPrompt.trim() 
      ? `Change my outfit to: ${customPrompt}` 
      : state.selectedStyle?.prompt;

    if (!state.capturedImage || !activePrompt) return;

    setState(prev => ({ ...prev, step: 'transforming', error: null }));

    try {
      const result = await transformOutfit(
        state.capturedImage.dataUrl,
        activePrompt,
        editableBaseDescription || "modern clothes",
        blurBackground
      );
      setState(prev => ({ ...prev, step: 'result', resultImage: result }));
      setIntensity(100);
    } catch (err) {
      setState(prev => ({ ...prev, step: 'review', error: "Transformation failed. Try again." }));
    }
  };

  const handleAnimateLook = async () => {
    if (!state.resultImage) return;

    // @ts-ignore
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
    }

    setState(prev => ({ ...prev, step: 'transforming', error: null })); 
    setLoadingMessage(videoLoadingMessages[0]);

    try {
      const video = await generateVideoFromOutfit(
        state.resultImage, 
        state.selectedStyle?.name || "Custom Style"
      );
      setState(prev => ({ ...prev, step: 'result', videoUrl: video }));
    } catch (err) {
      console.error(err);
      setState(prev => ({ ...prev, step: 'result', error: "Video generation failed. Please use a paid API key." }));
    }
  };

  const handleSaveCustomStyle = () => {
    if (!newStyleName.trim() || !customPrompt.trim()) return;
    
    const newStyle: StylePreset = {
      id: `custom-${Date.now()}`,
      name: newStyleName.trim(),
      description: 'Your custom vision',
      prompt: customPrompt.trim(),
      icon: '✨',
      isCustom: true
    };

    setUserStyles(prev => [...prev, newStyle]);
    setState(prev => ({ ...prev, selectedStyle: newStyle }));
    setCustomPrompt("");
    setIsNamingStyle(false);
    setNewStyleName("");
    showToast("Style saved to your collection!");
  };

  const handleDeleteStyle = (id: string) => {
    setUserStyles(prev => prev.filter(s => s.id !== id));
    if (state.selectedStyle?.id === id) {
      setState(prev => ({ ...prev, selectedStyle: null }));
    }
    setFavorites(prev => prev.filter(f => f !== id));
    showToast("Style deleted.");
  };

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const shareStyle = (style: StylePreset) => {
    const url = new URL(window.location.href);
    url.searchParams.set('style', style.id);
    navigator.clipboard.writeText(url.toString());
    showToast(`Link for ${style.name} copied!`);
  };

  const shareCustomStylePrompt = () => {
    if (!customPrompt.trim()) return;
    const data = btoa(JSON.stringify({ prompt: customPrompt }));
    const url = new URL(window.location.href);
    url.searchParams.set('custom', data);
    navigator.clipboard.writeText(url.toString());
    showToast(`Custom style link copied!`);
  };

  const isReadyToTransform = !!state.selectedStyle || customPrompt.trim().length > 3;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans select-none">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 bg-white text-black rounded-full font-bold text-xs shadow-2xl animate-bounce">
          {toast}
        </div>
      )}

      {/* Welcome Screen */}
      {state.step === 'welcome' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-md mx-auto text-center space-y-8">
          <div className="space-y-3">
            <h1 className="text-5xl font-serif font-bold italic tracking-tighter text-white">Lumina</h1>
            <p className="text-zinc-400 text-sm">AI virtual wardrobe. Transform your look instantly.</p>
          </div>
          <div className="w-full relative px-2">
            <div className="aspect-[4/5] bg-zinc-900 rounded-[2rem] overflow-hidden relative border border-zinc-800 shadow-2xl">
              <img src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover opacity-60 grayscale" alt="Preview" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
              <div className="absolute bottom-5 left-5 right-5 flex justify-between items-end">
                <div className="text-left"><h2 className="text-lg font-medium">Virtual Style</h2></div>
              </div>
            </div>
          </div>
          <button onClick={() => setState(prev => ({ ...prev, step: 'camera' }))} className="w-full bg-white text-black py-4 rounded-full font-bold text-base hover:bg-zinc-200 shadow-xl">Start Capture</button>
        </div>
      )}

      {state.step === 'camera' && <CameraView onCapture={handleCapture} onCancel={reset} />}

      {state.step === 'review' && state.capturedImage && (
        <div className="flex-1 flex flex-col bg-black overflow-hidden">
          <div className="p-3 flex items-center justify-between border-b border-white/5 bg-black/80 backdrop-blur-xl z-20">
            <button onClick={reset} className="p-2 text-white/60"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
            <h2 className="font-bold text-xs uppercase tracking-widest text-white/80">Style Canvas</h2>
            <div className="w-10"></div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-6 max-w-2xl mx-auto">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 relative">
              <img src={state.capturedImage.dataUrl} className={`w-full h-full object-cover transition-all duration-500 ${blurBackground ? 'scale-105' : 'scale-100'}`} alt="Original" />
              {blurBackground && (
                 <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px] pointer-events-none flex items-center justify-center">
                    <div className="px-3 py-1 bg-black/60 rounded-full border border-white/20">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white">Portrait Focus Active</span>
                    </div>
                 </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-zinc-900/40 border border-white/5 rounded-2xl space-y-2 col-span-2">
                <h3 className="text-zinc-500 text-[9px] font-bold uppercase tracking-[0.2em]">Detected Outfit</h3>
                <textarea ref={baseDescRef} value={editableBaseDescription} onChange={(e) => setEditableBaseDescription(e.target.value)} className="w-full bg-transparent border-none text-white text-xs min-h-[40px] resize-none focus:outline-none" />
              </div>

              <button 
                onClick={() => setBlurBackground(!blurBackground)}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 col-span-2
                  ${blurBackground 
                    ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]' 
                    : 'bg-zinc-900/40 text-zinc-400 border-white/5 hover:border-white/10'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${blurBackground ? 'bg-black text-white' : 'bg-white/5 text-zinc-400'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <div className="text-left">
                    <p className="text-[11px] font-bold uppercase tracking-widest leading-none mb-1">Blur Background</p>
                    <p className="text-[9px] opacity-60 leading-tight">Apply professional bokeh portrait effect</p>
                  </div>
                </div>
              </button>
            </div>

            <div className="space-y-4 pb-32">
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-zinc-500 text-[9px] font-bold uppercase tracking-[0.2em]">Custom Prompt</h3>
                </div>
                <div className="relative group">
                  <textarea 
                    value={customPrompt} 
                    onChange={(e) => {setCustomPrompt(e.target.value); if(e.target.value.trim().length > 0) setState(prev => ({...prev, selectedStyle: null}))}} 
                    placeholder="Describe your own fashion vision..." 
                    className="w-full bg-zinc-900/50 border border-white/10 rounded-xl p-4 text-xs text-white min-h-[100px] focus:border-white/20 transition-colors" 
                  />
                  <div className="absolute bottom-3 right-3 flex gap-2">
                    {customPrompt.trim().length > 3 && (
                      <>
                        <button 
                          onClick={shareCustomStylePrompt}
                          className="p-2 bg-black/40 hover:bg-white/10 rounded-full text-white/60 transition-colors"
                          title="Share Link"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => setIsNamingStyle(true)}
                          className="p-2 bg-black/40 hover:bg-white/10 rounded-full text-white/60 transition-colors"
                          title="Save to Collection"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {isNamingStyle && (
                <div className="p-4 bg-white text-black rounded-2xl space-y-3 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-50">Save Style</h4>
                    <button onClick={() => setIsNamingStyle(false)} className="text-[10px] opacity-30 hover:opacity-100 uppercase tracking-widest font-bold">Cancel</button>
                  </div>
                  <input 
                    autoFocus
                    type="text" 
                    placeholder="Give it a name (e.g. Neon Knight)" 
                    value={newStyleName}
                    onChange={(e) => setNewStyleName(e.target.value)}
                    className="w-full bg-zinc-100 border-none p-3 rounded-xl text-xs font-bold placeholder:text-zinc-400 focus:ring-2 focus:ring-black transition-all"
                  />
                  <button 
                    onClick={handleSaveCustomStyle}
                    disabled={!newStyleName.trim()}
                    className="w-full py-3 bg-black text-white rounded-full text-xs font-bold disabled:opacity-30 transition-all"
                  >
                    Confirm Save
                  </button>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <div className="flex gap-2 p-1 bg-zinc-900/80 backdrop-blur rounded-full w-fit">
                    <button onClick={() => setShowOnlyFavorites(false)} className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all ${!showOnlyFavorites ? 'bg-white text-black' : 'text-zinc-500'}`}>All</button>
                    <button onClick={() => setShowOnlyFavorites(true)} className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5 transition-all ${showOnlyFavorites ? 'bg-white text-black' : 'text-zinc-500'}`}>Favs</button>
                  </div>
                </div>

                <StyleGrid 
                  styles={allStyles}
                  selectedId={state.selectedStyle?.id || null} 
                  onSelect={(style) => {setState(prev => ({ ...prev, selectedStyle: style })); setCustomPrompt(""); }} 
                  favorites={favorites} 
                  onToggleFavorite={toggleFavorite} 
                  onShareStyle={shareStyle}
                  onDeleteStyle={handleDeleteStyle}
                  showOnlyFavorites={showOnlyFavorites} 
                />
              </div>
            </div>
          </div>
          <div className="p-4 bg-gradient-to-t from-black via-black/95 fixed bottom-0 left-0 right-0 z-30">
            <button disabled={!isReadyToTransform || isAnalyzing} onClick={handleTransform} className={`w-full py-4 rounded-full font-bold text-base transition-all ${isReadyToTransform && !isAnalyzing ? 'bg-white text-black shadow-xl active:scale-95' : 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50'}`}>{isAnalyzing ? 'Analyzing...' : 'Transform Look'}</button>
          </div>
        </div>
      )}

      {state.step === 'transforming' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-black text-center relative overflow-hidden">
          {/* Background Data Particles */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            {[...Array(20)].map((_, i) => (
              <div 
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full animate-float-slow"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 5}s`,
                  opacity: Math.random()
                }}
              />
            ))}
          </div>

          <div className="relative z-10 flex flex-col items-center">
            {/* Orbital Rings and Silhouette */}
            <div className="relative w-48 h-48 flex items-center justify-center mb-12">
              <div className="absolute inset-0 border border-white/10 rounded-full animate-orbit-slow" />
              <div className="absolute inset-4 border border-white/20 rounded-full animate-orbit-fast" />
              <div className="absolute inset-8 border border-white/5 rounded-full animate-orbit-slow [animation-duration:15s]" />
              
              {/* Silhouette Icon */}
              <div className="relative w-32 h-32 flex items-center justify-center animate-pulse-glow">
                <svg viewBox="0 0 24 24" fill="none" className="w-24 h-24 text-white opacity-80" stroke="currentColor" strokeWidth="0.5">
                  <path d="M12 2C10.3431 2 9 3.34315 9 5C9 6.65685 10.3431 8 12 8C13.6569 8 15 6.65685 15 5C15 3.34315 13.6569 2 12 2Z" fill="currentColor"/>
                  <path d="M12 9C9.23858 9 7 11.2386 7 14V17H17V14C17 11.2386 14.7614 9 12 9Z" fill="currentColor"/>
                  <path d="M7 18V22H10V18H7ZM14 18V22H17V18H14Z" fill="currentColor"/>
                </svg>
                
                {/* Horizontal Scan Line */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 animate-scan" />
              </div>
            </div>

            <div className="space-y-4 max-w-xs transition-all duration-700">
              <div className="flex flex-col items-center gap-1">
                <h2 className="text-2xl font-serif italic text-white tracking-wide animate-pulse">
                  {loadingMessage}
                </h2>
                <div className="flex gap-1 h-1 mt-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-bounce" />
                </div>
              </div>
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.3em]">
                Neural Threads Initializing
              </p>
            </div>
          </div>
        </div>
      )}

      {state.step === 'result' && state.resultImage && (
        <div className="flex-1 flex flex-col bg-black overflow-hidden">
          <div className="p-3 flex items-center justify-between border-b border-white/5 bg-black/80 backdrop-blur-xl z-20">
            <button onClick={() => setState(prev => ({ ...prev, videoUrl: null, resultImage: state.videoUrl ? state.resultImage : null, step: state.videoUrl ? 'result' : 'review' }))} className="p-2 text-white/60">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 8.959 8.959 0 01-9 9 8.959 8.959 0 01-9-9z" /></svg>
            </button>
            <div className="flex flex-col items-center">
              <h2 className="font-bold text-[10px] uppercase tracking-widest text-white/50 leading-none">{state.videoUrl ? 'Cinematic' : 'Result'}</h2>
              <span className="text-xs font-serif italic">{state.selectedStyle?.name || "Custom"}</span>
            </div>
            <button onClick={reset} className="p-2 text-white/60"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg></button>
          </div>

          <div className="flex-1 flex flex-col items-center p-4 space-y-4 max-w-2xl mx-auto w-full overflow-y-auto">
            {state.videoUrl ? (
              <div className="relative w-full aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl bg-zinc-900">
                <video src={state.videoUrl} autoPlay loop playsInline className="w-full h-full object-cover" controls />
              </div>
            ) : (
              <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl group ring-1 ring-white/10" onMouseDown={() => setShowOriginal(true)} onMouseUp={() => setShowOriginal(false)} onTouchStart={() => setShowOriginal(true)} onTouchEnd={() => setShowOriginal(false)}>
                <img src={state.capturedImage?.dataUrl} className="absolute inset-0 w-full h-full object-cover" alt="Original" />
                <img src={state.resultImage} className="absolute inset-0 w-full h-full object-cover transition-opacity duration-150" style={{ opacity: showOriginal ? 0 : intensity / 100 }} alt="Result" />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full flex items-center gap-2 transition-all group-active:scale-110"><span className="text-[9px] uppercase font-bold tracking-widest whitespace-nowrap opacity-80">Hold to Compare</span></div>
              </div>
            )}

            {!state.videoUrl && (
              <IntensitySlider value={intensity} onChange={setIntensity} />
            )}

            {state.error && <div className="text-red-400 text-xs p-2 bg-red-400/10 rounded-lg w-full text-center">{state.error}</div>}

            <div className="grid grid-cols-2 gap-3 w-full pb-8">
              {!state.videoUrl && (
                <button onClick={handleAnimateLook} className="col-span-2 flex items-center justify-center gap-2 bg-white/10 border border-white/20 py-4 rounded-2xl hover:bg-white/20 transition-all active:scale-[0.98]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-white">Cinematic Motion (Veo)</span>
                </button>
              )}
              
              <button onClick={() => {if(state.videoUrl) { const a = document.createElement('a'); a.href=state.videoUrl; a.download='lumina-motion.mp4'; a.click();} else {const a = document.createElement('a'); a.href=state.resultImage!; a.download='look.png'; a.click();}}} className="flex items-center justify-center gap-2 bg-zinc-900 border border-white/10 py-4 rounded-2xl active:scale-[0.98] transition-all">
                <span className="text-[11px] font-bold uppercase tracking-widest">Save</span>
              </button>
              
              <button className="flex items-center justify-center gap-2 bg-white text-black py-4 rounded-2xl active:scale-[0.98] transition-all" onClick={() => { if(navigator.share) navigator.share({ title: 'Lumina Look', url: state.videoUrl || state.resultImage! }); }}>
                <span className="text-[11px] font-bold uppercase tracking-widest">Share</span>
              </button>
            </div>

            <p className="text-[8px] text-zinc-600 text-center">*Video generation requires a billing-enabled API key and may take 30-60s.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
