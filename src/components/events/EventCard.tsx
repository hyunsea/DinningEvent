import React from 'react';
import { Event } from '../../types';
import { getMonthName, isDeadlinePassed } from '../../utils/dateUtils';

interface EventCardProps {
  event: Event;
  onClick: (event: Event) => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onClick }) => {
  const isActive = event.active;
  const monthName = getMonthName(event.month);
  
  return (
    <div 
      className={`rounded-lg shadow-md p-6 cursor-pointer transform transition-all duration-200 hover:shadow-lg ${
        isActive ? 'bg-white hover:translate-y-[-4px]' : 'bg-gray-100 opacity-75'
      }`}
      onClick={() => onClick(event)}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className={`text-xl font-semibold ${isActive ? 'text-gray-800' : 'text-gray-600'}`}>
          {event.name}
        </h3>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'
        }`}>
          {isActive ? 'Active' : 'Inactive'}
        </div>
      </div>
      
      <div className="space-y-2">
        <p className="text-gray-600">
          <span className="font-medium">Month:</span> {monthName} {event.year}
        </p>
        
        {event.lunchBudget !== null && (
          <p className="text-gray-600">
            <span className="font-medium">Lunch Budget:</span> ₩{event.lunchBudget.toLocaleString()}
          </p>
        )}
        
        {event.dinnerBudget !== null && (
          <p className="text-gray-600">
            <span className="font-medium">Dinner Budget:</span> ₩{event.dinnerBudget.toLocaleString()}
          </p>
        )}
        
        {event.maxAttendees !== null && (
          <p className="text-gray-600">
            <span className="font-medium">Max Attendees:</span> {event.maxAttendees}
          </p>
        )}
        
        <p className="text-gray-600">
          <span className="font-medium">Deadline:</span> {new Date(event.deadline).toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default EventCard;