import React, { useState, useEffect } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight, Check, X, AlertCircle, Filter, Download, RefreshCw } from 'lucide-react';
import ScheduleGrid from './components/ScheduleGrid';
import AppointmentModal from './components/AppointmentModal';
import ExportModal from './components/ExportModal';
import { Auth } from './components/Auth';
import { Appointment, TimeSlot, DayData, AppointmentStatus, Filters, ExportDateRange } from './types';
import { getWeekDates, formatDate, getTimeSlots, getCurrentWeekNumber, isTimeOverlapping } from './utils/dateUtils';
import { exportToExcel } from './utils/exportUtils';
import { supabase } from './lib/supabase';
import { User } from '@supabase/supabase-js';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<boolean>(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [dayOffs, setDayOffs] = useState<{ [key: string]: boolean }>({});
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    message: '',
    onConfirm: () => { },
  });
  const [filters, setFilters] = useState<Filters>({
    student: '',
    subject: '',
    statuses: {
      notConfirmed: true,
      confirmed: true,
      completed: true,
      paid: true
    }
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Check current auth status
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Load appointments from Supabase
  useEffect(() => {
    if (user) {
      loadAppointments();

      // Подписываемся на изменения в таблице appointments
      const subscription = supabase
        .channel('appointments_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'appointments',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            loadAppointments();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  const loadAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', user?.id)
        .order('date', { ascending: true });

      if (error) throw error;

      const formattedAppointments = data.map(app => ({
        id: app.id,
        date: new Date(app.date),
        startTime: app.start_time,
        endTime: app.end_time,
        student: app.student,
        subject: app.subject,
        duration: app.duration,
        comment: app.comment,
        homework: app.homework,
        studied: app.studied,
        isConfirmed: app.is_confirmed,
        isCompleted: app.is_completed,
        isPaid: app.is_paid
      }));

      setAppointments(formattedAppointments);
    } catch (error) {
      console.error('Error loading appointments:', error);
      setErrorMessage('Произошла ошибка при загрузке записей.');
    }
  };

  // Get unique students and subjects for filters
  const uniqueStudents = Array.from(new Set(appointments.map(app => app.student))).filter(Boolean);
  const uniqueSubjects = Array.from(new Set(appointments.map(app => app.subject))).filter(Boolean);

  // Initialize week dates when current date changes
  useEffect(() => {
    const dates = getWeekDates(currentDate);
    setWeekDates(dates);
  }, [currentDate]);

  // Handle slot selection
  const handleSlotSelect = (slot: TimeSlot) => {
    const formattedDate = formatDate(slot.date);

    if (dayOffs[formattedDate]) {
      return;
    }

    const existingAppointment = appointments.find(
      app => formatDate(app.date) === formattedDate &&
        app.startTime === slot.time
    );

    if (existingAppointment) {
      setEditingAppointment(existingAppointment);
    } else {
      setEditingAppointment(null);
      setSelectedSlot(slot);
    }

    setIsModalOpen(true);
    setErrorMessage(null);
  };

  // Check if appointment overlaps with existing appointments
  const checkAppointmentOverlap = (appointmentData: Appointment): boolean => {
    const otherAppointments = editingAppointment
      ? appointments.filter(app => app.id !== editingAppointment.id)
      : appointments;

    const formattedDate = formatDate(appointmentData.date);

    const sameDay = otherAppointments.filter(app =>
      formatDate(app.date) === formattedDate
    );

    for (const app of sameDay) {
      if (isTimeOverlapping(
        appointmentData.startTime,
        appointmentData.endTime,
        app.startTime,
        app.endTime
      )) {
        return true;
      }
    }

    return false;
  };

  // Handle appointment save
  const handleSaveAppointment = async (appointmentData: Appointment) => {
    if (checkAppointmentOverlap(appointmentData)) {
      setErrorMessage('Невозможно сохранить запись. Обнаружено пересечение с существующей записью.');
      return;
    }

    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) throw new Error('User not authenticated');

      const appointmentForDb = {
        user_id: data.user.id,
        date: formatDate(appointmentData.date),
        start_time: appointmentData.startTime,
        end_time: appointmentData.endTime,
        student: appointmentData.student,
        subject: appointmentData.subject,
        duration: appointmentData.duration,
        comment: appointmentData.comment,
        homework: appointmentData.homework,
        studied: appointmentData.studied,
        is_confirmed: appointmentData.isConfirmed,
        is_completed: appointmentData.isCompleted,
        is_paid: appointmentData.isPaid
      };

      if (editingAppointment) {
        const { error } = await supabase
          .from('appointments')
          .update(appointmentForDb)
          .eq('id', appointmentData.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('appointments')
          .insert(appointmentForDb);

        if (error) throw error;
      }

      await loadAppointments();
      setIsModalOpen(false);
      setSelectedSlot(null);
      setEditingAppointment(null);
      setErrorMessage(null);
    } catch (error) {
      console.error('Error saving appointment:', error);
      setErrorMessage('Произошла ошибка при сохранении записи.');
    }
  };

  // Handle appointment delete
  const handleDeleteAppointment = async (id: string) => {
    setConfirmationModal({
      isOpen: true,
      message: 'Вы уверены, что хотите удалить эту запись?',
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('appointments')
            .delete()
            .eq('id', id);

          if (error) throw error;

          await loadAppointments();
          setIsModalOpen(false);
          setConfirmationModal({ ...confirmationModal, isOpen: false });
        } catch (error) {
          console.error('Error deleting appointment:', error);
          setErrorMessage('Произошла ошибка при удалении записи.');
        }
      },
    });
  };

  // Handle day off toggle
  const handleDayOffToggle = (date: Date, isChecked: boolean) => {
    const formattedDate = formatDate(date);

    const hasAppointments = appointments.some(app => formatDate(app.date) === formattedDate);

    if (hasAppointments && isChecked) {
      setConfirmationModal({
        isOpen: true,
        message: 'На этот день есть записи. Вы уверены, что хотите отметить его как выходной?',
        onConfirm: () => {
          setDayOffs({ ...dayOffs, [formattedDate]: isChecked });
          setConfirmationModal({ ...confirmationModal, isOpen: false });
        },
      });
    } else {
      setConfirmationModal({
        isOpen: true,
        message: isChecked
          ? 'Вы уверены, что хотите отметить этот день как выходной?'
          : 'Вы уверены, что хотите отметить этот день как рабочий?',
        onConfirm: () => {
          if (isChecked) {
            setDayOffs({ ...dayOffs, [formattedDate]: true });
          } else {
            const newDayOffs = { ...dayOffs };
            delete newDayOffs[formattedDate];
            setDayOffs(newDayOffs);
          }
          setConfirmationModal({ ...confirmationModal, isOpen: false });
        },
      });
    }
  };

  // Handle filter changes
  const handleFilterChange = (type: 'student' | 'subject', value: string) => {
    setFilters(prev => ({
      ...prev,
      [type]: value
    }));
  };

  // Handle status filter change
  const handleStatusFilterChange = (status: keyof typeof filters.statuses) => {
    setFilters(prev => ({
      ...prev,
      statuses: {
        ...prev.statuses,
        [status]: !prev.statuses[status]
      }
    }));
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      student: '',
      subject: '',
      statuses: {
        notConfirmed: true,
        confirmed: true,
        completed: true,
        paid: true
      }
    });
  };

  // Handle export
  const handleExport = (dateRange: ExportDateRange) => {
    exportToExcel(appointments, dateRange);
  };

  // Navigate to previous week
  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  // Navigate to next week
  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  // Go to today
  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Handle date change from date picker
  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(event.target.value);
    if (!isNaN(newDate.getTime())) {
      setCurrentDate(newDate);
    }
  };

  // Filter appointments based on all filters
  const filteredAppointments = appointments.filter(app => {
    // Filter by student
    if (filters.student && app.student !== filters.student) {
      return false;
    }

    // Filter by subject
    if (filters.subject && app.subject !== filters.subject) {
      return false;
    }

    // Filter by status
    const status = app.isPaid
      ? 'paid'
      : app.isCompleted
        ? 'completed'
        : app.isConfirmed
          ? 'confirmed'
          : 'notConfirmed';

    return filters.statuses[status as keyof typeof filters.statuses];
  });

  // Prepare day data for the schedule grid
  const daysData: DayData[] = weekDates.map(date => {
    const formattedDate = formatDate(date);
    const isDayOff = dayOffs[formattedDate] || false;
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;

    return {
      date,
      isDayOff,
      isWeekend,
      timeSlots: getTimeSlots(date).map(slot => {
        const appointment = filteredAppointments.find(
          app => formatDate(app.date) === formattedDate &&
            app.startTime <= slot.time &&
            app.endTime > slot.time
        );

        return {
          ...slot,
          appointment: appointment || null,
          isStart: appointment ? appointment.startTime === slot.time : false
        };
      })
    };
  });

  const weekNumber = getCurrentWeekNumber(currentDate);

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-indigo-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Расписание учителя</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>Неделя {weekNumber}</span>
            </div>
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="flex items-center px-3 py-1 bg-white text-indigo-600 rounded-md hover:bg-indigo-50 transition"
            >
              <Download className="h-4 w-4 mr-1" />
              Выгрузить
            </button>
            <button
              onClick={() => supabase.auth.signOut()}
              className="flex items-center px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4">
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={goToPreviousWeek}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <button
                onClick={goToNextWeek}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              <button
                onClick={goToToday}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
              >
                Сегодня
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-500" />
              <input
                type="date"
                value={currentDate.toISOString().split('T')[0]}
                onChange={handleDateChange}
                className="border rounded-md p-2"
              />
            </div>
          </div>

          <div className="mb-4">
            <div className="flex flex-wrap items-center gap-4 mb-2">
              <div className="flex items-center">
                <Filter className="h-5 w-5 text-gray-500 mr-2" />
                <span className="text-sm font-medium">Фильтры:</span>
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <select
                  value={filters.student}
                  onChange={(e) => handleFilterChange('student', e.target.value)}
                  className="p-2 border rounded-md"
                >
                  <option value="">Все ученики</option>
                  {uniqueStudents.map(student => (
                    <option key={student} value={student}>{student}</option>
                  ))}
                </select>

                <select
                  value={filters.subject}
                  onChange={(e) => handleFilterChange('subject', e.target.value)}
                  className="p-2 border rounded-md"
                >
                  <option value="">Все предметы</option>
                  {uniqueSubjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleResetFilters}
                className="flex items-center px-3 py-1 text-gray-600 hover:text-gray-900"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Сбросить
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="filter-not-confirmed"
                  checked={filters.statuses.notConfirmed}
                  onChange={() => handleStatusFilterChange('notConfirmed')}
                  className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded mr-1"
                />
                <label htmlFor="filter-not-confirmed" className="text-sm text-yellow-800 bg-yellow-100 px-2 py-1 rounded-md">
                  Не подтверждено
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="filter-confirmed"
                  checked={filters.statuses.confirmed}
                  onChange={() => handleStatusFilterChange('confirmed')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-1"
                />
                <label htmlFor="filter-confirmed" className="text-sm text-blue-800 bg-blue-100 px-2 py-1 rounded-md">
                  Подтверждено
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="filter-completed"
                  checked={filters.statuses.completed}
                  onChange={() => handleStatusFilterChange('completed')}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded mr-1"
                />
                <label htmlFor="filter-completed" className="text-sm text-green-800 bg-green-100 px-2 py-1 rounded-md">
                  Проведено
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="filter-paid"
                  checked={filters.statuses.paid}
                  onChange={() => handleStatusFilterChange('paid')}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded mr-1"
                />
                <label htmlFor="filter-paid" className="text-sm text-purple-800 bg-purple-100 px-2 py-1 rounded-md">
                  Оплачено
                </label>
              </div>
            </div>
          </div>

          <ScheduleGrid
            daysData={daysData}
            onSlotSelect={handleSlotSelect}
            onDayOffToggle={handleDayOffToggle}
          />
        </div>
      </main>

      {isModalOpen && (
        <AppointmentModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedSlot(null);
            setEditingAppointment(null);
            setErrorMessage(null);
          }}
          onSave={handleSaveAppointment}
          onDelete={handleDeleteAppointment}
          slot={selectedSlot}
          appointment={editingAppointment}
          errorMessage={errorMessage}
        />
      )}

      {isExportModalOpen && (
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          onExport={handleExport}
        />
      )}

      {confirmationModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <div className="flex items-start mb-4">
              <AlertCircle className="h-6 w-6 text-yellow-500 mr-2" />
              <h3 className="text-lg font-medium">Подтверждение</h3>
            </div>
            <p className="mb-6">{confirmationModal.message}</p>
            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                onClick={() => setConfirmationModal({ ...confirmationModal, isOpen: false })}
              >
                Отмена
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                onClick={confirmationModal.onConfirm}
              >
                Подтвердить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;