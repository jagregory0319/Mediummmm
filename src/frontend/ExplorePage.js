// src/frontend/ExplorePage.js
import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import supabase from '../supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Box,
  Button,
  BottomNavigation,
  BottomNavigationAction,
  Snackbar,
  Card,
  CardMedia,
  CardContent,
  Typography,
  CircularProgress
} from '@mui/material'
import {
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Star as StarIcon,
  Home as HomeIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Save as SaveIcon
} from '@mui/icons-material'
const API = process.env.REACT_APP_API;

export default function ExplorePage() {
  const navigate     = useNavigate()
  const location     = useLocation()
  const spotifyToken = localStorage.getItem('spotify_token')

  const [tracks, setTracks]   = useState([])
  const [idx, setIdx]         = useState(0)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg]         = useState('')

  useEffect(() => {
    setTracks([])
    setIdx(0)
    loadTracks()
  }, [])

  async function loadTracks() {
    setLoading(true)
    const res = await fetch(`${API}/explore-songs`)
    const data = await res.json()
    setTracks(prev => [...prev, ...(data.tracks || [])])
    setLoading(false)
  }

  async function recordTaste(track, taste) {
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()
    if (userError || !user) {
      setMsg('Please sign into Supabase to record your taste')
      return
    }

    const { error } = await supabase
      .from('user_taste')
      .insert({
        user_id:     user.id,
        song_id:     track.id,
        title:       track.title,
        artist:      track.artist,
        preview_url: track.preview_url,
        artwork_url: track.artwork_url,
        genres:      track.genres,
        taste
      })

    if (error) {
      console.error(error)
      setMsg('Could not record taste')
    }
  }

  async function doSave(id) {
    if (!spotifyToken) {
      setMsg('Log in to Spotify to save')
      return
    }
    const res = await fetch(`${API}/save-tracks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${spotifyToken}`
      },
      body: JSON.stringify({ track_ids: [id] })
    })
    setMsg(res.ok ? 'Saved to Spotify!' : `Error: ${await res.text()}`)
  }

  async function handleAction(taste) {
    const track = tracks[idx]
    await recordTaste(track, taste)
    const next = idx + 1
    if (next >= tracks.length - 5 && !loading) {
      loadTracks()
    }
    setIdx(next)
  }

  const track = tracks[idx]

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Poppins, sans-serif',
        background: '#FAFAFA'
      }}
    >
      {/* Floating Title */}
      <Box
        sx={{
          position: 'fixed',
          top: 16,
          width: '100%',
          textAlign: 'center',
          zIndex: 10
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'black' }}>
          Explore
        </Typography>
      </Box>

      {/* Centered Content */}
      <Box
        flex="1"
        display="flex"
        justifyContent="center"
        alignItems="center"
        px={2}
        pt={8}  /* leave space for fixed title */
      >
        {loading ? (
          <CircularProgress size={48} />
        ) : !track ? (
          <Typography align="center">No more songs</Typography>
        ) : (
          <AnimatePresence>
            <motion.div
              key={track.id}
              initial={{ opacity: 0, scale: 0.8, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -40 }}
              whileHover={{ scale: 1.03, boxShadow: '0px 15px 30px rgba(0,0,0,0.2)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <Card sx={{ maxWidth: 400 }}>
                <CardMedia component="img" height="240" image={track.artwork_url} />
                <CardContent>
                  <Typography variant="h6">{track.title}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {track.artist}
                  </Typography>
                  {track.preview_url ? (
                    <Box mt={1}>
                      <audio controls src={track.preview_url} style={{ width: '100%' }} />
                    </Box>
                  ) : (
                    <Typography color="textSecondary" sx={{ mt: 1 }}>
                      No preview available
                    </Typography>
                  )}
                  <Box display="flex" justifyContent="space-between" mt={2}>
                    <motion.div whileTap={{ scale: 0.9 }}>
                      <Button size="small" onClick={() => handleAction('dislike')}>
                        <ThumbDownIcon fontSize="small" />
                      </Button>
                    </motion.div>
                    <motion.div whileTap={{ scale: 0.9 }}>
                      <Button size="small" onClick={() => handleAction('favorite')}>
                        <StarIcon fontSize="small" />
                      </Button>
                    </motion.div>
                    <motion.div whileTap={{ scale: 0.9 }}>
                      <Button size="small" onClick={() => handleAction('like')}>
                        <ThumbUpIcon fontSize="small" />
                      </Button>
                    </motion.div>
                    <motion.div whileTap={{ scale: 0.9 }}>
                      <Button size="small" onClick={() => doSave(track.id)}>
                        <SaveIcon fontSize="small" />
                      </Button>
                    </motion.div>
                  </Box>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        )}
      </Box>

      <Snackbar open={!!msg} autoHideDuration={2000} onClose={() => setMsg('')} message={msg} />

      {/* Bottom Navigation */}
      <Box sx={{ position: 'fixed', bottom: 0, width: '100%' }}>
        <BottomNavigation
          value={location.pathname}
          onChange={(_, v) => navigate(v)}
        >
          <BottomNavigationAction label="Home" icon={<HomeIcon />} value="/main" />
          <BottomNavigationAction label="Explore" icon={<SearchIcon />} value="/explore" />
          <BottomNavigationAction label="Profile" icon={<PersonIcon />} value="/settings" />
        </BottomNavigation>
      </Box>
    </Box>
  )
}
