import React from 'react';
import type { SpotifyPlaylist } from '../types/spotify';

interface PlaylistCardProps {
  playlist: SpotifyPlaylist;
  isSelected: boolean;
  onSelect: (playlist: SpotifyPlaylist) => void;
  onPlay: (playlist: SpotifyPlaylist) => void;
}

export function PlaylistCard({ playlist, isSelected, onSelect }: PlaylistCardProps) {
  return (
    <div 
      className={`${isSelected ? 'bg-zinc-800' : 'bg-zinc-900'} rounded-lg overflow-hidden hover:bg-zinc-800 transition-colors cursor-pointer w-full`}
      onClick={() => onSelect(playlist)}
    >
      <div className="flex items-center p-4">
        <img
          src={playlist.images[0]?.url}
          alt={playlist.name}
          className="w-16 h-16 object-cover rounded"
        />
        <div className="ml-4">
          <h3 className="text-xl font-bold text-white">{playlist.name}</h3>
          <p className="text-gray-400 text-sm">Playlist • {playlist.description.substring(0, 30)}</p>
        </div>
      </div>
    </div>
  );
}