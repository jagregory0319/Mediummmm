// src/components/AuthPage.js
import React, { useState } from 'react';
import Login from './Login';
import Signup from './Signup';
import { Container, Card, Typography, Button, Box } from '@mui/material';
import supabase from '../supabaseClient';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  const toggleForm = () => {
    setIsLogin((prev) => !prev);
  };

  return (
    <Container maxWidth="xs" sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <Card sx={{ p: 4, width: "100%", textAlign: "center", boxShadow: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          MediUMMMM
        </Typography>
        {isLogin ? <Login /> : <Signup />}
        <Box mt={2}>
          <Button onClick={toggleForm} variant="text" color="primary">
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
          </Button>
        </Box>
      </Card>
    </Container>
  );
};

export default AuthPage;
