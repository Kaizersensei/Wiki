
import React from 'react';

interface BookCoverProps {
  title: string;
  author: string;
  onClick: () => void;
}

export const BookCover: React.FC<BookCoverProps> = ({ title, author, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="relative w-full h-[500px] cursor-pointer group perspective-1000"
    >
      <div className="absolute inset-0 bg-[#3d2b1f] rounded-r-lg shadow-2xl transition-transform duration-500 group-hover:scale-[1.02] border-l-[12px] border-[#2d1e15]">
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/leather.png')] pointer-events-none"></div>
        
        <div className="flex flex-col items-center justify-center h-full p-8 text-center border-2 border-[#b8860b]/30 m-4 rounded-sm">
          <div className="w-16 h-1 bg-[#b8860b] mb-8"></div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-[#f5deb3] mb-4 leading-tight">
            {title}
          </h1>
          <p className="text-lg font-serif-book italic text-[#b8860b]">
            By {author}
          </p>
          <div className="mt-auto">
            <div className="w-16 h-1 bg-[#b8860b] mt-8 mx-auto"></div>
            <p className="mt-4 text-[#b8860b]/60 uppercase tracking-widest text-xs">
              Digital Library Collection
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
