'use client';

export default function AnalysisLoader() {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm px-4 animate-in fade-in duration-300">
      
      {/* 
        Custom CSS Animation for the smooth wave effect.
        මෙමගින් බින්දු එකින් එක උඩට සහ පහළට යන Smooth Wave එක නිර්මාණය කරයි.
      */}
      <style>{`
        @keyframes wave-bounce {
          0%, 100% {
            transform: translateY(5px);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-12px);
            opacity: 1;
          }
        }
        .wave-dot {
          animation: wave-bounce 1.2s infinite ease-in-out;
        }
      `}</style>
      
      <div className="flex flex-col items-center justify-center p-8 space-y-6 rounded-3xl border border-emerald-100 bg-[radial-gradient(circle_at_center,_#f0fdf4,_#ffffff)] shadow-2xl max-w-sm w-full transform transition-all scale-100 animate-in zoom-in duration-300">
        
        {/* 10 Dots Wave Animation Container */}
        <div className="flex items-center justify-center gap-2 h-16 mt-2">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="wave-dot w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-sm"
              style={{ animationDelay: `${i * 0.1}s` }} // එක් එක් බින්දුවට වෙනස් Delay එකක් ලබා දී ඇත
            ></div>
          ))}
        </div>

        <div className="text-center">
          <h3 className="text-lg font-bold text-stone-800">Analyzing Data...</h3>
          <p className="text-xs text-stone-500 mt-1">Evaluating field history & predicting soil fertility</p>
        </div>
        
      </div>
    </div>
  );
}