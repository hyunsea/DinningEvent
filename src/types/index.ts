export interface User {
  id: string;
  name: string;
  isAdmin: boolean;
}

export interface Event {
  id: string;
  name: string;
  month: number;
  year: number;
  lunchBudget: number | null;
  dinnerBudget: number | null;
  maxAttendees: number | null;
  deadline: string;
  active: boolean;
  visible: boolean;
  createdAt: string;
}

export interface Meeting {
  id: string;
  eventId: string;
  title: string;
  location: string;
  isLunch: boolean;
  date: string;
  time: string;
  maxAttendees: number | null;
  contents: string;
  creator: string;
  participants: string[];
  createdAt: string;
}

export interface CalendarDay {
  date: Date;
  isWeekend: boolean;
  isPast: boolean;
  isDisabled: boolean;
  meetings: Meeting[];
}