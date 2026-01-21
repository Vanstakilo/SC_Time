
import React, { useState } from 'react';
import { EmployeeSubmission, SelectedPeriod, PeriodData, PayHalf, LogEntry, TimeEntry } from '../types';

interface Props {
  submissions: Record<string, EmployeeSubmission>;
  logs: LogEntry[];
  selectedPeriod: SelectedPeriod;
  onUpdatePeriod: (empId: string, data: PeriodData, action: string) => void;
  onPeriodChange: (p: SelectedPeriod) => void;
  onViewEmployee: (id: string) => void;
  onAddEmployee: (name: string) => void;
  onToggleActive: (id: string) => void;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const AdminDashboard: React.FC<Props> = ({ submissions, logs, selectedPeriod, onUpdatePeriod, onPeriodChange, onViewEmployee, onAddEmployee, onToggleActive }) => {
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [newStaffName, setNewStaffName] = useState("");
  const [logTab, setLogTab] = useState<'staff' | 'admin'>('staff');
  
  const periodKey = `${selectedPeriod.year}-${selectedPeriod.month}-${selectedPeriod.half}`;
  
  const list = (Object.values(submissions || {}) as EmployeeSubmission[]).sort((a, b) => {
    const aActive = a.isActive !== false;
    const bActive = b.isActive !== false;
    if (aActive === bActive) return (a.empName || "").localeCompare(b.empName || "");
    return aActive ? -1 : 1;
  });

  const getStats = (empId: string) => {
    const period = submissions?.[empId]?.periods?.[periodKey];
    if (!period) return 0;
    return (Object.values(period.entries || {}) as TimeEntry[]).reduce((acc, curr) => acc + (curr.totalHours || 0), 0);
  };

  const copyLink = (empId: string) => {
    const url = `${window.location.origin}${window.location.pathname}?user=${empId}`;
    navigator.clipboard.writeText(url);
    setCopyStatus(empId);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const handleAddSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newStaffName.trim()) return;
    onAddEmployee(newStaffName.trim());
    setNewStaffName("");
  };

