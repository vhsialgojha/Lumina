
import React from 'react';

interface IntensitySliderProps {
  value: number;
  onChange: (value: number) => void;
}

const IntensitySlider: React.FC<IntensitySliderProps> = ({ value, onChange }) => {
  return (
    <div className="w-full px-4 py-6 bg-zinc-900/60 backdrop-blur-md border border-white/10 rounded-[2rem] shadow-2xl space-y-4">
      <div className="flex justify-between items-center px-1">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-zinc-600"></div>
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-zinc-500">Original</span>
        </div>
        
        <div className="flex flex-col items-center">
          <span className="text-[14px] font-bold text-white tracking-tighter">{value}%</span>
          <span className="text-[7px] font-bold uppercase tracking-widest text-zinc-600">Intensity</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/80">Transformed</span>
          <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]"></div>
        </div>
      </div>

      <div className="relative h-6 flex items-center group">
        {/* Track Background */}
        <div className="absolute inset-x-0 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-zinc-700 to-white transition-all duration-300 ease-out"
            style={{ width: `${value}%` }}
          />
        </div>
        
        {/* Native Range Input (Hidden visual, functional layer) */}
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={value} 
          onChange={(e) => onChange(parseInt(e.target.value))} 
          className="absolute inset-x-0 w-full h-full opacity-0 cursor-pointer z-10"
        />

        {/* Custom Thumb */}
        <div 
          className="absolute w-6 h-6 bg-white rounded-full shadow-xl border-4 border-zinc-900 flex items-center justify-center transition-all duration-75 pointer-events-none group-active:scale-125 group-active:shadow-[0_0_20px_rgba(255,255,255,0.4)]"
          style={{ left: `calc(${value}% - 12px)` }}
        >
          <div className="w-0.5 h-2 bg-zinc-400 rounded-full"></div>
        </div>
      </div>
      
      <p className="text-center text-[8px] text-zinc-500 uppercase tracking-widest font-medium opacity-50">
        Slide to blend with original photo
      </p>
    </div>
  );
};

export default IntensitySlider;
