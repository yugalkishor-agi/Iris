import { useState } from "react";
import { Music, X } from "lucide-react";

interface MusicStickerProps {
  id: string;
  songName: string;
  artistName: string;
  x: number;
  y: number;
  isSelected: boolean;
  onUpdate: (id: string, updates: any) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
}

export function MusicSticker({
  id,
  songName,
  artistName,
  x,
  y,
  isSelected,
  onUpdate,
  onDelete,
  onSelect,
}: MusicStickerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialPos, setInitialPos] = useState({ x, y });

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(id);
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialPos({ x, y });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      onUpdate(id, {
        x: initialPos.x + deltaX,
        y: initialPos.y + deltaY,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useState(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  });

  return (
    <div
      className={`absolute cursor-move select-none ${
        isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-black' : ''
      }`}
      style={{
        left: x,
        top: y,
        zIndex: isSelected ? 100 : 10,
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Music Card */}
      <div className="bg-gradient-to-br from-purple-600/90 to-pink-600/90 backdrop-blur-md rounded-2xl p-3 min-w-[200px] shadow-2xl animate-pulse-slow">
        <div className="flex items-center gap-3 text-white">
          <div className="p-2 bg-white/20 rounded-full">
            <Music className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm truncate">{songName}</p>
            <p className="text-xs opacity-80 truncate">{artistName}</p>
          </div>
        </div>
        
        {/* Audio Wave Animation */}
        <div className="flex items-center gap-1 mt-2">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-white/60 rounded-full animate-wave"
              style={{
                height: `${Math.random() * 12 + 4}px`,
                animationDelay: `${i * 0.05}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Delete Button */}
      {isSelected && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(id);
          }}
          className="absolute -top-3 -right-3 p-2 bg-red-500 rounded-full hover:bg-red-600 shadow-lg"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <X className="h-4 w-4 text-white" />
        </button>
      )}
    </div>
  );
}

// Music Selector Component
export function MusicSelector({ onSelectMusic }: { onSelectMusic: (song: string, artist: string) => void }) {
  const [search, setSearch] = useState('');

  const popularSongs = [
    { name: "Blinding Lights", artist: "The Weeknd" },
    { name: "Shape of You", artist: "Ed Sheeran" },
    { name: "Dance Monkey", artist: "Tones and I" },
    { name: "Levitating", artist: "Dua Lipa" },
    { name: "Watermelon Sugar", artist: "Harry Styles" },
    { name: "Peaches", artist: "Justin Bieber" },
  ];

  return (
    <div className="space-y-3 p-4 bg-black/50 rounded-lg max-h-80 overflow-y-auto">
      <h3 className="text-white font-semibold flex items-center gap-2">
        <Music className="h-5 w-5" />
        Add Music
      </h3>
      
      <input
        type="text"
        placeholder="Search for a song..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-3 py-2 bg-white/10 text-white border border-white/20 rounded-lg placeholder:text-white/40"
      />

      <div className="space-y-2">
        <p className="text-white/60 text-xs">Popular Songs</p>
        {popularSongs
          .filter(song => 
            search === '' || 
            song.name.toLowerCase().includes(search.toLowerCase()) ||
            song.artist.toLowerCase().includes(search.toLowerCase())
          )
          .map((song, index) => (
            <button
              key={index}
              onClick={() => onSelectMusic(song.name, song.artist)}
              className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-left"
            >
              <div className="p-2 bg-primary/20 rounded-lg">
                <Music className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-medium">{song.name}</p>
                <p className="text-white/60 text-xs">{song.artist}</p>
              </div>
            </button>
          ))}
      </div>
    </div>
  );
}
