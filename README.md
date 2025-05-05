# MediUMM

MediUMM is a music recommendation system that allows users to discover new tracks based on audio characteristics, user tastes, and AI-driven search. It integrates with multiple services including Supabase, for authentication and data storage, Spotify for login and track previews, Last.fm for similar-track recommendations, and an AI backend for natural language-based music search.

## Features

* **Spotify Integration**: OAuth-based login and track preview playback.
* **Explore Page**: Swipe interface for liking, disliking, or favoriting songs, storing preferences in Supabase.
* **Personalized Recommendations**: Generate recommendations based on recent likes using Last.fm's similar-track endpoint.
* **AI Search**: Natural language music search powered by an AI model (OpenAI) to list songs based on descriptive prompts.


## Table of Contents

* [Installation](#installation)
* [Configuration](#configuration)
* [Running the Application](#running-the-application)
* [Folder Structure](#folder-structure)
* [API Endpoints](#api-endpoints)
* [Frontend Pages](#frontend-pages)
* [Contribution](#contribution)
* [License](#license)
* [Contact](#contact)

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/josigregory/mediummmmm.git
   cd mediummmmm
   ```
2. Create and activate a virtual environment (Python 3.10+):

   ```bash
   python -m venv venv
   source venv/bin/activate  # on Windows use `venv\Scripts\activate`
   ```
3. Install backend dependencies:

   ```bash
   pip install -r requirements.txt
   ```
4. Install frontend dependencies:

   ```bash
   cd frontend
   npm install
   ```

## Configuration

Create a `.env` file in the root directory and add the following variables:

```
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Spotify
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret

# Last.fm
LASTFM_API_KEY=your_lastfm_api_key

# AI Backend (Ollama or OpenAI)
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
OPENAI_API_KEY=your_openai_key
```

## Running the Application

### Backend

```bash
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm start
```

## Folder Structure

```
mediummmmm/
├── main.py                # FastAPI backend entrypoint
├── supabaseClient.py      # Supabase client setup
├── requirements.txt       # Backend dependencies
├── frontend/              # React frontend app
│   ├── src/
│   │   ├── components/    # React components (ExplorePage, MainPage, AuthPage, etc.)
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
└── .env                   # Environment variables
```

## API Endpoints

| Method | Endpoint           | Description                                                  |
| ------ | ------------------ | ------------------------------------------------------------ |
| POST   | `/auth/signup`     | Signup new user via Supabase                                 |
| POST   | `/auth/login`      | Login user via Supabase                                      |
| POST   | `/ai-search`       | Perform AI-driven music search based on a descriptive prompt |
| GET    | `/explore-songs`   | Fetch songs for Explore Page                                 |
| POST   | `/taste`           | Record user taste (like/dislike/favorite) in Supabase        |
| GET    | `/recommendations` | Get personalized recommendations based on recent likes       |
| GET    | `/spotify/token`   | Retrieve Spotify OAuth token                                 |

## Frontend Pages

* **AuthPage**: Handles user login and signup.
* **ExplorePage**: Swipe interface to like/dislike/favorite songs.
* **MainPage**: Displays AI search bar and personalized recommendations.

## Contribution

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/YourFeature`
3. Commit your changes: `git commit -m 'Add YourFeature'`
4. Push to the branch: `git push origin feature/YourFeature`
5. Open a Pull Request

## Contact
Reach out at jag303@uakron.edu for any questions and to inquire about access to live link. 

