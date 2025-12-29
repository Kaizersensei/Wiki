
import React from 'react';
import { BookPage } from '../types';

interface ReaderPageProps {
  page: BookPage;
  isLeft?: boolean;
}

export const ReaderPage: React.FC<ReaderPageProps> = ({ page, isLeft = false }) => {
  const spineShadow = isLeft 
    ? "bg-gradient-to-r from-transparent to-black/10" 
    : "bg-gradient-to-l from-transparent to-black/10";

  return (
    <div className={`relative w-full h-full bg-[#fdfaf1] shadow-sm flex flex-col ${isLeft ? 'rounded-l-sm' : 'rounded-r-sm'}`}>
      {/* Paper Texture Overlay (Fixed) */}
      <div className="absolute inset-0 opacity-40 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')] pointer-events-none z-0"></div>
      
      {/* Spine Gradient (Fixed) */}
      <div className={`absolute top-0 ${isLeft ? 'right-0' : 'left-0'} w-12 h-full ${spineShadow} pointer-events-none z-20`}></div>

      {/* Content Container (Scrollable) */}
      <div className="relative z-10 flex-1 overflow-y-auto px-8 py-10 md:px-12 md:py-12 custom-scrollbar group">
        <h2 className="text-xl font-display font-semibold text-[#2c1810] mb-6 border-b border-[#2c1810]/10 pb-2 sticky top-0 bg-[#fdfaf1]/90 backdrop-blur-sm pt-2 -mt-2">
          {page.title}
        </h2>
        
        <div className="font-serif-book text-[#3a2e2a] text-lg leading-relaxed space-y-4 whitespace-pre-wrap">
          {/* We use whitespace-pre-wrap to respect the AI's formatting of lists */}
          {page.content}
        </div>

        {/* Bottom fade effect to indicate more content */}
        <div className="sticky bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#fdfaf1] to-transparent pointer-events-none"></div>
      </div>

      {/* Page Number (Fixed at bottom) */}
      <div className={`relative z-20 px-8 pb-4 text-[#2c1810]/40 font-serif-book text-sm ${isLeft ? 'text-left' : 'text-right'}`}>
        Page {page.pageNumber}
      </div>

      {/* Realistic corner curl visual */}
      {!isLeft && <div className="page-curl z-30"></div>}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(44, 24, 16, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background: rgba(44, 24, 16, 0.2);
        }
      `}</style>
    </div>
  );
};
