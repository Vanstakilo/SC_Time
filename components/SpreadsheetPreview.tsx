
import React from 'react';
// Fix: Changed PayPeriod to PayHalf to match exported types in types.ts
import { DayRow, PayHalf, Holiday } from '../types';
import { getBCHolidays, isHoliday } from '../services/holidayService';

interface SpreadsheetPreviewProps {
  year: number;
  month: number;
  // Fix: Changed PayPeriod to PayHalf
  period: PayHalf;
}

const SpreadsheetPreview: React.FC<SpreadsheetPreviewProps> = ({ year, month, period }) => {
  const holidays = getBCHolidays(year);
  const rows: DayRow[] = [];

  const startDay = period === '1st' ? 1 : 16;
  const endDay = period === '1st' ? 15 : new Date(year, month + 1, 0).getDate();

  for (let d = startDay; d <= endDay; d++) {
    const dateObj = new Date(year, month, d);
    const dateStr = dateObj.toISOString().split('T')[0];
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
    const holiday = isHoliday(dateStr, holidays);

    rows.push({
      date: dateStr,
      dayName: dayName,
      isHoliday: !!holiday,
      holidayName: holiday?.name
    });
  }

  return (
    <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-sm bg-white">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">Day</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">Date</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">Start (8:30)</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">Finish (4:30)</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">Lunch (0.5)</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">Total Hours</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-700">Manager Approval</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {rows.map((row) => (
            <tr key={row.date} className={row.isHoliday ? 'bg-red-50' : ''}>
              <td className="px-4 py-3">
                {row.dayName}
                {row.isHoliday && <span className="block text-[10px] text-red-600 font-bold uppercase">{row.holidayName}</span>}
              </td>
              <td className="px-4 py-3 font-mono text-slate-500">{row.date}</td>
              <td className="px-4 py-3 border-l">8:30 AM</td>
              <td className="px-4 py-3">4:30 PM</td>
              <td className="px-4 py-3">0.5</td>
              <td className="px-4 py-3 font-bold text-blue-600">7.5</td>
              <td className="px-4 py-3 text-center">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SpreadsheetPreview;
