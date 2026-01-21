
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import EmployeePortal from './components/EmployeePortal';
import AdminDashboard from './components/AdminDashboard';
import { UserRole, EmployeeSubmission, SelectedPeriod, PeriodData, LogEntry } from './types';
import { MOCK_EMPLOYEES } from './constants';

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [currentEmpId, setCurrentEmpId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<Record<string, EmployeeSubmission>>({});
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const [selectedPeriod, setSelectedPeriod] = useState<SelectedPeriod>({
    year: 2026,
    month: 0, 
    half: '1st'
  });

  const periodKey = useMemo(() => 
    `${selectedPeriod.year}-${selectedPeriod.month}-${selectedPeriod.half}`,
    [selectedPeriod]
  );

  // Initialization & Hydration
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const userParam = params.get('user');
    const roleParam = params.get('role');

    const savedData = localStorage.getItem('sc_payroll_v4');
    const savedLogs = localStorage.getItem('sc_payroll_logs_v4');

    let initialSubmissions: Record<string, EmployeeSubmission> = {};
    if (savedData) {
      try {
        initialSubmissions = JSON.parse(savedData);
      } catch (e) {
        initialSubmissions = {};
      }
    } else {
      MOCK_EMPLOYEES.forEach(emp => {
        initialSubmissions[emp.id] = {
          empId: emp.id,
          empName: emp.name,
          isActive: true,
          periods: {}
        };
      });
    }
    
    setSubmissions(initialSubmissions);

    if (savedLogs) {
      try {
        setLogs(JSON.parse(savedLogs));
      } catch (e) {
        setLogs([]);
      }
    }

    if (roleParam === 'admin') {
      setRole('admin');
    } else if (userParam && initialSubmissions[userParam]) {
      setRole('employee');
      setCurrentEmpId(userParam);
    }
    setIsLoaded(true);
  }, []);

  // Persistence
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('sc_payroll_v4', JSON.stringify(submissions));
    }
  }, [submissions, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('sc_payroll_logs_v4', JSON.stringify(logs));
    }
  }, [logs, isLoaded]);

  const addLog = useCallback((type: LogEntry['type'], empName: string, action: string, details: string) => {
    const newLog: LogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      type,
      empName,
      action,
      details
    };
    setLogs(prev => [newLog, ...prev].slice(0, 150));
  }, []);

  // Core Update Logic
  const updatePeriodData = useCallback((empId: string, pKey: string, data: PeriodData, isSubmission: boolean = false) => {
    setSubmissions(prev => {
      const currentEmp = prev[empId];
      if (!currentEmp) return prev;
      return {
        ...prev,
        [empId]: {
          ...currentEmp,
          periods: {
            ...currentEmp.periods,
            [pKey]: data
          }
        }
      };
    });

    if (isSubmission) {
      // Find name from existing state for logging
      const empName = submissions[empId]?.empName || 'Staff';
      addLog('staff_action', empName, 'Timesheet Submitted', `Period: ${pKey}`);
    }
  }, [addLog, submissions]);

  const handleAdminUpdate = useCallback((empId: string, pKey: string, data: PeriodData, actionName: string) => {
    setSubmissions(prev => {
      const currentEmp = prev[empId];
      if (!currentEmp) return prev;
      return {
        ...prev,
        [empId]: {
          ...currentEmp,
          periods: {
            ...currentEmp.periods,
            [pKey]: data
          }
        }
      };
    });

    const empName = submissions[empId]?.empName || 'Staff';
    addLog('admin_action', empName, actionName, `Period: ${pKey}`);
  }, [addLog, submissions]);

  const goHome = () => {
    setRole(null);
    setCurrentEmpId(null);
    window.history.pushState({}, '', window.location.pathname);
  };

  const switchRole = (newRole: UserRole, empId: string | null = null) => {
    setRole(newRole);
    setCurrentEmpId(empId);
  };

  if (!isLoaded) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-black text-indigo-600 animate-pulse uppercase tracking-widest">Initialising SC Payroll Hub...</div>;

  const activeEmployees = (Object.values(submissions || {}) as EmployeeSubmission[]).filter(e => e.isActive);

  if (!role) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-12 rounded-[48px] shadow-2xl max-w-2xl w-full border border-slate-100 text-center">
          <div className="w-24 h-24 bg-indigo-600 rounded-[32px] flex items-center justify-center text-white text-4xl mx-auto mb-8 shadow-xl">
            <i className="fa-solid fa-file-invoice-dollar"></i>
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight uppercase">SC Payroll</h1>
          <p className="text-slate-500 mb-12 text-lg font-medium leading-relaxed italic">ShearComfort Timesheet portal</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button onClick={() => switchRole('admin')} className="group p-8 bg-slate-900 text-white rounded-[32px] hover:scale-105 transition-all text-left shadow-xl hover:shadow-indigo-500/20">
              <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-indigo-50 transition-colors">
                <i className="fa-solid fa-user-shield"></i>
              </div>
              <h3 className="text-xl font-bold mb-2">Manager Hub</h3>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-widest leading-tight">System Oversight</p>
            </button>
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center mb-2">Authorized Staff</p>
              <div className="max-h-[220px] overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                {activeEmployees.map(emp => (
                  <button key={emp.empId} onClick={() => switchRole('employee', emp.empId)} className="w-full p-4 bg-white border-2 border-slate-100 hover:border-indigo-500 text-slate-700 rounded-2xl font-bold text-sm transition-all flex items-center gap-4 group shadow-sm">
                    <div className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center group-hover:bg-indigo-50 text-slate-400 group-hover:text-indigo-600"><i className="fa-solid fa-user"></i></div>
                    <span className="flex-1 text-left truncate">{emp.empName}</span>
                    <i className="fa-solid fa-chevron-right text-slate-200 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all"></i>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={goHome} className="flex items-center gap-3 hover:opacity-70 transition-opacity">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-sm shadow-md">
              <i className="fa-solid fa-house"></i>
            </div>
            <span className="font-black text-slate-900 tracking-tight uppercase">SC Payroll</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex px-4 py-1.5 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-black text-slate-500 items-center gap-2 tracking-widest uppercase">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              {role === 'admin' ? 'ADMINISTRATOR' : submissions?.[currentEmpId!]?.empName || 'STAFF'}
            </div>
            <button onClick={goHome} className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 px-4 py-2 rounded-xl transition-all">Logout <i className="fa-solid fa-sign-out ml-2"></i></button>
          </div>
        </div>
      </nav>
      <main className="flex-grow">
        {role === 'admin' ? (
          <AdminDashboard 
            submissions={submissions} logs={logs} selectedPeriod={selectedPeriod}
            onUpdatePeriod={(empId, data, action) => handleAdminUpdate(empId, periodKey, data, action)}
            onPeriodChange={setSelectedPeriod} onViewEmployee={(id) => switchRole('employee', id)}
            onAddEmployee={(name) => {
              const newId = `emp_${Math.random().toString(36).substr(2, 5)}`;
              setSubmissions(prev => ({...prev, [newId]: {empId: newId, empName: name, isActive: true, periods: {}} as EmployeeSubmission}));
              addLog('admin_action', 'System', 'Staff Added', `New employee: ${name}`);
            }}
            onToggleActive={(id) => {
              const emp = submissions?.[id];
              if (!emp) return;
              const state = !emp.isActive;
              setSubmissions(prev => ({...prev, [id]: {...emp, isActive: state}}));
              addLog('admin_action', emp.empName, state ? 'Staff Restored' : 'Staff Deactivated', `Status: ${state ? 'Active' : 'Inactive'}`);
            }}
          />
        ) : (
          currentEmpId && submissions?.[currentEmpId] ? (
            <EmployeePortal 
              empName={submissions[currentEmpId].empName}
              periodData={submissions[currentEmpId].periods?.[periodKey] || { status: 'Draft', entries: {}, lastUpdated: '' }} 
              selectedPeriod={selectedPeriod} onPeriodChange={setSelectedPeriod}
              onUpdate={(data, isSub) => updatePeriodData(currentEmpId, periodKey, data, isSub)} 
            />
          ) : (
            <div className="py-20 text-center font-black text-slate-300 uppercase tracking-widest">
              Access Refused or Employee Not Found
            </div>
          )
        )}
      </main>
    </div>
  );
};

export default App;
