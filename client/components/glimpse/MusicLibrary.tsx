import { useState } from 'react';
import { Search, Music, Play, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
  url: string;
  thumbnail?: string;
}

// Mock trending tracks - will be replaced with Audius API
const trendingTracks: Track[] = [
  { id: '1', title: 'Summer Vibes', artist: 'DJ Cool', duration: 180, url: '' },
  { id: '2', title: 'Night Drive', artist: 'Synthwave', duration: 210, url: '' },
  { id: '3', title: 'Chill Beats', artist: 'LoFi Master', duration: 165, url: '' },
  { id: '4', title: 'Energy Boost', artist: 'EDM King', duration: 195, url: '' },
  { id: '5', title: 'Acoustic Dreams', artist: 'Guitar Hero', duration: 240, url: '' },
  { id: '6', title: 'Hip Hop Flow', artist: 'MC Rapper', duration: 175, url: '' },
  { id: '7', title: 'Classical Touch', artist: 'Orchestra', duration: 300, url: '' },
  { id: '8', title: 'Rock Anthem', artist: 'Metal Band', duration: 220, url: '' },
];

interface MusicLibraryProps {
  onSelect: (track: Track) => void;
  onClose: () => void;
  selectedTrackId?: string;
}

export function MusicLibrary({ onSelect, onClose, selectedTrackId }: MusicLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState<'trending' | 'search'>('trending');
  const [searchResults, setSearchResults] = useState<Track[]>([]);

  const categories = [
    { id: 'trending', label: 'Trending' },
    { id: 'pop', label: 'Pop' },
    { id: 'hiphop', label: 'Hip Hop' },
    { id: 'electronic', label: 'Electronic' },
    { id: 'rock', label: 'Rock' },
    { id: 'classical', label: 'Classical' },
  ];

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    
    // Mock search - will be replaced with Audius API
    const results = trendingTracks.filter(track => 
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.artist.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    setSearchResults(results);
    setCategory('search');
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const displayTracks = category === 'search' ? searchResults : trendingTracks;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-900 border-b border-gray-800">
        <h2 className="text-white text-lg font-semibold">Music Library</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5 text-white" />
        </Button>
      </div>

      {/* Search Bar */}
      <div className="p-4 bg-gray-900 border-b border-gray-800">
        <div className="flex gap-2">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search songs or artists..."
            className="flex-1 bg-gray-800 border-gray-700 text-white"
          />
          <Button onClick={handleSearch} className="bg-primary">
            <Search className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 px-4 py-3 bg-gray-900 border-b border-gray-800 overflow-x-auto">
        {categories.map((cat) => (
          <Button
            key={cat.id}
            variant={category === cat.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCategory(cat.id as any)}
            className="whitespace-nowrap"
          >
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Track List */}
      <div className="flex-1 overflow-y-auto bg-black">
        {displayTracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/60">
            <Music className="h-16 w-16 mb-4" />
            <p>No tracks found</p>
            <p className="text-sm mt-2">Try a different search</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {displayTracks.map((track) => (
              <button
                key={track.id}
                onClick={() => onSelect(track)}
                className="w-full p-4 flex items-center gap-4 hover:bg-gray-900 transition-colors active:bg-gray-800"
              >
                {/* Thumbnail */}
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                  {selectedTrackId === track.id ? (
                    <Check className="h-6 w-6 text-white" />
                  ) : (
                    <Music className="h-6 w-6 text-white" />
                  )}
                </div>

                {/* Track Info */}
                <div className="flex-1 text-left min-w-0">
                  <p className="text-white font-medium truncate">{track.title}</p>
                  <p className="text-white/60 text-sm truncate">{track.artist}</p>
                </div>

                {/* Duration & Play */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-white/60 text-sm">{formatDuration(track.duration)}</span>
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                    <Play className="h-4 w-4 text-white ml-0.5" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-4 bg-gray-900 border-t border-gray-800">
        <p className="text-white/40 text-xs text-center">
          Music powered by Audius • Royalty-free tracks
        </p>
      </div>
    </div>
  );
}
