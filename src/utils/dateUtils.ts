// Get dates for the week containing the given date
export const getWeekDates = (date: Date): Date[] => {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  
  const monday = new Date(date);
  monday.setDate(diff);
  
  const weekDates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const nextDate = new Date(monday);
    nextDate.setDate(monday.getDate() + i);
    weekDates.push(nextDate);
  }
  
  return weekDates;
};

// Format date to YYYY-MM-DD
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Format date for display
export const formatDisplayDate = (date: Date): string => {
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    weekday: 'short'
  });
};

// Get day name
export const getDayName = (date: Date): string => {
  const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
  return days[date.getDay()];
};

// Get short day name
export const getShortDayName = (date: Date): string => {
  const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  return days[date.getDay()];
};

// Get time slots for a day (from 8:00 to 22:00 with 30-minute intervals)
export const getTimeSlots = (date: Date): { date: Date; time: string }[] => {
  const slots = [];
  const startHour = 8;
  const endHour = 22;
  
  for (let hour = startHour; hour <= endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      if (hour === endHour && minute > 0) continue;
      
      const formattedHour = hour.toString().padStart(2, '0');
      const formattedMinute = minute.toString().padStart(2, '0');
      const time = `${formattedHour}:${formattedMinute}`;
      
      slots.push({
        date: new Date(date),
        time
      });
    }
  }
  
  return slots;
};

// Calculate end time based on start time and duration
export const calculateEndTime = (startTime: string, duration: string): string => {
  const [hours, minutes] = startTime.split(':').map(Number);
  let durationMinutes = 0;
  
  if (duration === '1 час') {
    durationMinutes = 60;
  } else if (duration === '1 час 30 минут') {
    durationMinutes = 90;
  } else if (duration === '2 часа') {
    durationMinutes = 120;
  }
  
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const newHours = Math.floor(totalMinutes / 60);
  const newMinutes = totalMinutes % 60;
  
  return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
};

// Check if a time is between start and end times
export const isTimeBetween = (time: string, startTime: string, endTime: string): boolean => {
  return time >= startTime && time < endTime;
};

// Check if two time ranges overlap
export const isTimeOverlapping = (
  start1: string, 
  end1: string, 
  start2: string, 
  end2: string
): boolean => {
  // Convert times to minutes for easier comparison
  const convertToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  const start1Min = convertToMinutes(start1);
  const end1Min = convertToMinutes(end1);
  const start2Min = convertToMinutes(start2);
  const end2Min = convertToMinutes(end2);
  
  // Check for overlap
  return (start1Min < end2Min && end1Min > start2Min);
};

// Get current week number
export const getCurrentWeekNumber = (date: Date): number => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

// Format time for display
export const formatTimeRange = (startTime: string, endTime: string): string => {
  return `${startTime} - ${endTime}`;
};

// Get appointment status based on checkboxes
export const getAppointmentStatus = (
  isConfirmed: boolean,
  isCompleted: boolean,
  isPaid: boolean
): 'not-confirmed' | 'confirmed' | 'completed' | 'paid' => {
  if (isPaid) return 'paid';
  if (isCompleted) return 'completed';
  if (isConfirmed) return 'confirmed';
  return 'not-confirmed';
};

// Get status text based on status
export const getStatusText = (status: 'not-confirmed' | 'confirmed' | 'completed' | 'paid'): string => {
  switch (status) {
    case 'not-confirmed':
      return 'Не подтверждено';
    case 'confirmed':
      return 'Подтверждено';
    case 'completed':
      return 'Проведено';
    case 'paid':
      return 'Оплачено';
    default:
      return '';
  }
};