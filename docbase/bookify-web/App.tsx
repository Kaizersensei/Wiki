
import React, { useState, useEffect } from 'react';
import { Book, AppState } from './types';
import { fetchUrlContent } from './services/fetcher';
import { processWebContent } from './services/geminiService';
import { BookCover } from './components/BookCover';
import { BookContainer } from './components/BookContainer';
import { Loader2, BookOpen, AlertCircle, RefreshCw, Book as BookIcon } from 'lucide-react';

// Default to the Densetsu landing page (served locally)
const DEFAULT_URL = 'http://localhost:3000/pages/retraissance/densetsu/index.html';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppState>(AppState.IDLE);
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeUrl, setActiveUrl] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const targetUrl = params.get('url') || DEFAULT_URL;
    setActiveUrl(targetUrl);
    triggerBookify(targetUrl);
  }, []);

  const triggerBookify = async (targetUrl: string) => {
    if (!targetUrl || !targetUrl.startsWith('http')) {
      setError('Invalid URL provided.');
      setStatus(AppState.ERROR);
      return;
    }

    try {
      setStatus(AppState.FETCHING);
      setError(null);
      
      const html = await fetchUrlContent(targetUrl);
      
      setStatus(AppState.PROCESSING);
      const processed = await processWebContent(html, targetUrl);
      
      const newBook: Book = {
        id: Math.random().toString(36).substr(2, 9),
        url: targetUrl,
        ...processed
      };

      setCurrentBook(newBook);
      setStatus(AppState.READING);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to bookify content. Ensure the source allows cross-origin requests.");
      setStatus(AppState.ERROR);
    }
  };

  const handleRetry = () => {
    triggerBookify(activeUrl);
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white flex flex-col items-center">
      {/* Minimal Header */}
      <header className="w-full max-w-7xl px-6 py-6 flex justify-between items-center opacity-40 hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-2">
          <div className="bg-[#b8860b] p-1.5 rounded-md">
            <BookOpen className="text-black" size={18} />
          </div>
          <h1 className="text-xl font-display font-bold tracking-tight text-[#f5deb3]">
            BOOKIFY<span className="text-[#b8860b]">WEB</span>
          </h1>
        </div>
        {activeUrl !== DEFAULT_URL && (
           <span className="text-[10px] uppercase tracking-widest text-[#b8860b]/60 font-serif-book">
             Viewing: {new URL(activeUrl).hostname}
           </span>
        )}
      </header>

      {/* Primary Display Area */}
      <main className="flex-1 w-full flex flex-col items-center justify-center">
        
        {/* Loading States */}
        {(status === AppState.FETCHING || status === AppState.PROCESSING) && (
          <div className="flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-500">
            <div className="relative">
              <div className="absolute inset-0 bg-[#b8860b] blur-3xl opacity-10 animate-pulse"></div>
              <Loader2 className="animate-spin text-[#b8860b]/60 relative z-10" size={64} />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-display font-bold text-[#f5deb3] tracking-wide uppercase">
                {status === AppState.FETCHING ? "Consulting Archivist..." : "Illuminating Manuscript..."}
              </h3>
              <p className="text-white/30 text-sm italic font-serif-book">
                Please wait while we prepare your reading experience.
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {status === AppState.ERROR && (
          <div className="max-w-md w-full bg-red-950/20 border border-red-500/20 p-8 rounded-2xl text-center space-y-6 animate-in zoom-in-95">
            <AlertCircle className="text-red-500 mx-auto" size={48} />
            <div className="space-y-2">
              <h3 className="text-xl font-display font-bold text-red-200">Transcription Failed</h3>
              <p className="text-red-200/60 text-sm font-serif-book leading-relaxed">
                {error}
              </p>
            </div>
            <button 
              onClick={handleRetry}
              className="w-full bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl flex items-center justify-center gap-2 transition-all border border-white/10"
            >
              <RefreshCw size={18} />
              Attempt Reconnect
            </button>
          </div>
        )}

        {/* Ready to Read State (Initial Cover View) */}
        {status === AppState.READING && currentBook && (
          <div className="animate-in fade-in zoom-in-95 duration-700 flex flex-col items-center px-6">
            <div className="w-full max-w-sm">
              <BookCover 
                title={currentBook.title}
                author={currentBook.author}
                onClick={() => setStatus(AppState.READING)}
              />
              <div className="mt-12 text-center">
                <button 
                  onClick={() => setStatus(AppState.READING)}
                  className="group bg-[#b8860b] hover:bg-[#cd9a1b] text-black px-10 py-4 rounded-full font-bold transition-all flex items-center gap-3 mx-auto shadow-2xl shadow-[#b8860b]/20"
                >
                  <BookIcon size={20} className="group-hover:scale-110 transition-transform" />
                  Open Manuscript
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Fullscreen Interactive Book Component */}
      {status === AppState.READING && currentBook && (
        <BookContainer 
          book={currentBook} 
          onClose={() => setStatus(AppState.READING)} 
        />
      )}

      {/* Subtle Footer */}
      <footer className="w-full py-8 opacity-20 hover:opacity-100 transition-opacity">
        <p className="text-white/40 text-[10px] text-center font-serif-book uppercase tracking-[0.3em]">
          Engineered for Deep Reading & Archive Exploration
        </p>
      </footer>

      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
      `}</style>
    </div>
  );
};

export default App;
