
import React, { useState } from 'react';
import { Book, BookPage } from '../types';
import { ReaderPage } from './ReaderPage';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface BookContainerProps {
  book: Book;
  onClose: () => void;
}

export const BookContainer: React.FC<BookContainerProps> = ({ book, onClose }) => {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  // We show 2 pages at a time on large screens, 1 on small
  const totalPairs = Math.ceil(book.pages.length / 2);
  
  const handleNext = () => {
    if (currentPageIndex < totalPairs - 1) {
      setCurrentPageIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(prev => prev - 1);
    }
  };

  const leftPageIdx = currentPageIndex * 2;
  const rightPageIdx = leftPageIdx + 1;

  const leftPage = book.pages[leftPageIdx];
  const rightPage = book.pages[rightPageIdx];

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 md:p-8 backdrop-blur-sm">
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 text-white/60 hover:text-white transition-colors"
      >
        <X size={32} />
      </button>

      <div className="relative w-full max-w-6xl h-full max-h-[85vh] flex items-center">
        {/* Navigation - Left */}
        <button 
          onClick={handlePrev}
          disabled={currentPageIndex === 0}
          className={`absolute -left-16 hidden lg:flex text-white/30 hover:text-white transition-all transform hover:-translate-x-1 ${currentPageIndex === 0 ? 'opacity-0' : 'opacity-100'}`}
        >
          <ChevronLeft size={64} />
        </button>

        {/* The Book */}
        <div className="flex-1 h-full flex flex-col md:flex-row shadow-2xl rounded-lg overflow-hidden ring-1 ring-white/10">
          
          {/* Left Page (hidden on very small screens, maybe?) */}
          <div className="hidden md:flex flex-1 h-full bg-[#fdfaf1] transition-all duration-500 ease-in-out transform">
             {leftPage ? (
               <ReaderPage page={leftPage} isLeft={true} />
             ) : (
               <div className="w-full h-full bg-[#fdfaf1] opacity-50 flex items-center justify-center">
                 <span className="font-serif-book text-stone-400 italic">End of Content</span>
               </div>
             )}
          </div>

          {/* Right Page */}
          <div className="flex-1 h-full bg-[#fdfaf1] transition-all duration-500 ease-in-out transform">
             {rightPage ? (
               <ReaderPage page={rightPage} isLeft={false} />
             ) : (
                currentPageIndex === 0 && !leftPage ? (
                   <div className="w-full h-full flex items-center justify-center p-12 text-center bg-[#fdfaf1]">
                      <p className="text-stone-500 italic">No content available.</p>
                   </div>
                ) : (
                  <div className="w-full h-full bg-[#fdfaf1] opacity-50 flex items-center justify-center">
                    <span className="font-serif-book text-stone-400 italic">End of Content</span>
                  </div>
                )
             )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="absolute bottom-[-60px] left-0 right-0 flex justify-between md:hidden">
          <button onClick={handlePrev} className="text-white p-2 bg-white/10 rounded-full"><ChevronLeft /></button>
          <span className="text-white font-serif-book">{currentPageIndex + 1} / {totalPairs}</span>
          <button onClick={handleNext} className="text-white p-2 bg-white/10 rounded-full"><ChevronRight /></button>
        </div>

        {/* Navigation - Right */}
        <button 
          onClick={handleNext}
          disabled={currentPageIndex >= totalPairs - 1}
          className={`absolute -right-16 hidden lg:flex text-white/30 hover:text-white transition-all transform hover:translate-x-1 ${currentPageIndex >= totalPairs - 1 ? 'opacity-0' : 'opacity-100'}`}
        >
          <ChevronRight size={64} />
        </button>
      </div>

      {/* Click-to-flip zones on desktop overlay */}
      <div className="absolute inset-0 pointer-events-none flex">
        <div 
          onClick={handlePrev}
          className="w-1/4 h-full cursor-w-resize pointer-events-auto"
        ></div>
        <div className="flex-1 pointer-events-none"></div>
        <div 
          onClick={handleNext}
          className="w-1/4 h-full cursor-e-resize pointer-events-auto"
        ></div>
      </div>
    </div>
  );
};
