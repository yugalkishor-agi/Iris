import { useState, useEffect } from 'react';
import { useStoryEditorStore } from '@/stores/storyEditorStore';
import { Music, Search, Play, Pause, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';

const TRENDING_SONGS = [
  { id: '1', title: 'Blinding Lights', artist: 'The Weeknd', duration: 200 },
  { id: '2', title: 'Levitating', artist: 'Dua Lipa', duration: 203 },
  { id: '3', title: 'Save Your Tears', artist: 'The Weeknd', duration: 215 },
  { id: '4', title: 'Good 4 U', artist: 'Olivia Rodrigo', duration: 178 },
  { id: '5', title: 'Stay', artist: 'Justin Bieber', duration: 141 },
];

export function MusicPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedSong, setSelectedSong] = useState<typeof TRENDING_SONGS[0] | null>(null);
  const [startTime, setStartTime] = useState(0);

  const { music, setMusic, setActiveTool } = useStoryEditorStore();

  const handleSelectSong = (song: typeof TRENDING_SONGS[0]) => {
    setSelectedSong(song);
    setMusic({
      title: song.title,
      artist: song.artist,
      url: '', // Would be actual audio URL
      duration: song.duration,
      startTime,
    });
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveTool('none');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveTool]);

  const filteredSongs = TRENDING_SONGS.filter(
    song =>
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="absolute inset-x-0 bottom-24 max-w-md mx-auto p-4 bg-black/90 backdrop-blur-xl rounded-t-3xl border-t border-white/10 shadow-2xl animate-in slide-in-from-bottom duration-300">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Music className="h-5 w-5 text-purple-400" />
            <h3 className="text-white font-semibold">Add Music</h3>
          </div>
          <Button
            onClick={() => setActiveTool('none')}
            variant="ghost"
            size="sm"
            className="text-white/60 hover:text-white"
          >
            Done
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search songs..."
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40"
          />
        </div>

        {/* Selected Song Preview */}
        {selectedSong && (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600">
                <Music className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold truncate">{selectedSong.title}</p>
                <p className="text-white/60 text-sm">{selectedSong.artist}</p>
              </div>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5 text-white" />
                ) : (
                  <Play className="h-5 w-5 text-white" />
                )}
              </button>
            </div>

            {/* Start Time Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-white/70 text-xs font-medium">START TIME</label>
                <span className="text-white text-xs">{Math.floor(startTime / 60)}:{(startTime % 60).toString().padStart(2, '0')}</span>
              </div>
              <Slider
                value={[startTime]}
                onValueChange={(v) => setStartTime(v[0])}
                min={0}
                max={selectedSong.duration}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        )}

        {/* Song List */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {filteredSongs.map((song) => (
            <button
              key={song.id}
              onClick={() => handleSelectSong(song)}
              className={`
                w-full p-3 rounded-xl transition-all text-left
                ${selectedSong?.id === song.id
                  ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-purple-500/50'
                  : 'bg-white/5 hover:bg-white/10'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/10">
                  <Music className="h-4 w-4 text-white/70" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{song.title}</p>
                  <p className="text-white/50 text-sm">{song.artist}</p>
                </div>
                <Volume2 className="h-4 w-4 text-white/40" />
              </div>
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        {selectedSong && (
          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => {
                setSelectedSong(null);
                setMusic(null);
              }}
              variant="outline"
              className="flex-1 border-white/20 text-white hover:bg-white/10"
            >
              Remove Music
            </Button>
            <Button
              onClick={() => setActiveTool('none')}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              Done
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
