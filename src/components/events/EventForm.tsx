import React, { useState } from 'react';
import { createEvent } from '../../services/api';
import Input from '../common/Input';
import Button from '../common/Button';
import { getLastDayOfMonth } from '../../utils/dateUtils';

interface EventFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const EventForm: React.FC<EventFormProps> = ({ onSuccess, onCancel }) => {
  const [name, setName] = useState('');
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [hasLunchBudget, setHasLunchBudget] = useState(false);
  const [lunchBudget, setLunchBudget] = useState<number | ''>('');
  const [hasDinnerBudget, setHasDinnerBudget] = useState(false);
  const [dinnerBudget, setDinnerBudget] = useState<number | ''>('');
  const [hasMaxAttendees, setHasMaxAttendees] = useState(false);
  const [maxAttendees, setMaxAttendees] = useState<number | ''>('');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineTime, setDeadlineTime] = useState('23:00');
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Generate month options
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  // Generate year options (current year and next 5 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear + i);
  
  // Update deadline when month or year changes
  React.useEffect(() => {
    const lastDay = getLastDayOfMonth(month, year);
    const formattedDate = lastDay.toISOString().split('T')[0];
    setDeadlineDate(formattedDate);
  }, [month, year]);
  
  const validate = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!name.trim()) {
      newErrors.name = 'Event name is required';
    }
    
    if (hasLunchBudget && (lunchBudget === '' || lunchBudget <= 0)) {
      newErrors.lunchBudget = 'Lunch budget must be a positive number';
    }
    
    if (hasDinnerBudget && (dinnerBudget === '' || dinnerBudget <= 0)) {
      newErrors.dinnerBudget = 'Dinner budget must be a positive number';
    }
    
    if (hasMaxAttendees && (maxAttendees === '' || maxAttendees <= 0 || !Number.isInteger(maxAttendees))) {
      newErrors.maxAttendees = 'Max attendees must be a positive integer';
    }
    
    if (!deadlineDate) {
      newErrors.deadlineDate = 'Deadline date is required';
    }
    
    if (!deadlineTime) {
      newErrors.deadlineTime = 'Deadline time is required';
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
      const deadline = `${deadlineDate}T${deadlineTime}:00Z`;
      
      await createEvent({
        name,
        month,
        year,
        lunchBudget: hasLunchBudget ? Number(lunchBudget) : null,
        dinnerBudget: hasDinnerBudget ? Number(dinnerBudget) : null,
        maxAttendees: hasMaxAttendees ? Number(maxAttendees) : null,
        deadline,
      });
      
      onSuccess();
    } catch (err) {
      console.error('Failed to create event:', err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Input
          id="name"
          type="text"
          label="Event Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter event name"
          fullWidth
          error={errors.name}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-1">
            Month
          </label>
          <select
            id="month"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2 px-3"
          >
            {months.map((name, index) => (
              <option key={index} value={index + 1}>
                {name}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
            Year
          </label>
          <select
            id="year"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="block w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2 px-3"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="hasLunchBudget"
              type="checkbox"
              checked={hasLunchBudget}
              onChange={(e) => setHasLunchBudget(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="hasLunchBudget" className="font-medium text-gray-700">
              Lunch Budget
            </label>
          </div>
        </div>
        
        {hasLunchBudget && (
          <Input
            id="lunchBudget"
            type="number"
            value={lunchBudget}
            onChange={(e) => setLunchBudget(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="Enter lunch budget (KRW)"
            fullWidth
            error={errors.lunchBudget}
          />
        )}
      </div>
      
      <div className="space-y-4">
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="hasDinnerBudget"
              type="checkbox"
              checked={hasDinnerBudget}
              onChange={(e) => setHasDinnerBudget(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="hasDinnerBudget" className="font-medium text-gray-700">
              Dinner Budget
            </label>
          </div>
        </div>
        
        {hasDinnerBudget && (
          <Input
            id="dinnerBudget"
            type="number"
            value={dinnerBudget}
            onChange={(e) => setDinnerBudget(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="Enter dinner budget (KRW)"
            fullWidth
            error={errors.dinnerBudget}
          />
        )}
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
              Maximum Attendees
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Input
            id="deadlineDate"
            type="date"
            label="Deadline Date"
            value={deadlineDate}
            onChange={(e) => setDeadlineDate(e.target.value)}
            fullWidth
            error={errors.deadlineDate}
          />
        </div>
        
        <div>
          <Input
            id="deadlineTime"
            type="time"
            label="Deadline Time"
            value={deadlineTime}
            onChange={(e) => setDeadlineTime(e.target.value)}
            fullWidth
            error={errors.deadlineTime}
          />
        </div>
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
          {isSubmitting ? 'Creating...' : 'Create Event'}
        </Button>
      </div>
    </form>
  );
};

export default EventForm;