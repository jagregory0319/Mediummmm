import os
import re
import base64
import requests
from random import shuffle, choice
from typing import List
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from supabase import create_client, Client as SupabaseClient
from fastapi import Depends


# ─── Load environment ──────────────────────────────────────────────────────────
load_dotenv()

LASTFM_API_KEY        = os.getenv("LASTFM_API_KEY")
SPOTIFY_CLIENT_ID     = os.getenv("SPOTIFY_CLIENT_ID")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")
SUPABASE_URL          = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY     = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_KEY  = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
OLLAMA_URL            = os.getenv("OLLAMA_URL", "http://localhost:11436")
OLLAMA_MODEL          = os.getenv("OLLAMA_MODEL", "gemma3:1b-it-qat")

for var, name in [
    (LASTFM_API_KEY,        "LASTFM_API_KEY"),
    (SPOTIFY_CLIENT_ID,     "SPOTIFY_CLIENT_ID"),
    (SPOTIFY_CLIENT_SECRET, "SPOTIFY_CLIENT_SECRET"),
    (SUPABASE_URL,          "SUPABASE_URL"),
    (SUPABASE_ANON_KEY,     "SUPABASE_ANON_KEY"),
    (SUPABASE_SERVICE_KEY,  "SUPABASE_SERVICE_ROLE_KEY"),
]:
    if not var:
        raise RuntimeError(f"Missing {name} in .env")

# ─── Supabase clients ─────────────────────────────────────────────────────────
supabase_db   = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
supabase_auth = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

# ─── FastAPI setup ────────────────────────────────────────────────────────────
app = FastAPI()

FRONTEND_ORIGINS = [
    "https://ollama-service-pxo3vw.fly.dev",                   
    "https://mediummmm.vercel.app",            
    "https://mediummmm.onrender.com",          
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# ─── Pydantic models ──────────────────────────────────────────────────────────

class Prompt(BaseModel):
    prompt: str

class SaveTracksPayload(BaseModel):
    track_ids: List[str]

class TastePayload(BaseModel):
    song_id: str
    title: str
    artist: str
    preview_url: str | None
    artwork_url: str | None
    genres: List[str] = []
    taste: str  # "like" or "dislike"

# ─── Helpers ─────────────────────────────────────────────────────────────────

def get_spotify_token() -> str:
    creds = base64.b64encode(f"{SPOTIFY_CLIENT_ID}:{SPOTIFY_CLIENT_SECRET}".encode()).decode()
    r = requests.post(
        "https://accounts.spotify.com/api/token",
        headers={"Authorization": f"Basic {creds}"},
        data={"grant_type": "client_credentials"}
    )
    if not r.ok:
        raise HTTPException(500, "Failed to fetch Spotify token")
    return r.json()["access_token"]

def get_spotify_token_header(authorization: str = Header(None)) -> str:
    if not authorization:
        raise HTTPException(401, "Missing Spotify Authorization header")
    scheme, token = authorization.split(" ", 1)
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(401, "Invalid Authorization header")
    return token

def get_user_spotify_token(
    authorization: str = Header(None)
) -> str:
    if not authorization:
        raise HTTPException(401, "Missing Authorization header")
    parts = authorization.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(401, "Invalid Authorization header")
    return parts[1]

# ─── Endpoints ────────────────────────────────────────────────────────────────

@app.post("/ai-search")
def ai_search(req: Prompt):
    system_prompt = (
        "You are a music recommender. List at least 10 songs in plain text, "
        "each on its own line, in the format: Song Title by Artist Name. "
        "No numbering or extra commentary."
    )
    r = requests.post(
        f"{OLLAMA_URL.rstrip('/')}/v1/chat/completions",
        json={"model": OLLAMA_MODEL, "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": req.prompt}
        ]},
        headers={"Content-Type": "application/json"}
    )
    if r.status_code != 200:
        raise HTTPException(502, f"Ollama error {r.status_code}: {r.text}")
    content = r.json()["choices"][0]["message"]["content"]
    lines = [l.strip() for l in content.splitlines() if l.strip()]

    token = get_spotify_token()
    out = []
    for line in lines[:10]:
        m = re.match(r"(.+?)\s*(?:by|-)\s*(.+)", line, flags=re.IGNORECASE)
        if not m:
            continue
        name, artist = m.group(1).strip(), m.group(2).strip()
        search = requests.get(
            "https://api.spotify.com/v1/search",
            headers={"Authorization": f"Bearer {token}"},
            params={"q": f'track:"{name}" artist:"{artist}"', "type": "track", "limit": 1}
        )
        items = search.json().get("tracks", {}).get("items", []) if search.ok else []
        if items:
            t = items[0]
            out.append({
                "id":      t["id"],
                "name":    t["name"],
                "artist":  t["artists"][0]["name"],
                "preview": t["preview_url"],
                "image":   t["album"]["images"][0]["url"]
            })
    return {"tracks": out}


