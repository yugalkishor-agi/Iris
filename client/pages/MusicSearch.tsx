import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Play, TrendingUp, Music, Volume2, Upload, Loader2 } from "lucide-react";
import { searchTracks, getTrendingTracks, getTrackStreamUrl, type AudiusTrack } from "../services/audius.service";
import { useToast } from "@/hooks/use-toast";


interface MusicSearchProps {
  onSelect?: (track: any) => void;
}

export default function MusicSearch({ onSelect }: MusicSearchProps = {}) {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrack, setSelectedTrack] = useState<AudiusTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tracks, setTracks] = useState<AudiusTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [customAudio, setCustomAudio] = useState<File | null>(null);
  const [customAudioUrl, setCustomAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load trending tracks on mount
  useEffect(() => {
    loadTrendingTracks();
  }, []);

  const loadTrendingTracks = async () => {
    setLoading(true);
    const trending = await getTrendingTracks(20);
    setTracks(trending);
    setLoading(false);
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

  const handleSelectTrack = async (track: AudiusTrack) => {
    setSelectedTrack(track);
    setIsPlaying(true);
    
    // Play preview
    try {
      const streamUrl = await getTrackStreamUrl(track.id);
      if (audioRef.current) {
        audioRef.current.src = streamUrl;
        audioRef.current.play();
      }
    } catch (error) {
      console.error('Failed to play track:', error);
    }
  };

  const handleTogglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleCustomAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      toast({
        title: "Invalid file",
        description: "Please select an audio file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an audio file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setCustomAudio(file);
    const url = URL.createObjectURL(file);
    setCustomAudioUrl(url);
    
    toast({
      title: "Audio uploaded",
      description: "Your custom audio is ready to use",
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hidden audio player */}
      <audio ref={audioRef} />
      
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 p-4">
          <h1 className="text-lg font-semibold">Add Music</h1>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="browse" className="w-full">
          <TabsList className="w-full grid grid-cols-2 px-4">
            <TabsTrigger value="browse">Browse</TabsTrigger>
            <TabsTrigger value="upload">Upload Audio</TabsTrigger>
          </TabsList>

          {/* Browse Tab */}
          <TabsContent value="browse" className="mt-0">
            {/* Search Bar */}
            <div className="px-4 py-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search songs or artists..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Trending Section */}
            {!searchQuery && (
              <div className="p-4 border-b">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold">Trending Now</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Popular tracks from Audius
                </p>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {/* Tracks List */}
            {!loading && (
              <div className="divide-y">
                {tracks.map((track) => (
                  <div
                    key={track.id}
                    onClick={() => handleSelectTrack(track)}
                    className={`p-4 hover:bg-accent transition-colors cursor-pointer ${
                      selectedTrack?.id === track.id ? "bg-accent" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Album Art */}
                      {track.artwork?.['150x150'] ? (
                        <img
                          src={track.artwork['150x150']}
                          alt={track.title}
                          className="w-12 h-12 rounded object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center flex-shrink-0">
                          <Music className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}

                      {/* Track Info */}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{track.title}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {track.user.name}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')} • {track.play_count.toLocaleString()} plays
                        </div>
                      </div>

                      {/* Play Button */}
                      <Button
                        size="icon"
                        variant={selectedTrack?.id === track.id && isPlaying ? "default" : "outline"}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (selectedTrack?.id === track.id) {
                            handleTogglePlay();
                          } else {
                            handleSelectTrack(track);
                          }
                        }}
                        className="flex-shrink-0"
                      >
                        {selectedTrack?.id === track.id && isPlaying ? (
                          <Volume2 className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && tracks.length === 0 && (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <div className="p-4 bg-muted rounded-full mb-4">
                  <Music className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-2">No tracks found</h3>
                <p className="text-sm text-muted-foreground">
                  Try searching with different keywords
                </p>
              </div>
            )}
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload" className="mt-0">
            <div className="p-6 space-y-4">
              {!customAudio ? (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-2xl p-12 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-primary/10 rounded-full">
                      <Upload className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Upload Your Audio</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        MP3, WAV, or M4A (Max 10MB)
                      </p>
                    </div>
                    <Button onClick={() => fileInputRef.current?.click()}>
                      <Upload className="h-4 w-4 mr-2" />
                      Choose File
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border border-border rounded-xl p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Music className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{customAudio.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(customAudio.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setCustomAudio(null);
                        setCustomAudioUrl(null);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                  {customAudioUrl && (
                    <audio controls className="w-full">
                      <source src={customAudioUrl} />
                    </audio>
                  )}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleCustomAudioUpload}
                className="hidden"
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Selected Track Bar */}
      {(selectedTrack || customAudio) && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-50">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {selectedTrack?.artwork?.['150x150'] ? (
                <img
                  src={selectedTrack.artwork['150x150']}
                  alt={selectedTrack.title}
                  className="w-10 h-10 rounded object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                  <Music className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">
                  {selectedTrack?.title || customAudio?.name}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {selectedTrack?.user.name || 'Custom Audio'}
                </div>
              </div>
            </div>
            <Button onClick={() => {
              if (customAudio && onSelect) {
                onSelect({
                  id: 'custom',
                  title: customAudio.name,
                  user: { name: 'Custom Audio' },
                  artwork: { '150x150': '', '480x480': '' },
                  customAudioFile: customAudio,
                  customAudioUrl: customAudioUrl
                });
              } else if (selectedTrack && onSelect) {
                onSelect(selectedTrack);
              }
            }}>Use This Sound</Button>
          </div>
        </div>
      )}
    </div>
  );
}
