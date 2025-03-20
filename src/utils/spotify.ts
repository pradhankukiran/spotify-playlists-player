/**
 * Spotify utility functions for authentication and environment-specific configurations
 */

/**
 * Determines the appropriate redirect URI based on the current environment
 * Supports both localhost and the Vercel deployment
 */
export function getRedirectUri(): string {
  // Check if we're in localhost development environment
  const isLocalhost = 
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1';
  
  // Get the base environment variable
  const envRedirectUri = import.meta.env.VITE_REDIRECT_URI;
  
  if (isLocalhost) {
    // Use the environment variable for local development
    return `${envRedirectUri}`;
  } else {
    // For production (Vercel), use the deployed URL
    return 'https://spotify-playlists-player.vercel.app';
  }
}

/**
 * Clears all Spotify related tokens from localStorage
 * Useful for logout and authentication refresh
 */
export function clearSpotifyTokens(): void {
  Object.keys(localStorage).forEach(key => {
    if (key.includes('spotify') || key.includes('token')) {
      localStorage.removeItem(key);
    }
  });
} 