@app.get("/explore-songs")
def explore_songs():
    GENRES = [
        "rock","pop","hip-hop","electronic","jazz","classical","metal","indie","funk",
        "soul","disco","country","techno","trance","house","dubstep","ambient","folk",
        "reggae","punk","blues","k-pop","latin","r&b","lo-fi","trap","instrumental",
        "gospel","garage","idm","new wave","emo","ska","hardcore","experimental"
    ]
    shuffle(GENRES)
    token = get_spotify_token()
    output = []

    for tag in GENRES:
        if len(output) >= 50:
            break
        lf = requests.get(
            "http://ws.audioscrobbler.com/2.0/",
            params={
                "method": "tag.gettoptracks",
                "tag":     tag,
                "api_key": LASTFM_API_KEY,
                "format":  "json",
                "limit":   50
            }
        )
        tracks = lf.json().get("tracks", {}).get("track", []) if lf.ok else []
        shuffle(tracks)

        for t in tracks:
            name, artist = t.get("name"), t.get("artist", {}).get("name")
            if not name or not artist:
                continue

            # Spotify lookup just for artwork and id
            sp_res = requests.get(
                "https://api.spotify.com/v1/search",
                headers={"Authorization": f"Bearer {token}"},
                params={"q": f'track:"{name}" artist:"{artist}"', "type": "track", "limit": 1}
            )
            items = sp_res.json().get("tracks", {}).get("items", []) if sp_res.ok else []
            if not items:
                continue
            sp = items[0]

            # DEEZER preview only
            preview_url = None
            dz = requests.get(
                "https://api.deezer.com/search",
                params={"q": f"{name} {artist}"}
            )
            if dz.ok:
                for itm in dz.json().get("data", []):
                    if itm.get("preview"):
                        preview_url = itm["preview"]
                        break

            output.append({
                "id":          sp["id"],
                "title":       sp["name"],
                "artist":      sp["artists"][0]["name"],
                "preview_url": preview_url,                # only Deezer
                "artwork_url": sp["album"]["images"][0]["url"],
                "genres":      []
            })

            if len(output) >= 50:
                break

    return {"tracks": output}


