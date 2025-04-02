import { Appointment } from '../types';
import { utils, writeFile } from 'xlsx';
import { getAppointmentStatus, getStatusText } from './dateUtils';

export const exportToExcel = (appointments: Appointment[], dateRange: { startDate: string; endDate: string }) => {
  // Filter appointments by date range
  const filteredAppointments = appointments.filter(app => {
    const appDate = new Date(app.date).toISOString().split('T')[0];
    return appDate >= dateRange.startDate && appDate <= dateRange.endDate;
  });

  // Prepare data for export
  const data = filteredAppointments.map(app => ({
    'Дата занятия': new Date(app.date).toLocaleDateString('ru-RU'),
    'Ученик': app.student,
    'Предмет': app.subject,
    'Длительность': app.duration,
    'Домашнее задание': app.homework,
    'Изучено на занятии': app.studied,
    'Статус': getStatusText(getAppointmentStatus(app.isConfirmed, app.isCompleted, app.isPaid))
  }));

  // Create workbook and worksheet
  const wb = utils.book_new();
  const ws = utils.json_to_sheet(data);

  // Add worksheet to workbook
  utils.book_append_sheet(wb, ws, 'Расписание');

  // Generate file name with date range
  const fileName = `Расписание_${dateRange.startDate}_${dateRange.endDate}.xlsx`;

  // Save file
  writeFile(wb, fileName);
};