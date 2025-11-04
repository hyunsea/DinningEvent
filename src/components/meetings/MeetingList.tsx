import React, { useState, useEffect } from 'react';
import { Event, Meeting, CalendarDay } from '../../types';
import { getMeetingsByEvent, joinMeeting, leaveMeeting } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Calendar from './Calendar';
import MeetingCard from './MeetingCard';
import MeetingForm from './MeetingForm';
import { formatDate } from '../../utils/dateUtils';
import { Calendar as CalendarIcon, Grid as GridIcon } from 'lucide-react';

interface MeetingListProps {
  event: Event;
  onClose: () => void;
}

type ViewMode = 'calendar' | 'list';

const MeetingList: React.FC<MeetingListProps> = ({ event, onClose }) => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const { user } = useAuth();
  
  const fetchMeetings = async () => {
    setIsLoading(true);
    try {
      const fetchedMeetings = await getMeetingsByEvent(event.id);
      setMeetings(fetchedMeetings);
      setError(null);
    } catch (err) {
      setError('Failed to load meetings');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchMeetings();
  }, [event.id]);
  
  const handleDaySelect = (day: CalendarDay) => {
    setSelectedDay(day);
  };
  
  const handleAddMeeting = (date: Date) => {
    setSelectedDate(date);
    setIsCreateModalOpen(true);
  };
  
  const handleJoinMeeting = async (meetingId: string) => {
    if (!user) return;
    
    try {
      await joinMeeting(meetingId, user.id);
      fetchMeetings();
    } catch (err) {
      console.error('Failed to join meeting:', err);
    }
  };
  
  const handleCancelMeeting = async (meetingId: string) => {
    if (!user) return;
    
    try {
      await leaveMeeting(meetingId, user.id);
      fetchMeetings();
    } catch (err) {
      console.error('Failed to leave meeting:', err);
    }
  };
  
  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    fetchMeetings();
  };
  
  const getDayMeetings = (): Meeting[] => {
    if (!selectedDay) return [];
    return selectedDay.meetings;
  };
  
  const renderCalendarView = () => {
    const dayMeetings = getDayMeetings();
    const selectedDateFormatted = selectedDay ? formatDate(selectedDay.date) : '';
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Calendar
            event={event}
            onDaySelect={handleDaySelect}
            onAddMeeting={handleAddMeeting}
          />
        </div>
        
        <div className="space-y-4">
          {selectedDay && (
            <>
              <h3 className="text-lg font-semibold">
                Meetings on {new Date(selectedDateFormatted).toLocaleDateString()}
              </h3>
              
              {dayMeetings.length === 0 ? (
                <p className="text-gray-600">
                  No meetings scheduled for this day.
                </p>
              ) : (
                <div className="space-y-4">
                  {dayMeetings.map((meeting) => (
                    <MeetingCard
                      key={meeting.id}
                      meeting={meeting}
                      onJoin={handleJoinMeeting}
                      onCancel={handleCancelMeeting}
                    />
                  ))}
                </div>
              )}
              
              <Button
                variant="primary"
                onClick={() => handleAddMeeting(selectedDay.date)}
                disabled={!event.active || (!user?.isAdmin && (selectedDay.isWeekend || selectedDay.isPast || selectedDay.isDisabled))}
                className="mt-4"
              >
                Add Meeting
              </Button>
            </>
          )}
        </div>
      </div>
    );
  };
  
  const renderListView = () => {
    const sortedMeetings = [...meetings].sort((a, b) => {
      // First by date
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      // Then by lunch/dinner
      if (a.isLunch !== b.isLunch) {
        return a.isLunch ? -1 : 1;
      }
      // Finally by creation date
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedMeetings.length === 0 ? (
            <div className="col-span-full text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-600">No meetings available for this event.</p>
            </div>
          ) : (
            sortedMeetings.map((meeting) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                onJoin={handleJoinMeeting}
                onCancel={handleCancelMeeting}
              />
            ))
          )}
        </div>
      </div>
    );
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
        <strong className="font-bold">Error:</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">{event.name}</h2>
        
        <div className="flex space-x-2">
          <Button
            variant={viewMode === 'calendar' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('calendar')}
            className="flex items-center"
          >
            <CalendarIcon size={16} className="mr-1" />
            Calendar
          </Button>
          <Button
            variant={viewMode === 'list' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="flex items-center"
          >
            <GridIcon size={16} className="mr-1" />
            List
          </Button>
        </div>
      </div>
      
      {viewMode === 'calendar' ? renderCalendarView() : renderListView()}
      
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Meeting"
        size="lg"
      >
        {selectedDate && (
          <MeetingForm
            event={event}
            date={selectedDate}
            onSuccess={handleCreateSuccess}
            onCancel={() => setIsCreateModalOpen(false)}
          />
        )}
      </Modal>
    </div>
  );
};

export default MeetingList;