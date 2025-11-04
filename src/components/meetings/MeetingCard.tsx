import React from 'react';
import { Meeting } from '../../types';
import { formatTime } from '../../utils/dateUtils';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../common/Button';

interface MeetingCardProps {
  meeting: Meeting;
  onJoin: (meetingId: string) => void;
  onCancel: (meetingId: string) => void;
}

const MeetingCard: React.FC<MeetingCardProps> = ({ meeting, onJoin, onCancel }) => {
  const { user } = useAuth();
  const isCreator = user?.id === meeting.creator;
  const hasJoined = user ? meeting.participants.includes(user.id) : false;
  const isPast = new Date(meeting.date) < new Date();
  const formattedTime = formatTime(meeting.time);
  const participantCount = meeting.participants.length;
  const isAtCapacity = meeting.maxAttendees !== null && participantCount >= meeting.maxAttendees;
  
  return (
    <div className={`rounded-lg shadow-md p-6 ${isPast ? 'bg-gray-50 opacity-75' : 'bg-white'}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-800">{meeting.title}</h3>
          <p className="text-gray-600 mt-1">{meeting.location}</p>
        </div>
        
        <div className="flex flex-col items-end">
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
            meeting.isLunch ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
          }`}>
            {meeting.isLunch ? 'Lunch' : 'Dinner'}
          </div>
          
          {isCreator && (
            <div className="mt-1 px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Created by you
            </div>
          )}
        </div>
      </div>
      
      <div className="space-y-2 mb-4">
        <p className="text-gray-600">
          <span className="font-medium">Date:</span> {new Date(meeting.date).toLocaleDateString()}
        </p>
        
        <p className="text-gray-600">
          <span className="font-medium">Time:</span> {formattedTime}
        </p>
        
        <p className="text-gray-600">
          <span className="font-medium">Participants:</span> {participantCount}
          {meeting.maxAttendees !== null && ` / ${meeting.maxAttendees}`}
        </p>
        
        {meeting.contents && (
          <p className="text-gray-600">
            <span className="font-medium">Details:</span> {meeting.contents}
          </p>
        )}
      </div>
      
      <div className="flex justify-end">
        {!isPast && (
          hasJoined ? (
            <Button
              variant="danger"
              size="sm"
              onClick={() => onCancel(meeting.id)}
            >
              Cancel
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => onJoin(meeting.id)}
              disabled={isAtCapacity}
            >
              {isAtCapacity ? 'Full' : 'Join'}
            </Button>
          )
        )}
      </div>
    </div>
  );
};

export default MeetingCard;