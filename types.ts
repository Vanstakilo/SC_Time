
export interface TimeEntry {
  date: string;
  startTime: string;
  endTime: string;
  lunchBreak: number;
  totalHours: number;
  notes: string;
  isSickDay?: boolean;
}

export interface PeriodData {
  status: 'Draft' | 'Submitted' | 'Approved';
  entries: Record<string, TimeEntry>;
  lastUpdated: string;
}

export interface EmployeeSubmission {
  empId: string;
  empName: string;
  isActive: boolean;
  periods: Record<string, PeriodData>;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'staff_action' | 'admin_action';
  empName: string;
  action: string;
  details: string;
}

export type UserRole = 'employee' | 'admin';

export interface Holiday {
  date: string;
  name: string;
}

export type PayHalf = '1st' | '2nd';

export interface SelectedPeriod {
  year: number;
  month: number;
  half: PayHalf;
}

export interface DayRow {
  date: string;
  dayName: string;
  isHoliday: boolean;
  holidayName?: string;
}