  const filteredLogs = (logs || []).filter(l => logTab === 'staff' ? l.type === 'staff_action' : l.type === 'admin_action');

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-10">
        <div className="space-y-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-slate-900 rounded-[24px] flex items-center justify-center text-white text-3xl shadow-2xl">
              <i className="fa-solid fa-shield-halved"></i>
            </div>
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Admin Hub</h1>
              <p className="text-slate-500 font-black uppercase text-[10px] tracking-[0.3em] mt-2">Payroll Oversight & Verification</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 p-2 bg-white rounded-[24px] border border-slate-200 shadow-xl inline-flex">
              <select value={selectedPeriod.year} onChange={(e) => onPeriodChange({...selectedPeriod, year: parseInt(e.target.value)})} className="bg-transparent border-none text-[11px] font-black uppercase tracking-widest px-6 py-3 focus:ring-0 text-indigo-600 cursor-pointer">
                  <option value={2025}>2025</option><option value={2026}>2026</option>
              </select>
              <div className="h-6 w-px bg-slate-100"></div>
              <select value={selectedPeriod.month} onChange={(e) => onPeriodChange({...selectedPeriod, month: parseInt(e.target.value)})} className="bg-transparent border-none text-[11px] font-black uppercase tracking-widest px-6 py-3 focus:ring-0 cursor-pointer">
                  {MONTHS.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
              <div className="h-6 w-px bg-slate-100"></div>
              <div className="flex gap-2 px-3">
                  {(['1st', '2nd'] as PayHalf[]).map(h => (
                      <button key={h} onClick={() => onPeriodChange({...selectedPeriod, half: h})} className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase transition-all tracking-widest ${selectedPeriod.half === h ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>{h} Half</button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Staff Roll Call */}
      <div className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-100 mb-10">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-[0.3em] border-b border-slate-100">
            <tr>
              <th className="px-12 py-8 text-left">Staff Member</th>
              <th className="px-8 py-8 text-center">Status</th>
              <th className="px-8 py-8 text-right">Hours</th>
              <th className="px-12 py-8 text-right">Admin Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {list.map(emp => {
              const isActive = emp.isActive !== false;
              const period = emp.periods[periodKey] || { status: 'Draft', entries: {}, lastUpdated: '' };
              const status = period.status;

              return (
                <tr key={emp.empId} className={`group hover:bg-slate-50/50 transition-all ${!isActive ? 'opacity-30' : ''}`}>
                  <td className="px-12 py-8">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-400">{emp.empName.charAt(0)}</div>
                      <div>
                        <div className="font-black text-slate-900 text-lg uppercase tracking-tight">{emp.empName}</div>
                        <button disabled={!isActive} onClick={() => copyLink(emp.empId)} className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md transition-all ${copyStatus === emp.empId ? 'bg-green-600 text-white shadow-md' : 'text-slate-400 hover:text-indigo-600'}`}>
                            {copyStatus === emp.empId ? 'LINK COPIED' : 'PORTAL LINK'}
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-8 text-center">
                    <span className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                      status === 'Approved' ? 'bg-green-100 text-green-700 border-green-200' :
                      status === 'Submitted' ? 'bg-amber-100 text-amber-700 border-amber-200 shadow-lg ring-4 ring-amber-500/10' :
                      'bg-slate-50 text-slate-400 border-slate-200'
                    }`}>
                      {status === 'Submitted' && <i className="fa-solid fa-clock animate-pulse mr-2"></i>}
                      {status}
                    </span>
                  </td>
                  <td className="px-8 py-8 text-right">
                    <div className="font-black text-slate-900 text-2xl tracking-tighter">{getStats(emp.empId).toFixed(1)}</div>
                  </td>
                  <td className="px-12 py-8 text-right">
                    <div className="flex justify-end items-center gap-3">
                      <button onClick={() => onViewEmployee(emp.empId)} className="p-4 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm" title="Inspect Timesheet">
                        <i className="fa-solid fa-magnifying-glass-chart"></i>
                      </button>
                      
                      {status === 'Submitted' && (
                        <div className="flex gap-2 animate-in slide-in-from-right duration-300">
                          <button 
                            onClick={() => onUpdatePeriod(emp.empId, {...period, status: 'Approved', lastUpdated: new Date().toISOString()}, "Approved Period")} 
                            className="bg-green-600 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-green-700 active:scale-95 transition-all"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => onUpdatePeriod(emp.empId, {...period, status: 'Draft', lastUpdated: new Date().toISOString()}, "Rejected to Draft")} 
                            className="bg-white text-red-600 border border-red-100 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-red-50 transition-all"
                          >
                            Return
                          </button>
                        </div>
                      )}

                      {status === 'Approved' && (
                        <button 
                          onClick={() => onUpdatePeriod(emp.empId, {...period, status: 'Draft', lastUpdated: new Date().toISOString()}, "Revoked Approval")} 
                          className="bg-red-50 text-red-600 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all border border-red-100"
                        >
                          Revoke & Unlock
                        </button>
                      )}

                      {status === 'Draft' && (
                         <div className="text-[10px] font-black text-slate-300 uppercase italic px-4">Draft Stage</div>
                      )}

                      <button onClick={() => onToggleActive(emp.empId)} className={`p-4 rounded-2xl transition-all ${isActive ? 'text-slate-300 hover:text-red-500' : 'text-green-500 bg-green-50'}`} title={isActive ? 'Deactivate' : 'Restore'}>
                        <i className={`fa-solid ${isActive ? 'fa-user-lock' : 'fa-user-check'}`}></i>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {list.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-slate-300 font-black uppercase tracking-[0.3em] text-[10px]">No staff records found</p>
          </div>
        )}
      </div>

      {/* ADD NEW STAFF SECTION - Positioned right above Audit Logs */}
      <div className="mb-10 flex justify-end">
        <div className="inline-flex items-center gap-3 p-3 bg-white rounded-[28px] border border-slate-200 shadow-xl w-full max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-12 h-12 bg-indigo-600 rounded-[20px] flex items-center justify-center text-white shadow-lg flex-shrink-0">
                <i className="fa-solid fa-user-plus"></i>
            </div>
            <input 
                type="text" 
                value={newStaffName}
                onChange={(e) => setNewStaffName(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && newStaffName.trim()) {
                        handleAddSubmit();
                    }
                }}
                placeholder="ADD NEW STAFF MEMBER..." 
                className="bg-slate-50 border-none focus:ring-2 focus:ring-indigo-100 rounded-xl text-[10px] font-black uppercase tracking-widest flex-1 placeholder:text-slate-300 text-slate-900 px-4 py-3"
            />
            <button 
                onClick={handleAddSubmit}
                disabled={!newStaffName.trim()}
                className="bg-slate-900 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex-shrink-0"
            >
                Add Member
            </button>
        </div>
      </div>

      {/* Audit Logs Section */}
      <div className="bg-slate-900 rounded-[40px] shadow-2xl p-10">
          <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-8">
              <h2 className="text-white font-black uppercase text-xs tracking-widest flex items-center gap-3">
                <i className="fa-solid fa-list-check text-indigo-400"></i> Audit Activity Logs
              </h2>
              <div className="flex bg-slate-800 p-1 rounded-xl">
                  <button onClick={() => setLogTab('staff')} className={`text-[10px] font-black uppercase tracking-widest px-6 py-2.5 rounded-lg transition-all ${logTab === 'staff' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Staff Activity</button>
                  <button onClick={() => setLogTab('admin')} className={`text-[10px] font-black uppercase tracking-widest px-6 py-2.5 rounded-lg transition-all ${logTab === 'admin' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>System Actions</button>
              </div>
          </div>
          <div className="space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
              {filteredLogs.length === 0 ? (
                  <div className="text-center py-20 text-slate-700 font-black uppercase text-[10px] tracking-widest">No activity found yet.</div>
              ) : (
                  filteredLogs.map(log => (
                      <div key={log.id} className="flex items-center gap-6 p-4 bg-slate-800/40 rounded-2xl border border-white/5 hover:bg-slate-800/60 transition-colors">
                          <span className="text-[10px] font-mono text-indigo-400 w-24">{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="text-[10px] font-black text-white uppercase tracking-tight w-24 truncate border-l border-white/10 pl-4">{log.empName}</span>
                          <span className="flex-1 text-[11px] text-slate-400 font-medium">{log.action}: <span className="text-slate-300">{log.details}</span></span>
                      </div>
                  ))
              )}
          </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