@app.post("/save-tracks")
def save_tracks(payload: SaveTracksPayload, authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(401, "Please log in to Spotify to save tracks.")
    token = authorization.split(" ", 1)[1]
    valid_ids = [tid for tid in payload.track_ids if isinstance(tid, str) and tid]
    if not valid_ids:
        raise HTTPException(400, "No valid Spotify IDs provided.")
    resp = requests.put(
        "https://api.spotify.com/v1/me/tracks",
        headers={"Authorization": f"Bearer {token}"},
        params={"ids": ",".join(valid_ids)}
    )
    if resp.status_code == 401:
        raise HTTPException(401, "Spotify token invalid or expired")
    if not resp.ok:
        raise HTTPException(502, f"Spotify API error: {resp.status_code}")
    return {"status": "ok"}


@app.post("/taste")
def record_taste(payload: TastePayload, authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(401, "Missing Authorization header")
    token = authorization.split(" ", 1)[1]
    user_resp = supabase_auth.auth.get_user(token)
    if user_resp.error:
        raise HTTPException(401, "Invalid Supabase session")
    user_id = user_resp.user.id

    res = supabase_db.from_("user_taste").insert({
        "user_id":     user_id,
        "song_id":     payload.song_id,
        "title":       payload.title,
        "artist":      payload.artist,
        "preview_url": payload.preview_url,
        "artwork_url": payload.artwork_url,
        "genres":      payload.genres,
        "taste":       payload.taste
    }).execute()
    if res.error:
        raise HTTPException(500, res.error.message)
    return {"status": "ok"}


@app.get("/recommendations")
def get_recommendations():
    TAGS = [
        "rock","pop","hip-hop","electronic","jazz","classical","metal","indie","funk",
        "soul","disco","country","techno","trance","house","dubstep","ambient","folk",
        "reggae","punk","blues","k-pop","latin","r&b","lo-fi","trap","instrumental",
        "gospel","garage","idm","new wave","emo","ska","hardcore","experimental"
    ]
    tag = choice(TAGS)
    resp = requests.get(
        "http://ws.audioscrobbler.com/2.0/",
        params={"method": "tag.gettoptracks", "tag": tag, "api_key": LASTFM_API_KEY, "format": "json", "limit": 50}
    )
    if not resp.ok:
        raise HTTPException(502, "Last.fm error")

    lastfm = resp.json().get("tracks", {}).get("track", [])
    shuffle(lastfm)
    token = get_spotify_token()
    recs = []

    for t in lastfm:
        if len(recs) >= 10:
            break
        name, artist = t.get("name"), t.get("artist", {}).get("name")
        if not name or not artist:
            continue
        search = requests.get(
            "https://api.spotify.com/v1/search",
            headers={"Authorization": f"Bearer {token}"},
            params={"q": f'track:"{name}" artist:"{artist}"', "type": "track", "limit": 1}
        )
        if not search.ok:
            continue
        items = search.json().get("tracks", {}).get("items", [])
        if not items:
            continue
        sp = items[0]
        recs.append({
            "id":           sp["id"],
            "title":        sp["name"],
            "artist":       sp["artists"][0]["name"],
            "preview_url":  sp.get("preview_url"),
            "artwork_url":  sp["album"]["images"][0]["url"] if sp["album"]["images"] else None
        })

    return {"tag": tag, "recommendations": recs}


@app.get("/top-artists")
def top_artists(
    limit: int = 5,
    time_range: str = "medium_term",
    token: str = Depends(get_user_spotify_token)
):
    """Fetch current user’s top artists from Spotify."""
    resp = requests.get(
        "https://api.spotify.com/v1/me/top/artists",
        params={"limit": limit, "time_range": time_range},
        headers={"Authorization": f"Bearer {token}"}
    )
    if resp.status_code == 403:
        raise HTTPException(403, "Missing user-top-read scope")
    if not resp.ok:
        raise HTTPException(resp.status_code, "Spotify error fetching top artists")
    return {"artists": resp.json().get("items", [])}

@app.get("/top-tracks")
def top_tracks(
    limit: int = 5,
    time_range: str = "medium_term",
    token: str = Depends(get_user_spotify_token)
):
    """Fetch current user’s top tracks from Spotify."""
    resp = requests.get(
        "https://api.spotify.com/v1/me/top/tracks",
        params={"limit": limit, "time_range": time_range},
        headers={"Authorization": f"Bearer {token}"}
    )
    if resp.status_code == 403:
        raise HTTPException(403, "Missing user-top-read scope")
    if not resp.ok:
        raise HTTPException(resp.status_code, "Spotify error fetching top tracks")
    return {"tracks": resp.json().get("items", [])}
