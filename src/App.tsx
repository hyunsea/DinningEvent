import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import EventsPage from './pages/EventsPage';
import MyMeetingsPage from './pages/MyMeetingsPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/my-meetings" element={<MyMeetingsPage />} />
          <Route path="/" element={<Navigate to="/events" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;