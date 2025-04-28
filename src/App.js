// src/App.js
import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css'; // Assuming you have a separate CSS file
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './frontend/Login';
import Signup from './frontend/Signup';
import MainPage from './frontend/MainPage';
import Settings from './frontend/Settings';
import AuthPage from './frontend/AuthPage';
import ExplorePage from './frontend/ExplorePage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthPage />} />
        <Route path="/Login" element={<Login />} />
        <Route path="/Signup" element={<Signup />} />
        <Route path="/main" element={<MainPage />} />
        <Route path="/settings" element={<Settings />} />
        <Route path='/explore' element={<ExplorePage />} />
        {/* Add other routes here */}
      </Routes>
    </Router>
  );
}


export default App;