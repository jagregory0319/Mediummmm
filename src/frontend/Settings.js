// src/frontend/Settings.js
import React, { useState, useEffect } from 'react';
import {
  Button,
  Switch,
  Snackbar,
  FormControlLabel,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CircularProgress
} from '@mui/material';
import supabase from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import HomeIcon from '@mui/icons-material/Home';
import ExploreIcon from '@mui/icons-material/Explore';
import SettingsIcon from '@mui/icons-material/Settings';
const API = process.env.REACT_APP_API;

export default function Settings() {
  const [darkMode, setDarkMode]           = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(2);
  const [msg, setMsg]                     = useState('');
  const [topArtists, setTopArtists]       = useState([]);
  const [topTracks, setTopTracks]         = useState([]);
  const [loading, setLoading]             = useState(false);
  const navigate                          = useNavigate();

  // 1) On mount grab Spotify token
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const tok = params.get('access_token') || localStorage.getItem('spotify_token');
    if (tok) localStorage.setItem('spotify_token', tok);
  }, []);

  // 2) Fetch top 4 artists/tracks
  useEffect(() => {
    const token = localStorage.getItem('spotify_token');
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    setLoading(true);

    (async () => {
      try {
        // Top 4 Artists
        const aRes = await fetch(
          `${API}/top-artists?limit=4&time_range=medium_term`,
          { headers }
        );
        if (!aRes.ok) throw new Error('Could not fetch top artists');
        const { artists } = await aRes.json();
        setTopArtists(artists || []);

        // Top 4 Tracks
        const tRes = await fetch(
          `${API}/top-tracks?limit=4&time_range=medium_term`,
          { headers }
        );
        if (!tRes.ok) throw new Error('Could not fetch top tracks');
        const { tracks } = await tRes.json();
        setTopTracks(tracks || []);
      } catch (err) {
        console.error('Spotify API error', err);
        setMsg(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // handlers
  const handleDarkModeChange = e => setDarkMode(e.target.checked);
  const handleLogout         = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };
  const handleNavChange      = (_, v) => {
    setSelectedIndex(v);
    if (v === 0) navigate('/main');
    if (v === 1) navigate('/explore');
  };

  // Card hover style
  const cardSx = {
    transition: 'transform 0.2s, box-shadow 0.2s',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 8px 20px rgba(0,0,0,0.12)'
    }
  };

  return (
    <Box fontFamily="Poppins, sans-serif" pb={8}>
      {/* Header */}
      <Box px={2} py={3}>
        <Typography variant="h4" gutterBottom>Profile</Typography>
        <Box mt={2}>
          <Button variant="contained" onClick={handleLogout}>
            Logout
          </Button>
        </Box>
      </Box>

      {/* Top Artists */}
      <Box px={2} py={2}>
        <Typography variant="h6" gutterBottom>Top Artists</Typography>
        {loading && !topArtists.length ? (
          <CircularProgress size={24} />
        ) : topArtists.length ? (
          <Grid container spacing={2} justifyContent="center">
            {topArtists.map(a => (
              <Grid item key={a.id}>
                <Card sx={{ width: 160, ...cardSx }}>
                  {a.images?.[0]?.url && (
                    <CardMedia
                      component="img"
                      height="140"
                      image={a.images[0].url}
                      alt={a.name}
                    />
                  )}
                  <CardContent>
                    <Typography noWrap align="center">{a.name}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography color="textSecondary">
            No top artists. Ensure you’ve connected with <code>user-top-read</code>.
          </Typography>
        )}
      </Box>

      {/* Top Songs */}
      <Box px={2} py={2}>
        <Typography variant="h6" gutterBottom>Top Songs</Typography>
        {loading && !topTracks.length ? (
          <CircularProgress size={24} />
        ) : topTracks.length ? (
          <Grid container spacing={2} justifyContent="center">
            {topTracks.map(t => (
              <Grid item key={t.id}>
                <Card sx={{ width: 160, ...cardSx }}>
                  {t.album?.images?.[0]?.url && (
                    <CardMedia
                      component="img"
                      height="140"
                      image={t.album.images[0].url}
                      alt={t.name}
                    />
                  )}
                  <CardContent>
                    <Typography noWrap align="center">{t.name}</Typography>
                    <Typography variant="caption" color="textSecondary" noWrap align="center">
                      {t.artists.map(x => x.name).join(', ')}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography color="textSecondary">
            No top tracks. Make sure you’ve listened enough and granted scopes.
          </Typography>
        )}
      </Box>

      {/* Bottom Navigation */}
      <Box position="fixed" bottom={0} width="100%">
        <BottomNavigation value={selectedIndex} onChange={handleNavChange}>
          <BottomNavigationAction label="Home"    icon={<HomeIcon />} />
          <BottomNavigationAction label="Explore" icon={<ExploreIcon />} />
          <BottomNavigationAction label="Settings" icon={<SettingsIcon />} />
        </BottomNavigation>
      </Box>

      {/* Error/snackbar */}
      <Snackbar
        open={!!msg}
        autoHideDuration={3000}
        onClose={() => setMsg('')}
        message={msg}
      />
    </Box>
  );
}
