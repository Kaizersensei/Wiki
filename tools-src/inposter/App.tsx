
import React, { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import { SocialPlatform, PostVariant, AppState, PostGoal, HistoryItem } from './types';
import { PLATFORMS_CONFIG } from './constants';

const STORAGE_KEY = 'omnipost_history_v3';

export const getPublishUrl = (platform: SocialPlatform, content: string, hashtags: string[] = []): string => {
  const hashtagText = hashtags.length > 0 ? '\n\n' + hashtags.map(h => `#${h}`).join(' ') : '';
  const fullText = `${content}${hashtagText}`.trim();
  const encodedText = encodeURIComponent(fullText);

  switch (platform) {
    case SocialPlatform.TWITTER:
      return `https://twitter.com/intent/tweet?text=${encodedText}`;
    case SocialPlatform.BLUESKY:
      return `https://bsky.app/intent/compose?text=${encodedText}`;
    case SocialPlatform.THREADS:
      return `https://www.threads.net/intent/post?text=${encodedText}`;
    case SocialPlatform.FACEBOOK:
      return 'https://www.facebook.com';
    case SocialPlatform.YOUTUBE:
      return 'https://www.youtube.com/community';
    case SocialPlatform.INSTAGRAM:
      return 'https://www.instagram.com';
    case SocialPlatform.KOFI:
      return 'https://ko-fi.com/manage/posts';
    case SocialPlatform.PATREON:
      return 'https://www.patreon.com/posts/new';
    case SocialPlatform.KICKSTARTER:
      return 'https://www.kickstarter.com';
    default:
      return '';
  }
};

const App: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activePlannerTab, setActivePlannerTab] = useState<'config' | 'previews'>('config');
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return {
      baseDraft: '',
      variants: [],
      isGenerating: false,
      selectedPlatforms: [SocialPlatform.TWITTER, SocialPlatform.BLUESKY, SocialPlatform.YOUTUBE],
      selectedGoals: [PostGoal.NEWS],
      history: saved ? JSON.parse(saved) : [],
      view: 'planner'
    };
  });

  const [isPublishDropdownOpen, setIsPublishDropdownOpen] = useState(false);
  const publishDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (publishDropdownRef.current && !publishDropdownRef.current.contains(event.target as Node)) {
        setIsPublishDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.history));
  }, [state.history]);

  const togglePlatform = (p: SocialPlatform) => {
    setState(prev => ({
      ...prev,
      selectedPlatforms: prev.selectedPlatforms.includes(p)
        ? prev.selectedPlatforms.filter(x => x !== p)
        : [...prev.selectedPlatforms, p]
    }));
  };


  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setState(prev => ({ ...prev, mediaUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRestore = (item: HistoryItem) => {
    setState(prev => ({
      ...prev,
      baseDraft: item.baseDraft,
      variants: item.variants,
      mediaUrl: item.mediaUrl,
      selectedGoals: item.goals,
      view: 'planner'
    }));
    setActivePlannerTab('previews');
  };

  const handlePreview = () => {
    if (!state.baseDraft.trim()) return;
    const variants: PostVariant[] = state.selectedPlatforms.map(platform => ({
      platform, content: state.baseDraft, hashtags: [],
      charCount: state.baseDraft.length, status: 'draft'
    }));
    const item: HistoryItem = {
      id: crypto.randomUUID(), timestamp: Date.now(), baseDraft: state.baseDraft,
      variants, mediaUrl: state.mediaUrl, goals: state.selectedGoals,
      category: state.selectedGoals[0] || 'Uncategorized'
    };
    setState(prev => ({ ...prev, variants, history: [item, ...prev.history] }));
    setActivePlannerTab('previews');
  };

  const deleteHistoryItem = (id: string) => {
    setState(prev => ({
      ...prev,
      history: prev.history.filter(h => h.id !== id)
    }));
  };

  const clearHistory = () => {
    if (confirm("Clear all history?")) {
      setState(prev => ({ ...prev, history: [] }));
    }
  };

  const handlePublishAll = () => {
    if (state.variants.length === 0) return;

    const confirmPublish = confirm("This will open multiple browser tabs (one for each platform). If some tabs do not open, please allow pop-ups for this site.");
    if (!confirmPublish) return;

    // Copy first variant text to clipboard for initial paste convenience
    if (state.variants.length > 0) {
      const firstVariant = state.variants[0];
      const fullContent = `${firstVariant.content}\n\n${firstVariant.hashtags.map(h => `#${h}`).join(' ')}`.trim();
      navigator.clipboard.writeText(fullContent).catch(err => console.error("Clipboard copy failed: ", err));
    }

    state.variants.forEach((v) => {
      const url = getPublishUrl(v.platform, v.content, v.hashtags);
      if (url) {
        window.open(url, '_blank');
      }
    });
    setIsPublishDropdownOpen(false);
  };

  const handlePublishSingle = (variant: PostVariant) => {
    const fullContent = `${variant.content}\n\n${variant.hashtags.map(h => `#${h}`).join(' ')}`.trim();
    navigator.clipboard.writeText(fullContent).then(() => {
      const url = getPublishUrl(variant.platform, variant.content, variant.hashtags);
      if (url) {
        window.open(url, '_blank');
      }
    }).catch(err => {
      console.error("Clipboard copy failed: ", err);
      const url = getPublishUrl(variant.platform, variant.content, variant.hashtags);
      if (url) {
        window.open(url, '_blank');
      }
    });
    setIsPublishDropdownOpen(false);
  };

  return (
    <Layout currentView={state.view} onViewChange={(v) => setState(prev => ({ ...prev, view: v }))}>
      <div className="flex-1 flex flex-col h-full bg-slate-50/50">
        <header className="bg-white border-b border-slate-200 px-4 lg:px-8 py-3 lg:py-5 z-10 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
            <h1 className="text-lg lg:text-xl font-black text-slate-800 tracking-tight">
              {state.view === 'planner' ? 'Compose Post' : 'Archive'}
            </h1>

            {state.view === 'planner' && (
              <div className="flex items-center gap-2 lg:gap-3 w-full sm:w-auto">
                <div className="flex items-center gap-2 lg:gap-3 overflow-x-auto pb-1 sm:pb-0 scrollbar-hide flex-1 sm:flex-none">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    className="hidden"
                    accept="image/*"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="whitespace-nowrap px-3 py-2 text-[10px] lg:text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
                  >
                    <UploadIcon className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">Upload</span>
                  </button>

                  <button
                    onClick={handlePreview}
                    disabled={state.isGenerating || !state.baseDraft}
                    className="whitespace-nowrap px-4 py-2 lg:px-6 lg:py-2.5 text-[10px] lg:text-xs font-black text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center gap-2"
                  >
                    {state.isGenerating ? <LoadingSpinner className="w-3 h-3" /> : <SparklesIcon className="w-3 h-3" />}
                    Preview
                  </button>
                </div>

                {state.variants.length > 0 && (
                  <div className="relative inline-block text-left" ref={publishDropdownRef}>
                    <button
                      onClick={() => setIsPublishDropdownOpen(!isPublishDropdownOpen)}
                      className="whitespace-nowrap px-4 py-2 lg:px-6 lg:py-2.5 text-[10px] lg:text-xs font-black text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all flex items-center gap-2"
                    >
                      <SendIcon className="w-3.5 h-3.5" />
                      Publish...
                      <ChevronDownIcon className="w-3 h-3 ml-1" />
                    </button>
                    {isPublishDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 p-2 py-3 origin-top-right">
                        <div className="px-3 pb-2 mb-2 border-b border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Publish Actions</p>
                        </div>

                        <button
                          onClick={handlePublishAll}
                          className="w-full text-left px-3 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50 rounded-xl flex items-center gap-2.5 transition-colors"
                        >
                          <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                            <SendIcon className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-black">Publish All Selected</p>
                            <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-wider">Opens {state.variants.length} tabs</p>
                          </div>
                        </button>

                        <div className="my-2 border-t border-slate-100"></div>

                        <div className="px-3 pb-1.5">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Single Platform</p>
                        </div>

                        <div className="space-y-0.5 max-h-48 overflow-y-auto custom-scrollbar">
                          {state.variants.map((v, idx) => {
                            const config = PLATFORMS_CONFIG.find(pc => pc.id === v.platform);
                            return (
                              <button
                                key={idx}
                                onClick={() => handlePublishSingle(v)}
                                className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-2.5 transition-colors"
                              >
                                <div className={`w-6 h-6 rounded-lg ${config?.color || 'bg-slate-200'} flex items-center justify-center text-white scale-90`}>
                                  {config?.icon ? config.icon({ className: 'w-3.5 h-3.5' }) : null}
                                </div>
                                <span className="truncate font-black">Open {v.platform}</span>
                              </button>
                            );
                          })}
                        </div>

                        <div className="mt-3 px-3 pt-2 border-t border-slate-100 text-[9px] text-slate-400 font-medium leading-tight">
                          💡 Opens platform composer in a new tab & copies content to clipboard!
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            {state.view === 'history' && state.history.length > 0 && (
              <button onClick={clearHistory} className="text-xs font-bold text-red-500 hover:underline">Clear Archive</button>
            )}
          </div>

          {/* Planner Sub-Tabs for Mobile Only */}
          {state.view === 'planner' && (
            <div className="flex lg:hidden mt-3 p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setActivePlannerTab('config')}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${activePlannerTab === 'config' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
              >
                1. Design
              </button>
              <button
                onClick={() => setActivePlannerTab('previews')}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${activePlannerTab === 'previews' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
              >
                2. Pre-view ({state.variants.length})
              </button>
            </div>
          )}
        </header>

        <div className="flex-1 overflow-hidden">
          {state.view === 'planner' ? (
            <div className="flex flex-col lg:flex-row h-full">
              {/* Left Panel: Configuration */}
              <aside className={`w-full lg:w-[420px] lg:h-full border-b lg:border-b-0 lg:border-r border-slate-200 bg-white p-4 lg:p-6 overflow-y-auto custom-scrollbar space-y-6 lg:space-y-8 ${activePlannerTab === 'config' ? 'block' : 'hidden lg:block'}`}>
                <div>
                  <label className="text-[9px] lg:text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 lg:mb-4 block">1. Channels</label>
                  <div className="grid grid-cols-2 lg:grid-cols-2 gap-2">
                    {PLATFORMS_CONFIG.map(p => (
                      <button
                        key={p.id}
                        onClick={() => togglePlatform(p.id)}
                        className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border text-[10px] lg:text-[11px] font-bold transition-all ${state.selectedPlatforms.includes(p.id) ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'}`}
                      >
                        <div className={`w-5 h-5 rounded-md ${p.color} flex items-center justify-center text-white scale-75 shadow-sm`}>
                          {p.icon({ className: 'w-3 h-3' })}
                        </div>
                        <span className="truncate">{p.id}</span>
                      </button>
                    ))}
                  </div>
                </div>



                <div className="flex-1">
                  <label className="text-[9px] lg:text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3 lg:mb-4 block">
                    2. Draft Content
                  </label>
                  <textarea
                    value={state.baseDraft}
                    onChange={(e) => setState(prev => ({ ...prev, baseDraft: e.target.value }))}
                    placeholder="Type exactly what you want posted..."
                    className="w-full h-32 lg:h-48 bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs lg:text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-300 shadow-inner"
                  />
                  {state.mediaUrl && (
                    <div className="mt-4 relative group">
                      <img src={state.mediaUrl} className="w-full h-40 lg:h-48 object-cover rounded-xl border border-slate-100 shadow-sm" alt="Preview attachment" />
                      <button
                        onClick={() => setState(prev => ({ ...prev, mediaUrl: undefined }))}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black transition-all shadow-xl"
                      >
                         <XIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </aside>

              {/* Center Panel: Previews */}
              <section className={`flex-1 p-4 lg:p-10 overflow-y-auto custom-scrollbar space-y-8 lg:space-y-12 ${activePlannerTab === 'previews' ? 'block' : 'hidden lg:block'}`}>
                {state.variants.length === 0 ? (
                  <div className="h-full min-h-[300px] flex flex-col items-center justify-center opacity-30 grayscale pointer-events-none">
                     <GhostIcon className="w-12 h-12 lg:w-16 lg:h-16 mb-6" />
                     <p className="font-black uppercase tracking-[0.3em] text-[9px] lg:text-[10px]">Awaiting Instructions</p>
                  </div>
                ) : (
                  <div className="max-w-3xl mx-auto space-y-12 lg:space-y-16 pb-20">
                    <div className="flex items-center justify-center gap-4 mb-4 lg:mb-8">
                       <div className="h-px bg-slate-200 flex-1"></div>
                       <span className="text-[9px] lg:text-[10px] font-black uppercase text-slate-400 tracking-widest bg-slate-50/50 px-4 whitespace-nowrap">Platform Mockups</span>
                       <div className="h-px bg-slate-200 flex-1"></div>
                    </div>
                    {state.variants.map((v, i) => <PostMockup key={i} variant={v} mediaUrl={state.mediaUrl} />)}
                  </div>
                )}
              </section>
            </div>
          ) : (
            <div className="h-full p-4 lg:p-8 overflow-y-auto custom-scrollbar">
              {state.history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-20">
                  <p className="font-black uppercase text-xs tracking-widest">Archive is empty</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                  {state.history.map((item) => (
                    <div key={item.id} className="bg-white p-5 lg:p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group relative">
                      <div className="absolute top-3 right-3 flex gap-2">
                        <button
                          onClick={() => handleRestore(item)}
                          title="Restore to editor"
                          className="w-8 h-8 bg-indigo-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                          <RestoreIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteHistoryItem(item.id)}
                          title="Delete permanently"
                          className="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                          <XIcon className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[9px] lg:text-[10px] font-black uppercase text-indigo-500 tracking-widest">{item.category}</span>
                        <span className="text-[9px] lg:text-[10px] text-slate-400 font-bold">{new Date(item.timestamp).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs lg:text-sm font-bold text-slate-800 line-clamp-3 mb-4 leading-relaxed">{item.baseDraft}</p>
                      <div className="flex gap-1.5">
                        {item.variants.map((v, idx) => (
                          <div key={idx} className={`w-5 h-5 rounded-md ${PLATFORMS_CONFIG.find(pc => pc.id === v.platform)?.color} flex items-center justify-center text-white scale-75 shadow-sm`}>
                             {PLATFORMS_CONFIG.find(pc => pc.id === v.platform)?.icon({ className: 'w-3 h-3' })}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

// --- High Fidelity Previews ---

const PostMockup: React.FC<{ variant: PostVariant, mediaUrl?: string }> = ({ variant, mediaUrl }) => {
  const config = PLATFORMS_CONFIG.find(c => c.id === variant.platform);
  const isCrowdfunding = [SocialPlatform.KOFI, SocialPlatform.PATREON, SocialPlatform.KICKSTARTER].includes(variant.platform);
  const isYouTube = variant.platform === SocialPlatform.YOUTUBE;

  const handleLaunchAndPaste = () => {
    const fullContent = `${variant.content}\n\n${variant.hashtags.map(h => `#${h}`).join(' ')}`.trim();
    navigator.clipboard.writeText(fullContent).then(() => {
      const url = getPublishUrl(variant.platform, variant.content, variant.hashtags);
      if (url) {
        window.open(url, '_blank');
      }
    }).catch(err => {
      console.error("Clipboard copy failed: ", err);
      const url = getPublishUrl(variant.platform, variant.content, variant.hashtags);
      if (url) {
        window.open(url, '_blank');
      }
    });
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col max-w-2xl mx-auto transition-all hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 group/card">
      {/* Fake UI Header */}
      <div className="px-4 lg:px-6 py-4 flex flex-col sm:flex-row items-center justify-between border-b border-slate-100 bg-slate-50/20 gap-3 sm:gap-0">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-xl ${config?.color} flex items-center justify-center text-white shadow-lg transition-transform group-hover/card:scale-110`}>
            {config?.icon({ className: 'w-4 h-4 lg:w-5 lg:h-5' })}
          </div>
          <div>
            <p className="text-xs lg:text-sm font-black text-slate-900 tracking-tight">{variant.platform}</p>
            <p className="text-[9px] lg:text-[10px] text-slate-400 font-bold uppercase tracking-widest">Platform Overlay</p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => {
              const fullContent = `${variant.content}\n\n${variant.hashtags.map(h => `#${h}`).join(' ')}`.trim();
              navigator.clipboard.writeText(fullContent);
            }}
            className="flex-1 sm:flex-none px-3 py-1.5 text-[9px] lg:text-[10px] font-black text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all uppercase tracking-wider"
          >
            Copy
          </button>
          <button
            onClick={handleLaunchAndPaste}
            className={`flex-1 sm:flex-none px-4 py-1.5 text-[9px] lg:text-[10px] font-black text-white ${config?.color} rounded-xl shadow-lg transition-all hover:brightness-110 flex items-center justify-center gap-2 uppercase tracking-wider`}
          >
            <ExternalLinkIcon className="w-3 h-3" />
            Launch
          </button>
        </div>
      </div>

      <div className="p-4 lg:p-8">
        <div className="flex gap-3 lg:gap-4">
          <div className="w-10 h-10 lg:w-14 lg:h-14 bg-slate-100 rounded-2xl flex-shrink-0 border border-slate-200 overflow-hidden shadow-inner group-hover/card:border-indigo-100 transition-colors">
             <span className="flex h-full items-center justify-center text-xl font-bold text-slate-400" aria-label="Avatar">{variant.platform.charAt(0)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm lg:text-base font-black text-slate-900 tracking-tight truncate">Official Channel</span>
              {isYouTube && <span className="bg-red-500 text-[8px] lg:text-[9px] px-1.5 lg:py-0.5 rounded-full font-black text-white uppercase tracking-tighter shadow-sm">Verified</span>}
            </div>

            <div className="mt-3 lg:mt-4 text-[14px] lg:text-[16px] text-slate-800 whitespace-pre-wrap leading-relaxed font-normal">
              {variant.content}
            </div>

            {variant.hashtags.length > 0 && (
              <div className="mt-4 lg:mt-5 flex flex-wrap gap-x-3 gap-y-1">
                {variant.hashtags.map((h, i) => (
                  <span key={i} className="text-xs lg:text-sm font-black text-indigo-500 cursor-pointer hover:underline">#{h}</span>
                ))}
              </div>
            )}

            {mediaUrl && (
              <div className="mt-5 lg:mt-6 rounded-2xl lg:rounded-3xl overflow-hidden border border-slate-100 bg-slate-50 shadow-inner group-hover/card:border-indigo-50 transition-colors">
                <img src={mediaUrl} className="w-full max-h-[400px] lg:max-h-[500px] object-cover" alt="Post content" />
              </div>
            )}

            {isCrowdfunding && (
              <div className="mt-8 lg:mt-10 p-5 lg:p-8 bg-slate-50/50 rounded-2xl lg:rounded-3xl border-2 border-dashed border-slate-200 space-y-4 lg:space-y-5">
                 <div className="flex justify-between items-end">
                    <div className="space-y-0.5 lg:space-y-1">
                      <p className="text-[9px] lg:text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Crowdfunding Goal</p>
                      <p className="text-xl lg:text-2xl font-black text-slate-900 tracking-tighter">$2,420 <span className="text-xs lg:text-sm text-slate-400 font-bold uppercase tracking-widest">Raised</span></p>
                    </div>
                    <p className="text-[9px] lg:text-xs font-black text-indigo-600 bg-indigo-50 px-2 lg:px-3 py-1 rounded-full border border-indigo-100">82% Supported</p>
                 </div>
                 <div className="h-3 lg:h-4 w-full bg-slate-200/50 rounded-full overflow-hidden shadow-inner border border-slate-300/10">
                    <div className={`h-full ${config?.color} w-[82%] transition-all duration-1000 ease-out shadow-lg`} />
                 </div>
                 <button className={`w-full py-3 lg:py-4 rounded-xl lg:rounded-2xl font-black text-xs lg:text-sm text-white transition-all hover:scale-[1.01] active:scale-[0.98] shadow-2xl ${config?.color} uppercase tracking-[0.2em]`}>
                   Back this Project
                 </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fake Interactions */}
      <div className="px-6 lg:px-8 py-4 lg:py-5 bg-slate-50/40 border-t border-slate-100 flex items-center justify-around sm:justify-start sm:gap-10 opacity-40 grayscale select-none group-hover/card:opacity-100 group-hover/card:grayscale-0 transition-all duration-500">
         <div className="flex items-center gap-2 lg:gap-2.5 text-[10px] lg:text-xs font-black text-slate-600 cursor-pointer hover:text-red-500 transition-colors"><HeartIcon className="w-4 lg:w-4.5 h-4 lg:h-4.5" /> 1.2k</div>
         <div className="flex items-center gap-2 lg:gap-2.5 text-[10px] lg:text-xs font-black text-slate-600 cursor-pointer hover:text-indigo-500 transition-colors"><CommentIcon className="w-4 lg:w-4.5 h-4 lg:h-4.5" /> 42</div>
         <div className="flex items-center gap-2 lg:gap-2.5 text-[10px] lg:text-xs font-black text-slate-600 cursor-pointer hover:text-green-500 transition-colors"><ShareIcon className="w-4 lg:w-4.5 h-4 lg:h-4.5" /> Share</div>
      </div>
    </div>
  );
};

// --- Icons ---
const LoadingSpinner = ({ className }: { className: string }) => (
  <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
);
const SparklesIcon = (props: any) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" /></svg>;
const XIcon = (props: any) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>;
const RestoreIcon = (props: any) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>;
const GhostIcon = (props: any) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const HeartIcon = (props: any) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>;
const CommentIcon = (props: any) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;
const ShareIcon = (props: any) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>;
const UploadIcon = (props: any) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>;
const ExternalLinkIcon = (props: any) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>;
const InfoIcon = (props: any) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const SendIcon = (props: any) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);
const ChevronDownIcon = (props: any) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
  </svg>
);

export default App;
