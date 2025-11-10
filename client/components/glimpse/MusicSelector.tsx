import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Play, Pause, Heart, X } from 'lucide-react';
import { searchTracks, getTrendingTracks, getTrackStreamUrl, formatDuration, AudiusTrack } from '@/services/audius.service';

interface MusicSelectorProps {
  onSelect: (track: AudiusTrack) => void;
  onClose: () => void;
  selectedTrack?: AudiusTrack | null;
}

export function MusicSelector({ onSelect, onClose, selectedTrack }: MusicSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [tracks, setTracks] = useState<AudiusTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [savedTracks, setSavedTracks] = useState<string[]>([]);

  useEffect(() => {
    loadTrendingTracks();
    loadSavedTracks();
    
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
    };
  }, []);

  const loadTrendingTracks = async () => {
    setLoading(true);
    const trending = await getTrendingTracks(20);
    setTracks(trending);
    setLoading(false);
  };

  const loadSavedTracks = () => {
    const saved = localStorage.getItem('savedMusicTracks');
    if (saved) {
      setSavedTracks(JSON.parse(saved));
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadTrendingTracks();
      return;
    }

    setLoading(true);
    const results = await searchTracks(searchQuery, 20);
    setTracks(results);
    setLoading(false);
  };

  const togglePlay = async (track: AudiusTrack) => {
    if (playingTrackId === track.id) {
      // Pause current track
      if (audioElement) {
        audioElement.pause();
        setPlayingTrackId(null);
      }
    } else {
      // Play new track
      if (audioElement) {
        audioElement.pause();
      }

      const streamUrl = await getTrackStreamUrl(track.id);
      const audio = new Audio(streamUrl);
      
      audio.addEventListener('ended', () => {
        setPlayingTrackId(null);
      });

      audio.play();
      setAudioElement(audio);
      setPlayingTrackId(track.id);
    }
  };

  const toggleSave = (trackId: string) => {
    let updated: string[];
    
    if (savedTracks.includes(trackId)) {
      updated = savedTracks.filter(id => id !== trackId);
    } else {
      updated = [...savedTracks, trackId];
    }
    
    setSavedTracks(updated);
    localStorage.setItem('savedMusicTracks', JSON.stringify(updated));
  };

  const handleSelectTrack = (track: AudiusTrack) => {
    if (audioElement) {
      audioElement.pause();
      setPlayingTrackId(null);
    }
    onSelect(track);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-white/10">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5 text-white" />
        </Button>
        <h2 className="text-white font-semibold flex-1">Add Music</h2>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-white/10">
        <div className="flex gap-2">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search songs, artists..."
            className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
          />
          <Button onClick={handleSearch} disabled={loading}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Selected Track */}
      {selectedTrack && (
        <div className="p-4 bg-primary/10 border-b border-primary/20">
          <p className="text-xs text-white/60 mb-1">Selected Track</p>
          <div className="flex items-center gap-3">
            {selectedTrack.artwork && (
              <img
                src={selectedTrack.artwork['150x150']}
                alt={selectedTrack.title}
                className="w-12 h-12 rounded"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">{selectedTrack.title}</p>
              <p className="text-white/60 text-sm truncate">{selectedTrack.user.name}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tracks List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-white/60">Loading tracks...</p>
          </div>
        ) : tracks.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <p className="text-white/60">No tracks found</p>
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {tracks.map((track) => (
              <div
                key={track.id}
                className="p-4 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {/* Artwork */}
                  <div className="relative w-12 h-12 flex-shrink-0">
                    {track.artwork ? (
                      <img
                        src={track.artwork['150x150']}
                        alt={track.title}
                        className="w-full h-full rounded object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded bg-white/10 flex items-center justify-center">
                        <span className="text-white/40 text-xs">🎵</span>
                      </div>
                    )}
                  </div>

                  {/* Track Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{track.title}</p>
                    <p className="text-white/60 text-sm truncate">{track.user.name}</p>
                    <p className="text-white/40 text-xs">
                      {formatDuration(track.duration)} • {track.play_count.toLocaleString()} plays
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleSave(track.id)}
                    >
                      <Heart
                        className={`h-4 w-4 ${
                          savedTracks.includes(track.id)
                            ? 'fill-red-500 text-red-500'
                            : 'text-white'
                        }`}
                      />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => togglePlay(track)}
                    >
                      {playingTrackId === track.id ? (
                        <Pause className="h-4 w-4 text-white" />
                      ) : (
                        <Play className="h-4 w-4 text-white" />
                      )}
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => handleSelectTrack(track)}
                      className="bg-primary"
                    >
                      Use
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
