import React from 'react';

interface SuccessPopupProps {
  cropName: string;
}

export default function SuccessPopup({ cropName }: SuccessPopupProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-[2rem] p-8 shadow-2xl flex flex-col items-center max-w-sm w-[90%] text-center animate-in zoom-in-95 duration-300 border border-emerald-100">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-extrabold text-slate-800 mb-2">Successfully Added!</h3>
        <p className="text-slate-600 text-sm font-medium mb-8 leading-relaxed">
          <strong className="text-emerald-700 text-base">{cropName}</strong> has been added to your profile.
        </p>
        <div className="flex items-center gap-2 text-xs text-slate-500 font-bold uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
          <svg className="animate-spin h-3.5 w-3.5 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Redirecting to Dashboard...
        </div>
      </div>
    </div>
  );
}