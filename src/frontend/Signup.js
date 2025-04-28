// src/components/Signup.js
import React, { useState } from 'react';
import supabase from '../supabaseClient';
import { TextField, Button, Typography, Box } from '@mui/material';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleSignup = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message);
    } else {
      alert('Sign up successful');
    }
  };

  return (
    <Box component="form" onSubmit={handleSignup} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <TextField label="Email" type="email" fullWidth required value={email} onChange={(e) => setEmail(e.target.value)} />
      <TextField label="Password" type="password" fullWidth required value={password} onChange={(e) => setPassword(e.target.value)} />
      {error && <Typography color="error">{error}</Typography>}
      <Button type="submit" variant="contained" color="primary" fullWidth>
        Sign Up
      </Button>
    </Box>
  );
};

export default Signup;
