export interface TimeSlot {
  date: Date;
  time: string;
  appointment: Appointment | null;
  isStart: boolean;
}

export interface Appointment {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  student: string;
  subject: string;
  duration: string;
  price: number;
  comment: string;
  homework: string;
  studied: string;
  isConfirmed: boolean;
  isCompleted: boolean;
  isPaid: boolean;
}

export interface DayData {
  date: Date;
  isDayOff: boolean;
  isWeekend: boolean;
  timeSlots: TimeSlot[];
}

export type AppointmentStatus = 'not-confirmed' | 'confirmed' | 'completed' | 'paid';

export interface ConfirmationModalProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export interface ExportDateRange {
  startDate: string;
  endDate: string;
}

export interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (dateRange: ExportDateRange) => void;
}

export interface Filters {
  student: string;
  subject: string;
  statuses: {
    notConfirmed: boolean;
    confirmed: boolean;
    completed: boolean;
    paid: boolean;
  };
}

export interface Student {
  id: string;
  name: string;
}