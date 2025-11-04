import React, { useState, useEffect } from 'react';
import { Meeting, CalendarDay, Event } from '../../types';
import { getDaysInMonth, isWeekend, isPastDate, formatDate } from '../../utils/dateUtils';
import { getMeetingsByDate, getDisabledDates, toggleDateDisabled } from '../../services/api';
import Button from '../common/Button';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface CalendarProps {
  event: Event;
  onDaySelect: (day: CalendarDay) => void;
  onAddMeeting: (date: Date) => void;
}

const Calendar: React.FC<CalendarProps> = ({ event, onDaySelect, onAddMeeting }) => {
  const [days, setDays] = useState<CalendarDay[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [disabledDates, setDisabledDates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const isAdmin = user?.isAdmin || false;
  
  useEffect(() => {
    const fetchCalendarData = async () => {
      setIsLoading(true);
      try {
        // Get disabled dates set by admin
        const disabledDatesData = await getDisabledDates();
        setDisabledDates(disabledDatesData);
        
        // Get all days in the event's month
        const daysInMonth = getDaysInMonth(event.month, event.year);
        
        // Create calendar day objects
        const calendarDays: CalendarDay[] = await Promise.all(
          daysInMonth.map(async (date) => {
            const dateStr = formatDate(date);
            const isWeekendDay = isWeekend(date);
            const isPastDay = isPastDate(date);
            const isDisabledByAdmin = disabledDates.includes(dateStr);
            
            // Fetch meetings for this day
            let dayMeetings: Meeting[] = [];
            if (!isWeekendDay || isAdmin) {
              dayMeetings = await getMeetingsByDate(event.id, dateStr);
            }
            
            return {
              date,
              isWeekend: isWeekendDay,
              isPast: isPastDay,
              isDisabled: isDisabledByAdmin,
              meetings: dayMeetings
            };
          })
        );
        
        setDays(calendarDays);
      } catch (err) {
        console.error('Failed to load calendar data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCalendarData();
  }, [event, disabledDates, isAdmin]);
  
  const handleDayClick = (day: CalendarDay) => {
    if (isAdmin || (!day.isWeekend && !day.isPast && !day.isDisabled)) {
      setSelectedDate(day.date);
      onDaySelect(day);
    }
  };
  
  const handleAddMeeting = () => {
    if (selectedDate) {
      onAddMeeting(selectedDate);
    }
  };
  
  const handleToggleDate = async (day: CalendarDay) => {
    if (isAdmin) {
      const dateStr = formatDate(day.date);
      try {
        const updatedDisabledDates = await toggleDateDisabled(dateStr);
        setDisabledDates(updatedDisabledDates);
      } catch (err) {
        console.error('Failed to toggle date:', err);
      }
    }
  };
  
  const renderDayContent = (day: CalendarDay) => {
    const isSelected = selectedDate && day.date.getDate() === selectedDate.getDate();
    const meetingsCount = day.meetings.length;
    
    return (
      <div 
        className={`
          h-full w-full p-2 flex flex-col
          ${isSelected ? 'bg-blue-50 border-blue-500' : 'hover:bg-gray-50'}
          ${day.isWeekend ? 'bg-gray-100' : ''}
          ${day.isPast ? 'text-gray-400' : ''}
          ${day.isDisabled ? 'bg-red-50' : ''}
          ${!isAdmin && (day.isWeekend || day.isPast || day.isDisabled) ? 'cursor-not-allowed opacity-50' : ''}
        `}
      >
        <div className="flex justify-between items-center">
          <span className="font-medium">{day.date.getDate()}</span>
          {meetingsCount > 0 && (
            <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded-full">
              {meetingsCount}
            </span>
          )}
        </div>
        {isAdmin && (
          <button
            className={`mt-1 text-xs py-0.5 px-1 rounded ${
              day.isDisabled ? 'bg-red-200 text-red-800' : 'bg-gray-200 text-gray-800'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              handleToggleDate(day);
            }}
          >
            {day.isDisabled ? 'Enable' : 'Disable'}
          </button>
        )}
      </div>
    );
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Generate day headers (Mon, Tue, etc.)
  const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center">
          <CalendarIcon size={20} className="mr-2" />
          Calendar View
        </h3>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-7 border-b">
          {dayHeaders.map((day, index) => (
            <div 
              key={day} 
              className={`p-2 text-center text-sm font-medium ${
                index === 0 ? 'text-red-500' : index === 6 ? 'text-blue-500' : 'text-gray-700'
              }`}
            >
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {days.map((day, index) => (
            <div
              key={index}
              className={`h-24 bg-white border cursor-pointer transition-colors duration-200 ${
                selectedDate && day.date.getDate() === selectedDate.getDate() 
                  ? 'border-blue-500' 
                  : 'border-transparent'
              }`}
              onClick={() => handleDayClick(day)}
            >
              {renderDayContent(day)}
            </div>
          ))}
        </div>
      </div>
      
      {selectedDate && (
        <div className="flex justify-end">
          <Button
            variant="primary"
            onClick={handleAddMeeting}
            disabled={!selectedDate || (!isAdmin && (
              days.find(d => d.date.getDate() === selectedDate.getDate())?.isWeekend ||
              days.find(d => d.date.getDate() === selectedDate.getDate())?.isPast ||
              days.find(d => d.date.getDate() === selectedDate.getDate())?.isDisabled
            ))}
          >
            Add Meeting
          </Button>
        </div>
      )}
    </div>
  );
};

export default Calendar;