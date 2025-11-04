import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Meeting } from '../types';
import { getMeetingsByUser, joinMeeting, leaveMeeting } from '../services/api';
import MeetingCard from '../components/meetings/MeetingCard';
import { Utensils, Calendar } from 'lucide-react';
import Button from '../components/common/Button';

const MyMeetingsPage: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchMyMeetings = async () => {
      if (!user) return;
      
      setIsPageLoading(true);
      try {
        const fetchedMeetings = await getMeetingsByUser(user.id);
        setMeetings(fetchedMeetings);
        setError(null);
      } catch (err) {
        setError('Failed to load your meetings');
        console.error(err);
      } finally {
        setIsPageLoading(false);
      }
    };
    
    if (user && !isLoading) {
      fetchMyMeetings();
    }
  }, [user, isLoading]);
  
  const handleJoinMeeting = async (meetingId: string) => {
    if (!user) return;
    
    try {
      await joinMeeting(meetingId, user.id);
      const updatedMeetings = await getMeetingsByUser(user.id);
      setMeetings(updatedMeetings);
    } catch (err) {
      console.error('Failed to join meeting:', err);
    }
  };
  
  const handleCancelMeeting = async (meetingId: string) => {
    if (!user) return;
    
    try {
      await leaveMeeting(meetingId, user.id);
      const updatedMeetings = await getMeetingsByUser(user.id);
      setMeetings(updatedMeetings);
    } catch (err) {
      console.error('Failed to leave meeting:', err);
    }
  };
  
  if (isLoading || isPageLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Sort meetings by date (upcoming first)
  const sortedMeetings = [...meetings].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA.getTime() - dateB.getTime();
  });
  
  // Split into upcoming and past meetings
  const now = new Date();
  const upcomingMeetings = sortedMeetings.filter(meeting => new Date(meeting.date) >= now);
  const pastMeetings = sortedMeetings.filter(meeting => new Date(meeting.date) < now);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Utensils className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">My Meetings</h1>
          </div>
          
          <div className="flex items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/events'}
              className="flex items-center"
            >
              <Calendar size={16} className="mr-1" />
              Back to Events
            </Button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}
        
        <div className="space-y-8">
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Upcoming Meetings</h2>
            
            {upcomingMeetings.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                <p className="text-gray-600">You haven't joined any upcoming meetings.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingMeetings.map(meeting => (
                  <MeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    onJoin={handleJoinMeeting}
                    onCancel={handleCancelMeeting}
                  />
                ))}
              </div>
            )}
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Past Meetings</h2>
            
            {pastMeetings.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                <p className="text-gray-600">You haven't participated in any past meetings.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pastMeetings.map(meeting => (
                  <MeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    onJoin={handleJoinMeeting}
                    onCancel={handleCancelMeeting}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default MyMeetingsPage;