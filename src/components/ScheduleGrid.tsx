import React from 'react';
import { DayData, TimeSlot, AppointmentStatus } from '../types';
import { formatDisplayDate, getShortDayName, getAppointmentStatus, getStatusText, formatTimeRange } from '../utils/dateUtils';

interface ScheduleGridProps {
  daysData: DayData[];
  onSlotSelect: (slot: TimeSlot) => void;
  onDayOffToggle: (date: Date, isChecked: boolean) => void;
}

const ScheduleGrid: React.FC<ScheduleGridProps> = ({ daysData, onSlotSelect, onDayOffToggle }) => {
  // Get all unique time slots
  const allTimeSlots = daysData[0]?.timeSlots.map(slot => slot.time) || [];

  // Get status color based on appointment status
  const getStatusColor = (status: AppointmentStatus): string => {
    switch (status) {
      case 'not-confirmed':
        return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'completed':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'paid':
        return 'bg-purple-100 border-purple-300 text-purple-800';
      default:
        return 'bg-gray-100';
    }
  };

  // Check if current date is today
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse table-fixed">
        <thead>
          <tr>
            <th className="border p-2 bg-gray-50 w-20 min-w-[80px]"></th>
            {daysData.map((day, index) => (
              <th
                key={index}
                className={`border p-2 w-[180px] min-w-[180px] ${isToday(day.date) ? 'bg-indigo-50' : day.isWeekend ? 'bg-gray-100' : 'bg-gray-50'} ${day.isDayOff ? 'bg-gray-200' : ''}`}
              >
                <div className="flex flex-col items-center">
                  <div className={`font-bold ${day.isWeekend ? 'text-indigo-800' : ''}`}>
                    {getShortDayName(day.date)}
                  </div>
                  <div className={`text-sm ${isToday(day.date) ? 'font-bold text-indigo-600' : ''}`}>
                    {formatDisplayDate(day.date)}
                  </div>
                  <div className="mt-2 flex items-center">
                    <input
                      type="checkbox"
                      checked={day.isDayOff}
                      onChange={(e) => onDayOffToggle(day.date, e.target.checked)}
                      className="mr-1"
                      id={`dayoff-${index}`}
                    />
                    <label htmlFor={`dayoff-${index}`} className="text-xs">Выходной</label>
                  </div>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {allTimeSlots.map((time, timeIndex) => (
            <tr key={timeIndex} className={timeIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
              <td className="border p-2 text-center font-medium text-gray-700">
                {time}
              </td>
              {daysData.map((day, dayIndex) => {
                const slot = day.timeSlots[timeIndex];
                const appointment = slot.appointment;
                const isStart = slot.isStart;

                // If this slot has an appointment and it's the start time
                if (appointment && isStart) {
                  const status = getAppointmentStatus(
                    appointment.isConfirmed,
                    appointment.isCompleted,
                    appointment.isPaid
                  );

                  // Calculate how many rows this appointment spans
                  const startTimeIndex = allTimeSlots.findIndex(t => t === appointment.startTime);
                  const endTimeIndex = allTimeSlots.findIndex(t => t === appointment.endTime);
                  const rowSpan = endTimeIndex === -1
                    ? allTimeSlots.length - startTimeIndex
                    : endTimeIndex - startTimeIndex;

                  return (
                    <td
                      key={dayIndex}
                      rowSpan={rowSpan}
                      className={`border p-2 relative ${getStatusColor(status)} cursor-pointer hover:opacity-90 transition-opacity`}
                      onClick={() => onSlotSelect(slot)}
                    >
                      <div className="flex flex-col h-full">
                        <div className="font-bold text-sm">
                          {formatTimeRange(appointment.startTime, appointment.endTime)}
                        </div>
                        <div className="font-medium">{appointment.student}</div>
                        <div className="text-sm">{appointment.subject}</div>
                        <div className="text-sm mt-1">{appointment.price.toLocaleString('ru-RU')} ₽</div>
                        <div className="text-xs mt-auto">{getStatusText(status)}</div>
                      </div>
                    </td>
                  );
                }
                // If this slot has an appointment but it's not the start time, skip it
                else if (appointment && !isStart) {
                  return null;
                }
                // Empty slot
                else {
                  return (
                    <td
                      key={dayIndex}
                      className={`border p-1 ${day.isDayOff ? 'bg-gray-200' : day.isWeekend ? 'bg-gray-100 hover:bg-gray-200' : 'hover:bg-gray-100'} ${day.isDayOff ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      onClick={() => !day.isDayOff && onSlotSelect(slot)}
                    >
                      {day.isDayOff ? (
                        <div className="h-4"></div>
                      ) : (
                        <div className="h-4"></div>
                      )}
                    </td>
                  );
                }
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ScheduleGrid;