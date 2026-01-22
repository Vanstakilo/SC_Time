
import React, { useMemo, useState } from 'react';
import { PeriodData, TimeEntry, SelectedPeriod, PayHalf } from '../types';
import { getBCHolidays, isHoliday } from '../services/holidayService';
import { APP_CONFIG } from '../constants';

interface Props {
  empName: string;
  periodData: PeriodData;
  selectedPeriod: SelectedPeriod;
  onPeriodChange: (p: SelectedPeriod) => void;
  onUpdate: (data: PeriodData, isSubmission: boolean) => void;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const EmployeePortal: React.FC<Props> = ({ empName, periodData, selectedPeriod, onPeriodChange, onUpdate }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const holidays = useMemo(() => getBCHolidays(selectedPeriod.year), [selectedPeriod.year]);
  
  const days = useMemo(() => {
    const { year, month, half } = selectedPeriod;
    const start = half === '1st' ? 1 : 16;
    const end = half === '1st' ? 15 : new Date(year, month + 1, 0).getDate();
    const result = [];
    for (let d = start; d <= end; d++) {
      const date = new Date(year, month, d);
      const dateStr = date.toISOString().split('T')[0];
      result.push({
        dateStr,
        dayName: date.toLocaleDateString('en-US', { weekday: 'long' }),
        holiday: isHoliday(dateStr, holidays)
      });
    }
    return result;
  }, [selectedPeriod, holidays]);

  // Stage 2 (Submitted) and Stage 3 (Approved) are both LOCKED for editing
  const isLocked = periodData.status === 'Submitted' || periodData.status === 'Approved';

  const handleInputChange = (dateStr: string, field: keyof TimeEntry, value: any) => {
    if (isLocked) return;
    const entries = { ...periodData.entries };
    const current = entries[dateStr] || { date: dateStr, startTime: "", endTime: "", lunchBreak: APP_CONFIG.LUNCH_DEFAULT, totalHours: 0, notes: "", isSickDay: false };
    const updated = { ...current, [field]: value };
    
    if (updated.isSickDay) {
      updated.totalHours = 7.5;
      updated.startTime = "";
      updated.endTime = "";
    } else if (updated.startTime && updated.endTime) {
      const [sh, sm] = updated.startTime.split(':').map(Number);
      const [eh, em] = updated.endTime.split(':').map(Number);
      const diffMinutes = (eh * 60 + em) - (sh * 60 + sm);
      updated.totalHours = Math.max(0, (diffMinutes / 60) - (updated.lunchBreak || 0));
    } else {
      updated.totalHours = 0;
    }
    entries[dateStr] = updated;
    onUpdate({ ...periodData, entries, lastUpdated: new Date().toISOString() }, false);
  };

  const handleSubmit = () => {
    if (isLocked) return;
    setIsSubmitting(true);
    
    const submittedData: PeriodData = { 
      ...periodData, 
      status: 'Submitted', 
      lastUpdated: new Date().toISOString() 
    };
    
    onUpdate(submittedData, true);
    
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setShowSuccess(false), 3000);
    }, 500);
  };

  const totalSum = (Object.values(periodData.entries || {}) as TimeEntry[]).reduce((acc, curr) => acc + (curr.totalHours || 0), 0);
  const sickDaysCount = (Object.values(periodData.entries || {}) as TimeEntry[]).filter(e => e.isSickDay).length;

  const formatDateWithTime = (isoString: string) => {
    if (!isoString) return 'N/A';
    const d = new Date(isoString);
    return d.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-6 relative mb-20 animate-in fade-in duration-500">
      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-[200] bg-white/95 flex items-center justify-center p-6 backdrop-blur-md animate-in zoom-in-95 duration-300">
          <div className="max-w-md w-full text-center space-y-8">
            <div className="w-24 h-24 bg-indigo-600 text-white rounded-[32px] flex items-center justify-center text-4xl mx-auto shadow-2xl animate-bounce">
              <i className="fa-solid fa-lock"></i>
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Successfully Submitted</h2>
              <p className="text-slate-500 font-medium">Your timesheet for this period is now locked and awaiting manager approval.</p>
            </div>
            <button onClick={() => setShowSuccess(false)} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Back to Timesheet</button>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[250] flex items-center justify-center">
          <div className="bg-white p-12 rounded-[40px] shadow-2xl flex flex-col items-center gap-6">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-black text-slate-900 uppercase tracking-widest text-[10px]">Processing Submission...</p>
          </div>
        </div>
      )}

      <div className={`bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-200 transition-all duration-500 ${isLocked ? 'grayscale-[0.1] shadow-indigo-500/5' : ''}`}>
        
        {/* Status Banner */}
        {isLocked && (
          <div className={`px-6 py-4 text-center text-[10px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-4 animate-in slide-in-from-top duration-700 ${periodData.status === 'Approved' ? 'bg-green-600 text-white' : 'bg-amber-500 text-white'}`}>
             <i className={`fa-solid ${periodData.status === 'Approved' ? 'fa-circle-check' : 'fa-lock'} text-sm`}></i>
             PERIOD {periodData.status.toUpperCase()} • {periodData.status === 'Approved' ? 'PAYROLL FINALIZED' : 'EDITING DISABLED FOR THIS PERIOD'}
          </div>
        )}

        {/* Header */}
        <div className="bg-slate-900 p-6 md:p-10 text-white flex flex-col md:flex-row justify-between items-center gap-6 md:gap-10">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-600 rounded-[20px] flex items-center justify-center text-2xl shadow-lg border border-indigo-400/20">
                <i className="fa-solid fa-user-clock"></i>
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tighter uppercase">{empName}</h1>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Employee Portal</p>
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 p-2 bg-indigo-950 rounded-2xl border border-indigo-900/50 backdrop-blur-md">
               {/* PERIOD NAVIGATION: ALWAYS ENABLED */}
               <div className="relative">
                 <select 
                   value={selectedPeriod.year} 
                   onChange={(e) => onPeriodChange({...selectedPeriod, year: parseInt(e.target.value)})} 
                   className="appearance-none bg-indigo-950 border-none text-[10px] font-black uppercase tracking-widest px-6 py-2 focus:ring-2 focus:ring-indigo-500 text-indigo-400 cursor-pointer rounded-xl block w-full text-center hover:bg-indigo-900 transition-colors"
                 >
                   <option className="bg-indigo-950 text-white" value={2025}>2025</option>
                   <option className="bg-indigo-950 text-white" value={2026}>2026</option>
                 </select>
               </div>
               <div className="w-px h-5 bg-indigo-900"></div>
               <div className="relative">
                 <select 
                   value={selectedPeriod.month} 
                   onChange={(e) => onPeriodChange({...selectedPeriod, month: parseInt(e.target.value)})} 
                   className="appearance-none bg-indigo-950 border-none text-[10px] font-black uppercase tracking-widest px-6 py-2 focus:ring-2 focus:ring-indigo-500 text-white cursor-pointer rounded-xl block w-full text-center hover:bg-indigo-900 transition-colors"
                 >
                   {MONTHS.map((m, i) => (
                     <option className="bg-indigo-950 text-white" key={m} value={i}>{m}</option>
                   ))}
                 </select>
               </div>
               <div className="w-px h-5 bg-indigo-900"></div>
               <div className="flex gap-1 px-1">
                 {(['1st', '2nd'] as PayHalf[]).map(h => (
                   <button key={h} onClick={() => onPeriodChange({...selectedPeriod, half: h})} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${selectedPeriod.half === h ? 'bg-indigo-600 text-white shadow-xl scale-110' : 'text-slate-500 hover:text-white hover:bg-indigo-900'}`}>
                     {h} Half
                   </button>
                 ))}
               </div>
            </div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Switch periods above to view or start other drafts</p>
          </div>

          <div className="flex flex-col items-center md:items-end">
             <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Workflow Status</div>
             <div className={`px-10 py-4 rounded-full text-xs font-black mb-4 border-2 transition-all flex items-center gap-3 ${
               periodData.status === 'Approved' ? 'bg-green-500/10 text-green-400 border-green-500/30 shadow-lg' : 
               periodData.status === 'Submitted' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 
               'bg-slate-700 text-slate-300 border-slate-600'
             }`}>
               <i className={`fa-solid ${periodData.status === 'Approved' ? 'fa-check-double' : periodData.status === 'Submitted' ? 'fa-hourglass-start' : 'fa-pen-to-square'}`}></i>
               {periodData.status.toUpperCase()}
             </div>
             
             <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex flex-col items-center md:items-end gap-1">
                {periodData.status === 'Approved' ? (
                  <span className="text-green-500 font-black flex items-center gap-2 bg-green-500/10 px-4 py-2 rounded-lg not-italic">
                    <i className="fa-solid fa-stamp"></i> Approved on {formatDateWithTime(periodData.lastUpdated)}
                  </span>
                ) : periodData.status === 'Submitted' ? (
                  <span className="text-amber-500 flex items-center gap-2 italic">
                    <i className="fa-solid fa-paper-plane"></i> Submitted on {formatDateWithTime(periodData.lastUpdated)}
                  </span>
                ) : (
                  <span className="flex items-center gap-2 italic">
                    <i className="fa-solid fa-history"></i> Last Activity: {periodData.lastUpdated ? formatDateWithTime(periodData.lastUpdated) : 'N/A'}
                  </span>
                )}
             </div>

             {periodData.status === 'Draft' && (
               <button onClick={handleSubmit} className="mt-6 group bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-4 rounded-2xl text-xs font-black transition-all shadow-2xl shadow-indigo-500/40 flex items-center gap-2">
                 SUBMIT TO MANAGER <i className="fa-solid fa-arrow-right-to-bracket group-hover:translate-x-1 transition-transform"></i>
               </button>
             )}
          </div>
        </div>

        {/* Entry Table */}
        <div className={`overflow-x-auto overflow-y-hidden touch-pan-x transition-colors duration-500 ${isLocked ? 'bg-slate-50/70' : 'bg-white'}`}>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-[0.25em] border-b border-slate-100">
              <tr>
                <th className="px-10 py-6 text-left">Calendar</th>
                <th className="px-4 py-6 text-center">Start</th>
                <th className="px-4 py-6 text-center">End</th>
                <th className="px-4 py-6 text-center">Lunch</th>
                <th className="px-4 py-6 text-center">Paid Sick</th>
                <th className="px-4 py-6 text-right">Hours</th>
                <th className="px-10 py-6 text-left">Activity Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50">
              {days.map(day => {
                const entry = periodData.entries?.[day.dateStr];
                const isSick = !!entry?.isSickDay;
                return (
                  <tr key={day.dateStr} className={`group transition-all ${day.holiday ? 'bg-red-50/20' : ''} ${isSick ? 'bg-amber-50/30' : 'hover:bg-slate-50/40'}`}>
                    <td className="px-10 py-6">
                      <div className={`font-black text-sm ${isLocked ? 'text-slate-400' : 'text-slate-800'}`}>{day.dayName}</div>
                      <div className="text-[10px] text-slate-400 font-bold tracking-tight">{day.dateStr}</div>
                      {day.holiday && <span className="inline-block mt-1 text-[8px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full uppercase">{day.holiday.name}</span>}
                    </td>
                    <td className="px-4 py-6">
                      <input type="time" disabled={isLocked || isSick} value={entry?.startTime || ""} onChange={(e) => handleInputChange(day.dateStr, 'startTime', e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold disabled:opacity-30 shadow-sm focus:ring-2 focus:ring-indigo-500" />
                    </td>
                    <td className="px-4 py-6">
                      <input type="time" disabled={isLocked || isSick} value={entry?.endTime || ""} onChange={(e) => handleInputChange(day.dateStr, 'endTime', e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold disabled:opacity-30 shadow-sm focus:ring-2 focus:ring-indigo-500" />
                    </td>
                    <td className="px-4 py-6 text-center">
                      <input type="number" step="0.1" disabled={isLocked || isSick} value={entry?.lunchBreak ?? APP_CONFIG.LUNCH_DEFAULT} onChange={(e) => handleInputChange(day.dateStr, 'lunchBreak', parseFloat(e.target.value) || 0)} className="w-16 text-center bg-white border border-slate-200 rounded-xl px-2 py-2 text-xs font-bold disabled:opacity-30 shadow-sm" />
                    </td>
                    <td className="px-4 py-6 text-center">
                      <input type="checkbox" disabled={isLocked} checked={isSick} onChange={(e) => handleInputChange(day.dateStr, 'isSickDay', e.target.checked)} className="w-6 h-6 rounded-lg border-slate-300 text-indigo-600 focus:ring-4 focus:ring-indigo-500/10 cursor-pointer disabled:opacity-20" />
                    </td>
                    <td className="px-4 py-6 text-right font-black text-indigo-600 text-xl tracking-tighter">
                      {entry?.totalHours?.toFixed(1) || "0.0"}
                    </td>
                    <td className="px-10 py-6">
                      <input type="text" disabled={isLocked} placeholder="..." value={entry?.notes || ""} onChange={(e) => handleInputChange(day.dateStr, 'notes', e.target.value)} className="w-full bg-transparent border-b-2 border-slate-100 focus:border-indigo-600 focus:ring-0 transition-all text-xs font-medium disabled:opacity-30" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-900 text-white">
              <tr>
                <td colSpan={5} className="px-10 py-12 text-right font-black uppercase tracking-[0.25em] text-slate-500 text-[10px]">
                   {sickDaysCount > 0 && <span className="mr-8 text-amber-500 bg-amber-500/10 px-4 py-2 rounded-full border border-amber-500/20">SICK HOURS: {(sickDaysCount * 7.5).toFixed(1)}h</span>}
                   Total Period Hours
                </td>
                <td className="px-4 py-12 text-right font-black text-5xl text-yellow-400 tracking-tighter drop-shadow-md">{totalSum.toFixed(1)}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmployeePortal;
