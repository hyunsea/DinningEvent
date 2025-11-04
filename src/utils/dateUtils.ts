export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':');
  return `${hours}:${minutes}`;
};

export const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
};

export const isPastDate = (date: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

export const getMonthName = (month: number): string => {
  const monthNames = [
    'January', 'February', 'March', 'April',
    'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December'
  ];
  return monthNames[month - 1];
};

export const getDaysInMonth = (month: number, year: number): Date[] => {
  const days: Date[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();
  
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(year, month - 1, day));
  }
  
  return days;
};

export const getLastDayOfMonth = (month: number, year: number): Date => {
  return new Date(year, month, 0);
};

export const isDeadlinePassed = (deadline: string): boolean => {
  const deadlineDate = new Date(deadline);
  const now = new Date();
  return deadlineDate < now;
};