interface Window {
  onSpotifyWebPlaybackSDKReady: () => void;
  Spotify: {
    Player: {
      new(options: Spotify.PlayerOptions): Spotify.Player;
    };
  };
}

declare namespace Spotify {
  interface PlayerOptions {
    name: string;
    getOAuthToken: (callback: (token: string) => void) => void;
    volume?: number;
  }

  interface Player {
    connect(): Promise<boolean>;
    disconnect(): void;
    addListener(event: string, callback: (event: any) => void): void;
    removeListener(event: string, callback?: (event: any) => void): void;
    getCurrentState(): Promise<PlaybackState | null>;
    setName(name: string): Promise<void>;
    getVolume(): Promise<number>;
    setVolume(volume: number): Promise<void>;
    pause(): Promise<void>;
    resume(): Promise<void>;
    togglePlay(): Promise<void>;
    seek(position_ms: number): Promise<void>;
    previousTrack(): Promise<void>;
    nextTrack(): Promise<void>;
    activateElement(): Promise<void>;
  }

  interface PlaybackState {
    context: {
      uri: string;
      metadata: any;
    };
    disallows: {
      pausing: boolean;
      peeking_next: boolean;
      peeking_prev: boolean;
      resuming: boolean;
      seeking: boolean;
      skipping_next: boolean;
      skipping_prev: boolean;
    };
    duration: number;
    paused: boolean;
    position: number;
    repeat_mode: number;
    shuffle: boolean;
    track_window: {
      current_track: Track;
      previous_tracks: Track[];
      next_tracks: Track[];
    };
  }

  interface Track {
    id: string;
    uri: string;
    type: 'track' | 'episode' | 'ad';
    media_type: 'audio' | 'video';
    name: string;
    is_playable: boolean;
    album: Album;
    artists: Artist[];
    duration_ms: number;
    linked_from?: {
      uri: string;
      id: string;
    };
  }

  interface Album {
    uri: string;
    name: string;
    images: Image[];
  }

  interface Artist {
    uri: string;
    name: string;
  }

  interface Image {
    url: string;
    height?: number;
    width?: number;
  }
} 