import React, { useState } from 'react';
import { Event } from '../../types';
import { createMeeting } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Input from '../common/Input';
import Button from '../common/Button';
import { formatDate } from '../../utils/dateUtils';

interface MeetingFormProps {
  event: Event;
  date: Date;
  onSuccess: () => void;
  onCancel: () => void;
}

const MeetingForm: React.FC<MeetingFormProps> = ({ event, date, onSuccess, onCancel }) => {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [isLunch, setIsLunch] = useState(false);
  const [time, setTime] = useState('18:00');
  const [hasMaxAttendees, setHasMaxAttendees] = useState(false);
  const [maxAttendees, setMaxAttendees] = useState<number | ''>('');
  const [contents, setContents] = useState('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { user } = useAuth();
  const isAdmin = user?.isAdmin || false;
  const [creator, setCreator] = useState(user?.id || '');
  
  // Mock list of users for admin selection
  const [users] = useState(['john', 'jane', 'bob', 'alice', 'charlie']);
  
  const validate = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!location.trim()) {
      newErrors.location = 'Location is required';
    }
    
    if (!time) {
      newErrors.time = 'Time is required';
    }
    
    if (hasMaxAttendees && (maxAttendees === '' || maxAttendees <= 0 || !Number.isInteger(maxAttendees))) {
      newErrors.maxAttendees = 'Max attendees must be a positive integer';
    }
    
    if (!creator) {
      newErrors.creator = 'Creator is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await createMeeting({
        eventId: event.id,
        title,
        location,
        isLunch,
        date: formatDate(date),
        time,
        maxAttendees: hasMaxAttendees ? Number(maxAttendees) : null,
        contents,
        creator,
        participants: [creator], // Creator automatically joins
      });
      
      onSuccess();
    } catch (err) {
      console.error('Failed to create meeting:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Input
          id="title"
          type="text"
          label="Meeting Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter meeting title"
          fullWidth
          error={errors.title}
        />
      </div>
      
      <div>
        <Input
          id="location"
          type="text"
          label="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Enter meeting location"
          fullWidth
          error={errors.location}
        />
      </div>
      
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            id="isLunch"
            type="checkbox"
            checked={isLunch}
            onChange={(e) => setIsLunch(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
        </div>
        <div className="ml-3 text-sm">
          <label htmlFor="isLunch" className="font-medium text-gray-700">
            This is a lunch meeting (unchecked = dinner)
          </label>
        </div>
      </div>
      
      <div>
        <Input
          id="time"
          type="time"
          label="Meeting Time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          fullWidth
          error={errors.time}
        />
      </div>
      
      <div className="space-y-4">
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="hasMaxAttendees"
              type="checkbox"
              checked={hasMaxAttendees}
              onChange={(e) => setHasMaxAttendees(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="hasMaxAttendees" className="font-medium text-gray-700">
              Limit number of attendees
            </label>
          </div>
        </div>
        
        {hasMaxAttendees && (
          <Input
            id="maxAttendees"
            type="number"
            value={maxAttendees}
            onChange={(e) => setMaxAttendees(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="Enter maximum number of attendees"
            fullWidth
            error={errors.maxAttendees}
          />
        )}
      </div>
      
      {isAdmin && (
        <div>
          <label htmlFor="creator" className="block text-sm font-medium text-gray-700 mb-1">
            Creator
          </label>
          <select
            id="creator"
            value={creator}
            onChange={(e) => setCreator(e.target.value)}
            className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2 px-3"
          >
            <option value="">Select Creator</option>
            {users.map((user) => (
              <option key={user} value={user}>
                {user}
              </option>
            ))}
          </select>
          {errors.creator && <p className="mt-1 text-sm text-red-600">{errors.creator}</p>}
        </div>
      )}
      
      <div>
        <label htmlFor="contents" className="block text-sm font-medium text-gray-700 mb-1">
          Details (Optional)
        </label>
        <textarea
          id="contents"
          value={contents}
          onChange={(e) => setContents(e.target.value)}
          rows={3}
          className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2 px-3"
          placeholder="Enter additional details about the meeting"
        />
      </div>
      
      <div className="flex justify-end space-x-3">
        <Button
          variant="outline"
          onClick={onCancel}
          type="button"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating...' : 'Create Meeting'}
        </Button>
      </div>
    </form>
  );
};

export default MeetingForm;