import React, { useEffect, useState } from 'react';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { Music, LogIn, Play } from 'lucide-react';
import type { SpotifyPlaylist } from './types/spotify';
import { PlaylistCard } from './components/PlaylistCard';
import SpotifyPlayer from './components/SpotifyPlayer';
import { getRedirectUri, clearSpotifyTokens } from './utils/spotify';

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
// Use dynamic redirect URI based on environment
const REDIRECT_URI = getRedirectUri();
const PLAYLIST_IDS = [
  '36yuZ4TB4cGbxnQWPqkaS0',
  '075GyZyTBt4JXJV1RCoTHY',
  '2LGLsZkCnS2nmvGzQJgM1G'
];

// Define all required scopes - make sure these are exactly right per Spotify's docs
const REQUIRED_SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'playlist-read-private', 
  'playlist-read-collaborative',
  'app-remote-control'
];

function App() {
  const [spotify, setSpotify] = useState<SpotifyApi | null>(null);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<SpotifyPlaylist | null>(null);
  const [isPlaybackActive, setIsPlaybackActive] = useState(false);
  const [selectedPlaylistUri, setSelectedPlaylistUri] = useState<string | undefined>(undefined);

  const connectToSpotify = async () => {
    setLoading(true);
    try {
      // Use the clearSpotifyTokens utility function
      clearSpotifyTokens();
      
      console.log("Connecting to Spotify with scopes:", REQUIRED_SCOPES.join(", "));
      console.log("Using redirect URI:", REDIRECT_URI);
      
      // Create a new instance with PKCE flow
      const sdk = SpotifyApi.withUserAuthorization(
        CLIENT_ID,
        REDIRECT_URI,
        REQUIRED_SCOPES
      );
      
      // Redirect to Spotify's authorization page
      await sdk.authenticate();
    } catch (err) {
      setError('Failed to connect to Spotify. Please try again.');
      console.error('Connection error:', err);
      setLoading(false);
    }
  };

  const fetchPlaylists = async (sdk: SpotifyApi) => {
    try {
      const playlistPromises = PLAYLIST_IDS.map(id => 
        sdk.playlists.getPlaylist(id)
      );
      
      const fetchedPlaylists = await Promise.all(playlistPromises);
      setPlaylists(fetchedPlaylists);
    } catch (err) {
      console.error('Error fetching playlists:', err);
      setError('Failed to fetch playlists. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initialize the SDK and attempt authentication on load
    const initializeSpotify = async () => {
      try {
        // Create a new instance with PKCE flow
        const sdk = SpotifyApi.withUserAuthorization(
          CLIENT_ID,
          REDIRECT_URI,
          REQUIRED_SCOPES
        );
        
        // Check if we're returning from auth redirect or have a token
        const hasAuthCode = window.location.search.includes('code=');
        
        if (hasAuthCode) {
          await sdk.authenticate();
          setSpotify(sdk);
          await fetchPlaylists(sdk);
          return;
        }
        
        // Try to get existing token
        try {
          const accessToken = await sdk.getAccessToken();
          if (accessToken) {
            setSpotify(sdk);
            await fetchPlaylists(sdk);
            return;
          }
        } catch (tokenErr) {
          console.error('No existing token:', tokenErr);
        }
        
        // No token or auth code, just stop loading
        setLoading(false);
      } catch (err) {
        console.error('Authentication initialization error:', err);
        setLoading(false);
      }
    };
    
    initializeSpotify();
  }, []);

  // Clean up the URL after authentication
  useEffect(() => {
    const hasAuthCode = window.location.search.includes('code=');
    if (hasAuthCode && spotify) {
      const url = new URL(window.location.href);
      url.search = '';
      window.history.replaceState({}, document.title, url.toString());
    }
  }, [spotify]);

  const handleSelectPlaylist = (playlist: SpotifyPlaylist) => {
    setSelectedPlaylist(playlist);
  };

  const handlePlayPlaylist = (playlist: SpotifyPlaylist) => {
    setSelectedPlaylistUri(playlist.uri);
    setIsPlaybackActive(true);
  };

  // Add a logout button for testing
  const handleLogout = () => {
    // Use the clearSpotifyTokens utility function
    clearSpotifyTokens();
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse text-yellow-400 flex items-center gap-2">
          <Music className="animate-bounce" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-red-500 text-center">
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-yellow-400 text-black rounded hover:bg-yellow-300 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!spotify) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Music size={60} className="text-yellow-400 mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-yellow-400 mb-8">Spotify Playlists Player</h1>
          <button
            onClick={connectToSpotify}
            className="px-6 py-3 bg-yellow-400 text-black rounded-full font-semibold flex items-center gap-2 hover:bg-yellow-300 transition-colors mx-auto"
          >
            <LogIn size={20} />
            Connect to Spotify
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl mx-auto">
        <header className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Music size={40} className="text-yellow-400" />
          </div>
          
          {spotify && (
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-zinc-800 text-white rounded hover:bg-zinc-700 transition-colors"
            >
              Logout
            </button>
          )}
        </header>
        
        {isPlaybackActive && spotify && selectedPlaylistUri ? (
          <div>
            <SpotifyPlayer 
              spotify={spotify} 
              selectedPlaylistUri={selectedPlaylistUri} 
            />
            <div className="mt-6 text-center">
              <button
                onClick={() => setIsPlaybackActive(false)}
                className="px-4 py-2 bg-zinc-800 text-white rounded hover:bg-zinc-700 transition-colors"
              >
                Back to Playlists
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">PICK YOUR PLAYLIST</h1>
              <p className="text-gray-400">Choose from our curated playlists</p>
            </div>
            
            <div className="flex flex-col space-y-4">
              {playlists?.length > 0 ? playlists.map(playlist => (
                <PlaylistCard 
                  key={playlist.id} 
                  playlist={playlist} 
                  isSelected={selectedPlaylist?.id === playlist.id}
                  onSelect={handleSelectPlaylist}
                  onPlay={handlePlayPlaylist}
                />
              )) : (
                <p className="text-gray-400 text-center">No playlists found</p>
              )}
            </div>
            
            {selectedPlaylist && (
              <div className="mt-8 flex justify-center">
                <button 
                  onClick={() => handlePlayPlaylist(selectedPlaylist)}
                  className="w-full py-4 bg-yellow-400 text-black rounded-full font-bold text-xl hover:bg-yellow-300 transition-colors"
                >
                  START PLAYING
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;