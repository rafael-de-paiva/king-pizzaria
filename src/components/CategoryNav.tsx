import React from 'react';
import { useStore } from '../context/StoreContext';
import { Search } from 'lucide-react';

interface CategoryNavProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const CategoryNav: React.FC<CategoryNavProps> = ({ searchQuery, setSearchQuery }) => {
  const { categories, activeCategory, setActiveCategory } = useStore();

  return (
    <div id="cardapio-section" className="bg-[#0e0f17] border-y border-amber-500/20 sticky top-20 z-30 py-3 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          
          {/* Scrollable Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id && !searchQuery;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setActiveCategory(cat.id);
                    setSearchQuery('');
                  }}
                  aria-pressed={isActive}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 border ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black border-amber-400 shadow-md shadow-amber-500/20'
                      : 'bg-[#151722] text-gray-300 hover:text-white hover:bg-[#1e202f] border-gray-800'
                  }`}
                >
                  <span className="text-base">{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar sabor, produto, bebida..."
              className="w-full pl-9 pr-4 py-2 bg-[#151722] border border-gray-800 focus:border-amber-500/60 rounded-xl text-xs sm:text-sm text-white placeholder-gray-500 outline-none transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white px-1.5 py-0.5 rounded bg-gray-800"
              >
                ✕
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
