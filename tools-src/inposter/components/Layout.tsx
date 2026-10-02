
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  onViewChange: (view: 'planner' | 'history') => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, onViewChange }) => {
  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-[#f8fafc] text-slate-900 overflow-hidden font-sans">
      {/* Desktop Sidebar / Mobile Bottom Nav */}
      <aside className="fixed bottom-0 left-0 right-0 z-50 lg:relative lg:bottom-auto lg:left-auto lg:right-auto lg:w-20 lg:hover:w-64 bg-white/80 backdrop-blur-xl lg:bg-white border-t lg:border-t-0 lg:border-r border-slate-200 flex flex-row lg:flex-col items-center lg:items-start p-2 lg:p-4 transition-all duration-300">
        <div className="hidden lg:flex items-center gap-3 mb-12 px-2 py-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="hidden lg:group-hover:block whitespace-nowrap overflow-hidden">
            <h1 className="font-black text-xl tracking-tighter text-slate-900 leading-none">INPOSTER</h1>
            <p className="text-[10px] font-bold text-indigo-500 tracking-widest uppercase">Post Composer</p>
          </div>
        </div>

        <nav className="flex lg:flex-col flex-1 w-full justify-around lg:justify-start gap-2 lg:space-y-1">
          <NavItem
            active={currentView === 'planner'}
            onClick={() => onViewChange('planner')}
            icon={<ComposeIcon className="w-6 h-6 lg:w-5 lg:h-5" />}
            label="Compose"
          />
          <NavItem
            active={currentView === 'history'}
            onClick={() => onViewChange('history')}
            icon={<HistoryIcon className="w-6 h-6 lg:w-5 lg:h-5" />}
            label="Archive"
          />
        </nav>

        <div className="hidden lg:flex mt-auto w-full pt-6 border-t border-slate-100 flex-col items-center lg:items-start group-hover:px-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 opacity-0 group-hover:opacity-100">V2.0 PRO</p>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden flex flex-col pb-20 lg:pb-0">
        {children}
      </main>
    </div>
  );
};

const NavItem = ({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`flex-1 lg:flex-none flex flex-col lg:flex-row items-center gap-1 lg:gap-4 px-3 py-2 lg:px-4 lg:py-3.5 rounded-2xl transition-all duration-200 group ${active ? 'bg-indigo-600 lg:bg-indigo-600 text-white shadow-lg lg:shadow-indigo-200' : 'text-slate-500 hover:bg-slate-50 lg:hover:bg-slate-50 hover:text-slate-900'}`}
  >
    <div className={`${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-900'}`}>{icon}</div>
    <span className="text-[10px] lg:text-sm font-bold lg:hidden group-hover:lg:block whitespace-nowrap">{label}</span>
  </button>
);

const ComposeIcon = (props: any) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>;
const HistoryIcon = (props: any) => <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>;

export default Layout;
