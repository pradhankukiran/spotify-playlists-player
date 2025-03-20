# Spotify Playlists Player

A React application for playing Spotify playlists using the Spotify Web API and Web Playback SDK.

## Features

- Spotify authentication using PKCE flow
- Playlist browsing and selection
- Web-based playback using Spotify Web Playback SDK
- Responsive design with Tailwind CSS

## Setup for Development

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file based on `.env.example`:
   ```
   VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id_here
   VITE_REDIRECT_URI=http://localhost:4173
   ```
4. Register your app in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
5. Add the following redirect URIs to your Spotify App settings:
   - `http://localhost:4173/callback` (for local development)
   - `https://spotify-playlists-player.vercel.app/callback` (for production)
6. Start the development server:
   ```
   npm run dev
   ```

## Deployment to Vercel

The application is configured to work with Vercel deployment out of the box, using the dynamic redirect URI utility.

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add the following environment variables in the Vercel project settings:
   - `VITE_SPOTIFY_CLIENT_ID` (your Spotify Client ID)
   - `VITE_REDIRECT_URI` (use the value `http://localhost:4173` - this will only be used for local development)
4. Deploy the application

## Technical Details

- Built with React, TypeScript, and Vite
- Uses Spotify Web API TS SDK for authentication and data fetching
- Implements Spotify Web Playback SDK for in-browser playback
- Styled with Tailwind CSS
- Automatically detects the environment (local vs production) and uses the appropriate redirect URI

## Important Notes

- Spotify Premium is required for playback functionality
- The application detects whether it's running locally or on Vercel and uses the appropriate redirect URI
- Token storage is handled in the browser's localStorage 