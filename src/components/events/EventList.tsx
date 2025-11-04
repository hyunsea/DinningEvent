import React, { useState, useEffect } from 'react';
import { Event } from '../../types';
import { getEvents, deleteEvent } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import EventCard from './EventCard';
import Modal from '../common/Modal';
import Button from '../common/Button';
import EventForm from './EventForm';
import { Plus } from 'lucide-react';

interface EventListProps {
  onEventSelect: (event: Event) => void;
}

const EventList: React.FC<EventListProps> = ({ onEventSelect }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteConfirmEvent, setDeleteConfirmEvent] = useState<Event | null>(null);
  const { user } = useAuth();
  
  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const fetchedEvents = await getEvents();
      setEvents(fetchedEvents);
      setError(null);
    } catch (err) {
      setError('Failed to load events');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchEvents();
  }, []);
  
  const handleEventClick = (event: Event) => {
    onEventSelect(event);
  };
  
  const handleCreateEvent = () => {
    setIsCreateModalOpen(true);
  };
  
  const handleDeleteClick = (event: Event, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmEvent(event);
  };
  
  const handleConfirmDelete = async () => {
    if (deleteConfirmEvent) {
      try {
        await deleteEvent(deleteConfirmEvent.id);
        fetchEvents();
      } catch (err) {
        setError('Failed to delete event');
        console.error(err);
      } finally {
        setDeleteConfirmEvent(null);
      }
    }
  };
  
  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
    fetchEvents();
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
        <h2 className="text-2xl font-bold text-gray-800">Available Events</h2>
        {user?.isAdmin && (
          <Button
            variant="primary"
            onClick={handleCreateEvent}
            className="flex items-center"
          >
            <Plus size={18} className="mr-1" />
            Create Event
          </Button>
        )}
      </div>
      
      {events.length === 0 ? (
        <div className="bg-gray-50 rounded-lg shadow-sm p-8 text-center">
          <p className="text-gray-600">No events available.</p>
          {user?.isAdmin && (
            <Button
              variant="outline"
              onClick={handleCreateEvent}
              className="mt-4"
            >
              Create your first event
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div key={event.id} className="relative">
              <EventCard event={event} onClick={handleEventClick} />
              {user?.isAdmin && (
                <button
                  className="absolute top-2 right-2 p-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
                  onClick={(e) => handleDeleteClick(event, e)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Create Event Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Event"
        size="lg"
      >
        <EventForm onSuccess={handleCreateSuccess} onCancel={() => setIsCreateModalOpen(false)} />
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmEvent !== null}
        onClose={() => setDeleteConfirmEvent(null)}
        title="Confirm Deletion"
        size="sm"
      >
        <div className="space-y-4">
          <p>Are you sure you want to delete "{deleteConfirmEvent?.name}"?</p>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmEvent(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDelete}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EventList;