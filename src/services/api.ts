// In a real app, this would be connected to the FastAPI backend
// For now, we'll use mock data

import { Event, Meeting, User } from '../types';
import { isDeadlinePassed } from '../utils/dateUtils';

// Mock data
let events: Event[] = [
  {
    id: '1',
    name: 'July Team Dinner',
    month: 7,
    year: 2025,
    lunchBudget: null,
    dinnerBudget: 30000,
    maxAttendees: 10,
    deadline: '2025-07-31T23:00:00Z',
    active: true,
    visible: true,
    createdAt: '2025-07-01T09:00:00Z'
  },
  {
    id: '2',
    name: 'August Team Lunch',
    month: 8,
    year: 2025,
    lunchBudget: 20000,
    dinnerBudget: null,
    maxAttendees: null,
    deadline: '2025-08-31T23:00:00Z',
    active: true,
    visible: true,
    createdAt: '2025-08-01T09:00:00Z'
  },
  {
    id: '3',
    name: 'Past Event',
    month: 6,
    year: 2025,
    lunchBudget: 15000,
    dinnerBudget: 25000,
    maxAttendees: 8,
    deadline: '2025-06-30T23:00:00Z',
    active: false,
    visible: true,
    createdAt: '2025-06-01T09:00:00Z'
  }
];

let meetings: Meeting[] = [
  {
    id: '1',
    eventId: '1',
    title: 'AI Research Discussion',
    location: 'Korean BBQ Place',
    isLunch: false,
    date: '2025-07-15',
    time: '18:30',
    maxAttendees: 6,
    contents: 'Let\'s discuss recent AI papers over dinner',
    creator: 'john',
    participants: ['john', 'jane'],
    createdAt: '2025-07-10T10:00:00Z'
  },
  {
    id: '2',
    eventId: '2',
    title: 'Weekly Sync',
    location: 'Noodle House',
    isLunch: true,
    date: '2025-08-10',
    time: '12:00',
    maxAttendees: null,
    contents: 'Regular team sync over lunch',
    creator: 'bob',
    participants: ['bob', 'alice'],
    createdAt: '2025-08-05T11:00:00Z'
  }
];

// Disabled dates set by admin
let disabledDates: string[] = ['2025-07-20', '2025-08-15'];

// API functions
export const getEvents = async (): Promise<Event[]> => {
  // Update active status based on deadline
  events = events.map(event => ({
    ...event,
    active: !isDeadlinePassed(event.deadline)
  }));
  
  return events.filter(event => event.visible);
};

export const getEvent = async (id: string): Promise<Event | undefined> => {
  return events.find(event => event.id === id);
};

export const createEvent = async (eventData: Omit<Event, 'id' | 'active' | 'visible' | 'createdAt'>): Promise<Event> => {
  const newEvent: Event = {
    id: Date.now().toString(),
    ...eventData,
    active: true,
    visible: true,
    createdAt: new Date().toISOString()
  };
  
  events.push(newEvent);
  return newEvent;
};

export const updateEvent = async (id: string, eventData: Partial<Event>): Promise<Event> => {
  events = events.map(event => 
    event.id === id ? { ...event, ...eventData } : event
  );
  
  return events.find(event => event.id === id)!;
};

export const deleteEvent = async (id: string): Promise<void> => {
  events = events.map(event => 
    event.id === id ? { ...event, visible: false } : event
  );
};

export const getMeetingsByEvent = async (eventId: string): Promise<Meeting[]> => {
  return meetings.filter(meeting => meeting.eventId === eventId);
};

export const getMeetingsByDate = async (eventId: string, date: string): Promise<Meeting[]> => {
  return meetings.filter(meeting => meeting.eventId === eventId && meeting.date === date);
};

export const getMeetingsByUser = async (userId: string): Promise<Meeting[]> => {
  return meetings.filter(meeting => meeting.participants.includes(userId));
};

export const createMeeting = async (meetingData: Omit<Meeting, 'id' | 'createdAt'>): Promise<Meeting> => {
  const newMeeting: Meeting = {
    id: Date.now().toString(),
    ...meetingData,
    createdAt: new Date().toISOString()
  };
  
  meetings.push(newMeeting);
  return newMeeting;
};

export const joinMeeting = async (meetingId: string, userId: string): Promise<Meeting> => {
  meetings = meetings.map(meeting => {
    if (meeting.id === meetingId && !meeting.participants.includes(userId)) {
      return {
        ...meeting,
        participants: [...meeting.participants, userId]
      };
    }
    return meeting;
  });
  
  return meetings.find(meeting => meeting.id === meetingId)!;
};

export const leaveMeeting = async (meetingId: string, userId: string): Promise<Meeting> => {
  meetings = meetings.map(meeting => {
    if (meeting.id === meetingId) {
      return {
        ...meeting,
        participants: meeting.participants.filter(id => id !== userId)
      };
    }
    return meeting;
  });
  
  return meetings.find(meeting => meeting.id === meetingId)!;
};

export const getDisabledDates = async (): Promise<string[]> => {
  return disabledDates;
};

export const toggleDateDisabled = async (date: string): Promise<string[]> => {
  if (disabledDates.includes(date)) {
    disabledDates = disabledDates.filter(d => d !== date);
  } else {
    disabledDates.push(date);
  }
  
  return disabledDates;
};