
import React from 'react';
import { StylePreset } from '../types';

interface StyleGridProps {
  styles: StylePreset[];
  selectedId: string | null;
  onSelect: (style: StylePreset) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onShareStyle: (style: StylePreset) => void;
  onDeleteStyle: (id: string) => void;
  showOnlyFavorites: boolean;
}

const StyleGrid: React.FC<StyleGridProps> = ({ 
  styles,
  selectedId, 
  onSelect, 
  favorites, 
  onToggleFavorite, 
  onShareStyle,
  onDeleteStyle,
  showOnlyFavorites 
}) => {
  const filteredStyles = showOnlyFavorites 
    ? styles.filter(s => favorites.includes(s.id))
    : styles;

  if (showOnlyFavorites && filteredStyles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border border-dashed border-white/5 rounded-2xl">
        <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </div>
        <p className="text-zinc-500 text-xs font-medium">No favorites</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {filteredStyles.map((style) => {
        const isFav = favorites.includes(style.id);
        const isSelected = selectedId === style.id;
        
        return (
          <div key={style.id} className="relative group">
            <button
              onClick={() => onSelect(style)}
              className={`
                w-full h-full relative p-3 pt-8 rounded-xl text-left transition-all duration-300
                ${isSelected 
                  ? 'bg-white text-black ring-2 ring-white/20 shadow-lg' 
                  : 'bg-zinc-900/50 text-white border border-white/5 hover:border-white/10'
                }
              `}
            >
              <div className="text-2xl mb-2 flex justify-between items-start">
                <span>{style.icon}</span>
                {style.isCustom && (
                  <span className="text-[7px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-white/5">
                    User
                  </span>
                )}
              </div>
              <h3 className="font-bold text-[11px] mb-0.5 leading-none line-clamp-1">{style.name}</h3>
              <p className={`text-[9px] leading-tight line-clamp-2 ${isSelected ? 'text-black/60' : 'text-white/40'}`}>
                {style.description}
              </p>
            </button>
            
            <div className="absolute top-2 left-2 flex gap-1 z-10">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(style.id);
                }}
                className={`
                  p-1.5 rounded-full transition-all backdrop-blur-md
                  ${isFav 
                    ? 'bg-red-500 text-white shadow-lg' 
                    : 'bg-black/30 text-white/40 hover:text-white/70'
                  }
                `}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-2.5 w-2.5 ${isFav ? 'fill-current' : 'fill-none'}`} 
                  viewBox="0 0 24 24" 
                  stroke="currentColor" 
                  strokeWidth="2.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onShareStyle(style);
                }}
                className="p-1.5 rounded-full bg-black/30 text-white/40 hover:text-white/70 backdrop-blur-md transition-all"
                title="Share Style"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </button>

              {style.isCustom && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if(confirm("Delete this custom style?")) {
                      onDeleteStyle(style.id);
                    }
                  }}
                  className="p-1.5 rounded-full bg-black/30 text-red-400 hover:text-red-300 backdrop-blur-md transition-all"
                  title="Delete Style"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StyleGrid;
