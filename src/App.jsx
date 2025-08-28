import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Import des pages
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import ConferenceDetail from './pages/ConferenceDetail.jsx';
import Admin from './pages/Admin.jsx';
import UserManagement from './pages/UserManagement.jsx';
import PasswordChange from './pages/PasswordChange.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/conference/:id" element={<ConferenceDetail />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly={true}>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute adminOnly={true}>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/password-change"
            element={
              <ProtectedRoute adminOnly={false}>
                <PasswordChange />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
