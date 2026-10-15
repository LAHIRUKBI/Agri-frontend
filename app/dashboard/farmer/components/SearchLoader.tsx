'use client';

import { useEffect, useRef, useState } from 'react';
import { SRI_LANKA_DISTRICT_REGIONS, SRI_LANKA_MAP_VIEW_BOX } from './SriLankaMap';

interface AnalysisLoaderProps {
  district: string;
}

export default function AnalysisLoader({ district }: AnalysisLoaderProps) {
  const selectedRegion = SRI_LANKA_DISTRICT_REGIONS.find(r => r.label === district);
  
  // State to hold dynamically calculated transform values
  const [transformStyles, setTransformStyles] = useState({ scale: 1, translateX: 0, translateY: 0 });
  const pathRef = useRef<SVGPathElement>(null);

  // Auto-calculate scale and translate to perfectly fit ANY district shape within the box
  useEffect(() => {
    if (pathRef.current) {
      const bbox = pathRef.current.getBBox();
      
      // The container viewbox is 100x100
      const containerSize = 100;
      
      // Calculate scale to fit the shape perfectly (leaving a small 10% padding)
      const maxDim = Math.max(bbox.width, bbox.height);
      const scale = (containerSize * 0.8) / maxDim;
      
      // Calculate translation to center the shape
      const centerX = bbox.x + bbox.width / 2;
      const centerY = bbox.y + bbox.height / 2;
      const translateX = (containerSize / 2) - (centerX * scale);
      const translateY = (containerSize / 2) - (centerY * scale);

      setTransformStyles({ scale, translateX, translateY });
    }
  }, [selectedRegion]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4 animate-in fade-in duration-300">
      
      <style>{`
        @keyframes glowing-trace {
          from { stroke-dashoffset: 100; }
          to { stroke-dashoffset: -100; }
        }
        .animate-trace {
          stroke-dasharray: 100;
          stroke-dashoffset: 100;
          animation: glowing-trace 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          filter: drop-shadow(0 0 6px rgba(16, 185, 129, 0.6));
        }
      `}</style>
      
      {/* Modern, Compact, Professional Glassmorphism UI */}
      <div className="flex flex-col items-center justify-center p-6 space-y-4 rounded-[1.5rem] border border-white/10 bg-slate-800/90 backdrop-blur-md shadow-2xl max-w-[280px] w-full transform transition-all scale-100 animate-in zoom-in-95 duration-300">
        
        <div className="w-24 h-24 flex items-center justify-center relative">
          <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-2xl animate-pulse"></div>
          
          {selectedRegion ? (
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 100 100" // Fixed localized viewbox for the container
              className="w-full h-full drop-shadow-lg"
            >
              <g transform={`translate(${transformStyles.translateX}, ${transformStyles.translateY}) scale(${transformStyles.scale})`}>
                
                {/* Invisible path purely for BBox calculation */}
                <path
                  ref={pathRef}
                  d={selectedRegion.path}
                  fill="none"
                  stroke="none"
                />

                {/* Base filled shape */}
                <path
                  d={selectedRegion.path}
                  className="fill-emerald-900/80 stroke-emerald-700/50"
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                />
                
                {/* Animated glowing border */}
                <path
                  d={selectedRegion.path}
                  className="fill-transparent stroke-emerald-400 animate-trace"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  pathLength="100"
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            </svg>
          ) : (
            <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          )}
        </div>

        <div className="text-center space-y-1.5 w-full">
          <h3 className="text-base font-bold text-slate-100 tracking-tight">Analyzing</h3>
          <p className="text-xs text-slate-400 font-medium leading-relaxed">
             <span className="text-emerald-400 font-bold uppercase tracking-wider">{district || "your"}</span>
          </p>
        </div>
        
      </div>
    </div>
  );
}