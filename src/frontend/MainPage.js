// src/frontend/MainPage.js
import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Button,
  TextField,
  Grid,
  Card,
  CardMedia,
  CardContent,
  BottomNavigation,
  BottomNavigationAction,
  Avatar,
  IconButton,
  Snackbar
} from '@mui/material'
import { Search, Explore, Person, Save as SaveIcon } from '@mui/icons-material'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

export default function MainPage() {
  const [q, setQ]                   = useState('')
  const [tracks, setTracks]         = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [msg, setMsg]               = useState('')
  const [saving, setSaving]         = useState(false)
  const [profile, setProfile]       = useState(null)
  const [tab, setTab]               = useState(0)
  const nav                         = useNavigate()

  // load Spotify profile & recommendations
  useEffect(() => {
    const p   = new URLSearchParams(window.location.hash.slice(1))
    const tok = p.get('access_token') || localStorage.getItem('spotify_token')
    if (!tok) return

    localStorage.setItem('spotify_token', tok)
    fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${tok}` }
    })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(user => {
        setProfile(user)
        return fetch('http://localhost:8000/recommendations', {
          headers: { Authorization: `Bearer ${tok}` }
        })
      })
      .then(r => r.ok ? r.json() : { recommendations: [] })
      .then(js => setRecommendations(js.recommendations || []))
      .catch(() => setMsg('Could not load recommendations'))
  }, [])

  const doSearch = async () => {
    if (!q.trim()) return
    const res = await fetch('http://localhost:8000/ai-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: q })
    })
    if (!res.ok) {
      setMsg('Search failed')
      return
    }
    const js = await res.json()
    setTracks(js.tracks || [])
  }

  const doSave = async id => {
    const tok = localStorage.getItem('spotify_token')
    if (!tok) {
      setMsg('Connect Spotify first')
      return
    }
    setSaving(true)
    const res = await fetch('http://localhost:8000/save-tracks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tok}`
      },
      body: JSON.stringify({ track_ids: [id] })
    })
    setSaving(false)
    setMsg(res.ok ? 'Saved to Spotify!' : `Error: ${await res.text()}`)
  }

  const handleNavChange = (_, newTab) => {
    setTab(newTab)
    if (newTab === 0) nav('/main')
    if (newTab === 1) nav('/explore')
    if (newTab === 2) nav('/settings')
  }

  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #F3E5F5 0%, #E8F5E9 100%)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Poppins, sans-serif'
      }}
    >
      {/* Top row */}
      <Box display="flex" alignItems="center" justifyContent="space-between" px={2} py={1}>
        <Box width={48} />
        <Typography
          variant="h2"
          sx={{
            fontWeight: 900,
            fontSize: { xs: '2.5rem', sm: '3rem', md: '4rem' },
            color: 'primary.main',
            lineHeight: 1
          }}
        >
          MediUMM
        </Typography>
        {profile ? (
          <IconButton onClick={() => {
            localStorage.removeItem('spotify_token')
            setProfile(null)
          }}>
            <Avatar src={profile.images?.[0]?.url} alt={profile.display_name || 'Spotify User'} />
          </IconButton>
        ) : (
          <Button
            variant="outlined"
            sx={{
              '&:hover': { backgroundColor: 'rgba(128,203,196,0.1)' }
            }}
            onClick={() => {
              const p = new URLSearchParams({
                client_id: 'c405f1798c6c4b7aab5f82af26556d64',
                response_type: 'token',
                redirect_uri: 'http://localhost:3000/main',
                scope: 'user-library-modify user-read-private user-top-read'
              })
              window.location.href = `https://accounts.spotify.com/authorize?${p}`
            }}
          >
            Connect Spotify
          </Button>
        )}
      </Box>

      {/* Search bar */}
      <Box px={2} py={1}>
        <Box display="flex">
          <TextField
            label="What kind of song?"
            fullWidth
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && doSearch()}
          />
          <motion.div whileTap={{ scale: 0.9 }}>
            <Button onClick={doSearch} variant="contained" sx={{ ml: 1 }}>
              <Search />
            </Button>
          </motion.div>
        </Box>
      </Box>

      {/* AI results */}
      <AnimatePresence>
        {tracks.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <Box px={2} py={1}>
              <Grid container spacing={2} justifyContent="center" sx={{ maxWidth: 1200, mx: 'auto' }}>
                {tracks.map((t, i) => (
                  <Grid item xs={10} sm={6} md={3} key={i}>
                    <motion.div
                      whileHover={{ scale: 1.03, boxShadow: '0px 8px 20px rgba(0,0,0,0.15)' }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      <Card elevation={2}>
                        {t.image && <CardMedia component="img" height="140" image={t.image} />}
                        <CardContent>
                          <Typography variant="subtitle1">{t.name}</Typography>
                          <Typography variant="body2" color="textSecondary">{t.artist}</Typography>
                          {t.preview && (
                            <audio controls src={t.preview} style={{ width: '100%', marginTop: 8 }} />
                          )}
                          <motion.div whileTap={{ scale: 0.9 }}>
                            <Button
                              startIcon={<SaveIcon />}
                              onClick={() => doSave(t.id)}
                              disabled={saving}
                              variant="outlined"
                              fullWidth
                              sx={{ mt: 1 }}
                            >
                              Save
                            </Button>
                          </motion.div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recommendations */}
      <AnimatePresence>
        {recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Box px={2} py={1}>
              <Typography variant="h6" textAlign="center" gutterBottom>
                Recommended for you
              </Typography>
              <Grid container spacing={2} justifyContent="center" sx={{ maxWidth: 1200, mx: 'auto' }}>
                {recommendations.map((r, i) => (
                  <Grid item xs={10} sm={6} md={3} key={i}>
                    <motion.div
                      whileHover={{ scale: 1.03, boxShadow: '0px 8px 20px rgba(0,0,0,0.15)' }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      <Card elevation={2}>
                        {r.artwork_url && <CardMedia component="img" height="140" image={r.artwork_url} />}
                        <CardContent>
                          <Typography variant="subtitle1">{r.title}</Typography>
                          <Typography variant="body2" color="textSecondary">{r.artist}</Typography>
                          {r.preview_url && (
                            <audio controls src={r.preview_url} style={{ width: '100%', marginTop: 8 }} />
                          )}
                          <motion.div whileTap={{ scale: 0.9 }}>
                            <Button
                              startIcon={<SaveIcon />}
                              onClick={() => doSave(r.id)}
                              disabled={saving || !r.id}
                              variant="outlined"
                              fullWidth
                              sx={{ mt: 1 }}
                            >
                              Save
                            </Button>
                          </motion.div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom navigation */}
      <Box mt="auto">
        <BottomNavigation value={tab} onChange={handleNavChange}>
          <BottomNavigationAction label="Home" icon={<Explore />} />
          <BottomNavigationAction label="Explore" icon={<Search />} />
          <BottomNavigationAction label="You" icon={<Person />} />
        </BottomNavigation>
      </Box>

      <Snackbar open={!!msg} autoHideDuration={3000} onClose={() => setMsg('')} message={msg} />
    </Box>
  )
}
