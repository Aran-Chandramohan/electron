import { useState } from 'react';

interface TimePickerProps {
  value: string; // 24-hour "HH:MM", matching what EventForm's time inputs store (e.g. "09:30", "15:00")
  onChange: (timeString: string) => void;
  onClose: () => void;
}

export function AndroidTimePicker({ value, onChange, onClose }: TimePickerProps) {
  // Parse the incoming 24-hour "HH:MM" value into the 12-hour hour/period
  // this picker's circular faces display.
  const parseInitialTime = (timeStr?: string) => {
    if (!timeStr) return { h: 10, m: 0, p: 'AM' as const };
    try {
      const [hStr, mStr] = timeStr.trim().split(':');
      const h24 = parseInt(hStr, 10);
      const m = parseInt(mStr, 10) || 0;
      if (Number.isNaN(h24)) return { h: 10, m: 0, p: 'AM' as const };
      const p: 'AM' | 'PM' = h24 >= 12 ? 'PM' : 'AM';
      const h = h24 % 12 === 0 ? 12 : h24 % 12;
      return { h, m, p };
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
    // Convert back to 24-hour "HH:MM" — the format every other time field
    // in this form (and the save logic that parses it) actually uses.
    const h24 = val === 'PM' ? (hour % 12) + 12 : hour % 12;
    const formattedHour = h24.toString().padStart(2, '0');
    const formattedMinute = minute.toString().padStart(2, '0');
    onChange(`${formattedHour}:${formattedMinute}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-80 rounded-2xl border border-neutral-700 bg-neutral-900 p-6 shadow-2xl text-neutral-100 flex flex-col items-center">
        
        {/* Header Display (Like Android: 10 : 00 AM) */}
        <div className="mb-6 flex items-baseline gap-2 text-3xl font-light">
          <button 
            type="button"
            onClick={() => setStep('hour')}
            className={`px-2 rounded ${step === 'hour' ? 'bg-accent-600/30 text-accent-400 font-normal' : 'text-neutral-400'}`}
          >
            {hour}
          </button>
          <span>:</span>
          <button 
            type="button"
            onClick={() => setStep('minute')}
            className={`px-2 rounded ${step === 'minute' ? 'bg-accent-600/30 text-accent-400 font-normal' : 'text-neutral-400'}`}
          >
            {minute.toString().padStart(2, '0')}
          </button>
          <div className="flex flex-col text-xs font-semibold text-neutral-400 ml-2">
            <button 
              type="button"
              onClick={() => setAmPm('AM')} 
              className={`${ampm === 'AM' ? 'text-accent-400 font-bold' : ''}`}
            >
              AM
            </button>
            <button 
              type="button"
              onClick={() => setAmPm('PM')} 
              className={`${ampm === 'PM' ? 'text-accent-400 font-bold' : ''}`}
            >
              PM
            </button>
          </div>
        </div>

        {/* Clock Face Container */}
        <div className="relative h-64 w-64 rounded-full bg-neutral-800/60 flex items-center justify-center border border-neutral-700/50">
          
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
                      hour === h ? 'bg-accent-600 text-neutral-950 shadow-lg' : 'hover:bg-neutral-700 text-neutral-200'
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
                      minute === m ? 'bg-accent-600 text-neutral-950 shadow-lg' : 'hover:bg-neutral-700 text-neutral-200'
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
                  ampm === 'AM' ? 'bg-accent-600 text-neutral-950' : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                }`}
              >
                AM
              </button>
              <button
                type="button"
                onClick={() => handleAmPmClick('PM')}
                className={`h-20 w-20 rounded-full font-semibold transition ${
                  ampm === 'PM' ? 'bg-accent-600 text-neutral-950' : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                }`}
              >
                PM
              </button>
            </div>
          )}

          {/* Center clock pin dot */}
          <div className="h-2 w-2 rounded-full bg-accent-500 pointer-events-none" />
        </div>

        {/* Footer actions */}
        <div className="mt-6 flex w-full justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}