import React, { useState, useEffect } from 'react';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { Music, Play, Pause, SkipBack, SkipForward } from 'lucide-react';

interface SpotifyPlayerProps {
  spotify: SpotifyApi;
  selectedPlaylistUri?: string;
}

const SpotifyPlayer: React.FC<SpotifyPlayerProps> = ({ spotify, selectedPlaylistUri }) => {
  const [player, setPlayer] = useState<Spotify.Player | null>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Spotify.Track | null>(null);
  const [playerInitError, setPlayerInitError] = useState<string | null>(null);
  
  // Suppress specific Spotify SDK errors
  useEffect(() => {
    // Handler for unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Check if it's a Spotify SDK analytics error
      if (
        event.reason?.message?.includes('PlayLoad event failed') ||
        event.reason?.toString().includes('404') && 
        event.reason?.toString().includes('cpapi.spotify.com')
      ) {
        // Prevent the error from appearing in the console
        event.preventDefault();
        event.stopPropagation();
      }
    };

    // Add the event listener
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Original console.error function
    const originalConsoleError = console.error;

    // Override console.error to filter out specific errors
    console.error = (...args) => {
      // Filter out the specific Spotify SDK errors
      const errorString = args.join(' ');
      if (
        errorString.includes('cpapi.spotify.com') ||
        errorString.includes('PlayLoad event failed') ||
        (errorString.includes('404') && errorString.includes('event/item_before_load'))
      ) {
        // Skip logging these errors
        return;
      }
      // Pass other errors to the original console.error
      originalConsoleError.apply(console, args);
    };

    return () => {
      // Clean up - restore original console.error and remove event listener
      console.error = originalConsoleError;
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Initialize the Spotify Web Playback SDK
  useEffect(() => {
    // Load the Spotify Web Playback SDK script
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    // Handle script loading errors
    script.onerror = () => {
      setPlayerInitError("Failed to load Spotify Player SDK");
    };

    // Cleanup function
    let playerInstance: Spotify.Player | null = null;

    // Initialize the player when the SDK is ready
    window.onSpotifyWebPlaybackSDKReady = () => {
      try {
        // First check if we can get a token
        spotify.getAccessToken()
          .then(token => {
            if (!token) {
              setPlayerInitError("No access token available");
              return;
            }
            
            const spotifyPlayer = new window.Spotify.Player({
              name: 'Web Playlist Player',
              getOAuthToken: async cb => { 
                try {
                  // Get a fresh token each time it's requested
                  const accessToken = await spotify.getAccessToken();
                  console.log("Providing token to player:", accessToken ? "Token available" : "No token");
                  
                  // Convert AccessToken to string - either use .access_token or String()
                  const tokenString = accessToken ? String(accessToken.access_token) : '';
                  cb(tokenString);
                } catch (err) {
                  console.error("Error providing token:", err);
                  cb(''); // Provide empty token as fallback
                }
              },
              volume: 0.5
            });

            // Error handling
            spotifyPlayer.addListener('initialization_error', ({ message }) => {
              console.error('Initialization error:', message);
              setPlayerInitError(`Player initialization error: ${message}`);
            });

            spotifyPlayer.addListener('authentication_error', ({ message }) => {
              console.error('Authentication error:', message);
              setPlayerInitError(`Authentication error: ${message}`);
              
              // Disable automatic reconnection as it's causing an infinite loop
              // Instead, show a clear error message
              if (message.includes('Invalid token scopes')) {
                setPlayerInitError("Spotify Premium is required, and you may need to re-login with the correct permissions. Please refresh the page and try again.");
              }
            });

            spotifyPlayer.addListener('account_error', ({ message }) => {
              console.error('Account error:', message);
              setPlayerInitError(`Account error (Premium required): ${message}`);
            });

            spotifyPlayer.addListener('playback_error', ({ message }) => {
              console.error('Playback error:', message);
            });

            // Ready event
            spotifyPlayer.addListener('ready', ({ device_id }) => {
              console.log('Ready with Device ID', device_id);
              setDeviceId(device_id);
              setPlayerReady(true);
              setPlayerInitError(null); // Clear any previous errors
            });

            // Not ready event
            spotifyPlayer.addListener('not_ready', ({ device_id }) => {
              console.log('Device ID has gone offline', device_id);
              setPlayerReady(false);
            });

            // Playback state changes
            spotifyPlayer.addListener('player_state_changed', state => {
              if (!state) return;
              
              setIsPlaying(!state.paused);
              if (state.track_window.current_track) {
                setCurrentTrack(state.track_window.current_track);
              }
            });

            // Connect to the player
            spotifyPlayer.connect()
              .then(success => {
                if (!success) {
                  setPlayerInitError("Failed to connect to Spotify player");
                }
              })
              .catch((error: Error) => {
                console.error("Connection error:", error);
                setPlayerInitError(`Connection error: ${error.message}`);
              });
            
            setPlayer(spotifyPlayer);
            playerInstance = spotifyPlayer;
          })
          .catch(error => {
            console.error("Failed to get token:", error);
            setPlayerInitError(`Failed to get Spotify token: ${error.message}`);
          });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Failed to initialize player:", errorMessage);
        setPlayerInitError(`Failed to initialize player: ${errorMessage}`);
      }
    };

    return () => {
      // Clean up
      if (playerInstance) {
        playerInstance.disconnect();
      }
      // Remove script
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [spotify]);

  // Start playback when a playlist is selected and the device is ready
  useEffect(() => {
    const startPlayback = async () => {
      if (deviceId && selectedPlaylistUri && playerReady) {
        try {
          console.log(`Starting playback for playlist: ${selectedPlaylistUri} on device: ${deviceId}`);
          
          // Get fresh token for the API call
          const tokenObj = await spotify.getAccessToken();
          if (!tokenObj) {
            setPlayerInitError("No access token available for playback");
            return;
          }
          
          // Extract the actual token string
          const token = tokenObj.access_token;
          
          // Start playback of the selected playlist on this device
          const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              context_uri: selectedPlaylistUri,
              position_ms: 0
            }),
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Playback API error (${response.status}):`, errorText);
            if (response.status === 403) {
              setPlayerInitError("Premium account required for playback control");
            } else {
              setPlayerInitError(`Failed to start playback: ${response.statusText}`);
            }
            return;
          }
          
          setIsPlaying(true);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error('Error starting playback:', errorMessage);
          setPlayerInitError(`Error starting playback: ${errorMessage}`);
        }
      }
    };

    startPlayback();
  }, [deviceId, selectedPlaylistUri, playerReady, spotify]);

  // Playback controls
  const handlePlayPause = () => {
    if (player) {
      player.togglePlay();
    }
  };

  const handlePreviousTrack = () => {
    if (player) {
      player.previousTrack();
    }
  };

  const handleNextTrack = () => {
    if (player) {
      player.nextTrack();
    }
  };

  if (playerInitError) {
    return (
      <div className="bg-zinc-900 p-4 rounded-lg text-center">
        <p className="text-red-500 mb-2">Player Error</p>
        <p className="text-gray-400 text-sm">{playerInitError}</p>
        <p className="text-gray-400 text-sm mt-2">Note: Spotify Web Playback requires a Premium account.</p>
      </div>
    );
  }

  if (!playerReady) {
    return (
      <div className="bg-zinc-900 p-4 rounded-lg text-center">
        <div className="animate-pulse text-yellow-400 flex items-center justify-center gap-2">
          <Music className="animate-bounce" />
          <span>Initializing player...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 p-6 rounded-lg">
      <div className="flex flex-col items-center mb-8">
        {currentTrack?.album?.images?.[0]?.url ? (
          <img 
            src={currentTrack.album.images[0].url} 
            alt={currentTrack.name} 
            className="w-48 h-48 rounded-lg shadow-lg mb-4"
          />
        ) : (
          <div className="w-48 h-48 bg-zinc-800 rounded-lg flex items-center justify-center mb-4">
            <Music className="text-yellow-400" size={64} />
          </div>
        )}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-1">{currentTrack?.name || 'No track playing'}</h2>
          <p className="text-gray-400 text-lg">{currentTrack?.artists.map(a => a.name).join(', ')}</p>
        </div>
      </div>
      
      <div className="flex justify-center gap-6">
        <button 
          onClick={handlePreviousTrack}
          className="p-3 rounded-full hover:bg-zinc-800 transition-colors"
        >
          <SkipBack className="text-yellow-400" size={28} />
        </button>
        <button 
          onClick={handlePlayPause}
          className="p-4 bg-yellow-400 rounded-full hover:bg-yellow-300 transition-colors"
        >
          {isPlaying ? (
            <Pause className="text-black" size={32} />
          ) : (
            <Play className="text-black" size={32} />
          )}
        </button>
        <button 
          onClick={handleNextTrack}
          className="p-3 rounded-full hover:bg-zinc-800 transition-colors"
        >
          <SkipForward className="text-yellow-400" size={28} />
        </button>
      </div>
    </div>
  );
};

export default SpotifyPlayer; 