import { useState } from 'react';

interface TimePickerProps {
  value: string; // Expected format: "10:00 AM"
  onChange: (timeString: string) => void;
  onClose: () => void;
}

export function AndroidTimePicker({ value, onChange, onClose }: TimePickerProps) {
  // Parse the incoming value string (e.g., "09:30 AM") to initialize state accurately
  const parseInitialTime = (timeStr?: string) => {
    if (!timeStr) return { h: 10, m: 0, p: 'AM' as const };
    try {
      const parts = timeStr.trim().split(' ');
      const timePart = parts[0] || '10:00';
      const periodPart = parts[1]?.toUpperCase() === 'PM' ? 'PM' : 'AM';
      const [hStr, mStr] = timePart.split(':');
      const h = parseInt(hStr, 10) || 10;
      const m = parseInt(mStr, 10) || 0;
      return { h, m, p: periodPart as 'AM' | 'PM' };
    } catch {
      return { h: 10, m: 0, p: 'AM' as const };
    }
  };

  const initial = parseInitialTime(value);
  const [step, setStep] = useState<'hour' | 'minute' | 'ampm'>('hour');
  const [hour, setHour] = useState<number>(initial.h);
  const [minute, setMinute] = useState<number>(initial.m);
  const [ampm, setAmPm] = useState<'AM' | 'PM'>(initial.p);

  const hours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]; // 5-min increments for cleaner circle layout

  const handleHourClick = (h: number) => {
    setHour(h);
    setStep('minute'); // Automatically transition to minute view like Android
  };

  const handleMinuteClick = (m: number) => {
    setMinute(m);
    setStep('ampm'); // Automatically transition to AM/PM view
  };

  const handleAmPmClick = (val: 'AM' | 'PM') => {
    setAmPm(val);
    // Finalize formatting and save
    const formattedMinute = minute.toString().padStart(2, '0');
    onChange(`${hour}:${formattedMinute} ${val}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-80 rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-slate-100 flex flex-col items-center">
        
        {/* Header Display (Like Android: 10 : 00 AM) */}
        <div className="mb-6 flex items-baseline gap-2 text-3xl font-light">
          <button 
            type="button"
            onClick={() => setStep('hour')}
            className={`px-2 rounded ${step === 'hour' ? 'bg-blue-600/30 text-blue-400 font-normal' : 'text-slate-400'}`}
          >
            {hour}
          </button>
          <span>:</span>
          <button 
            type="button"
            onClick={() => setStep('minute')}
            className={`px-2 rounded ${step === 'minute' ? 'bg-blue-600/30 text-blue-400 font-normal' : 'text-slate-400'}`}
          >
            {minute.toString().padStart(2, '0')}
          </button>
          <div className="flex flex-col text-xs font-semibold text-slate-400 ml-2">
            <button 
              type="button"
              onClick={() => setAmPm('AM')} 
              className={`${ampm === 'AM' ? 'text-blue-400 font-bold' : ''}`}
            >
              AM
            </button>
            <button 
              type="button"
              onClick={() => setAmPm('PM')} 
              className={`${ampm === 'PM' ? 'text-blue-400 font-bold' : ''}`}
            >
              PM
            </button>
          </div>
        </div>

        {/* Clock Face Container */}
        <div className="relative h-64 w-64 rounded-full bg-slate-800/60 flex items-center justify-center border border-slate-700/50">
          
          {/* STEP 1: HOUR CIRCLE */}
          {step === 'hour' && (
            <div className="absolute inset-0">
              {hours.map((h, index) => {
                const angle = (index * 30 - 90) * (Math.PI / 180);
                const radius = 88; 
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;

                return (
                  <button
                    key={h}
                    type="button"
                    onClick={() => handleHourClick(h)}
                    style={{ transform: `translate(${x}px, ${y}px)` }}
                    className={`absolute top-1/2 left-1/2 -ml-5 -mt-5 flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition ${
                      hour === h ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    {h}
                  </button>
                );
              })}
            </div>
          )}

          {/* STEP 2: MINUTE CIRCLE */}
          {step === 'minute' && (
            <div className="absolute inset-0">
              {minutes.map((m, index) => {
                const angle = (index * 30 - 90) * (Math.PI / 180);
                const radius = 88;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;

                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleMinuteClick(m)}
                    style={{ transform: `translate(${x}px, ${y}px)` }}
                    className={`absolute top-1/2 left-1/2 -ml-5 -mt-5 flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition ${
                      minute === m ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    {m.toString().padStart(2, '0')}
                  </button>
                );
              })}
            </div>
          )}

          {/* STEP 3: AM / PM SELECTION VIEW */}
          {step === 'ampm' && (
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => handleAmPmClick('AM')}
                className={`h-20 w-20 rounded-full font-semibold transition ${
                  ampm === 'AM' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                AM
              </button>
              <button
                type="button"
                onClick={() => handleAmPmClick('PM')}
                className={`h-20 w-20 rounded-full font-semibold transition ${
                  ampm === 'PM' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                PM
              </button>
            </div>
          )}

          {/* Center clock pin dot */}
          <div className="h-2 w-2 rounded-full bg-blue-500 pointer-events-none" />
        </div>

        {/* Footer actions */}
        <div className="mt-6 flex w-full justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}