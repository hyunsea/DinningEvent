import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Event } from '../types';
import EventList from '../components/events/EventList';
import MeetingList from '../components/meetings/MeetingList';
import Modal from '../components/common/Modal';
import { Utensils, Calendar, LogOut, KeyRound } from 'lucide-react';
import Button from '../components/common/Button';
import ResetPasswordForm from '../components/auth/ResetPasswordForm';

const EventsPage: React.FC = () => {
  const { user, isLoading, logout } = useAuth();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  const handleEventSelect = (event: Event) => {
    setSelectedEvent(event);
  };
  
  const handleCloseModal = () => {
    setSelectedEvent(null);
  };
  
  const handleLogout = () => {
    logout();
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Utensils className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">Lab Dining Events</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {}}
              className="flex items-center"
            >
              <Calendar size={16} className="mr-1" />
              My Meetings
            </Button>
            
            <div className="flex items-center space-x-3">
              <span className="text-gray-700">Hello, {user.name}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsResetPasswordOpen(true)}
                className="flex items-center"
              >
                <KeyRound size={16} className="mr-1" />
                Reset Password
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center"
              >
                <LogOut size={16} className="mr-1" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EventList onEventSelect={handleEventSelect} />
      </main>
      
      <Modal
        isOpen={selectedEvent !== null}
        onClose={handleCloseModal}
        size="xl"
      >
        {selectedEvent && (
          <MeetingList
            event={selectedEvent}
            onClose={handleCloseModal}
          />
        )}
      </Modal>

      <Modal
        isOpen={isResetPasswordOpen}
        onClose={() => setIsResetPasswordOpen(false)}
        size="md"
      >
        <ResetPasswordForm onClose={() => setIsResetPasswordOpen(false)} />
      </Modal>
    </div>
  );
};

export default EventsPage;