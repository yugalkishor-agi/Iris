import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Sparkles, X, Loader2 } from 'lucide-react';
import { searchGifs, getTrendingGifs, searchStickers, getTrendingStickers, GifsResult } from '@/services/giphy.service';

interface GifPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (gifUrl: string, type: 'gif' | 'sticker') => void;
  title?: string;
}

export function GifPickerModal({ open, onOpenChange, onSelect, title = 'Select GIF' }: GifPickerModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [gifs, setGifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'gifs' | 'stickers'>('gifs');

  // Load trending on open
  useEffect(() => {
    if (open) {
      loadTrending();
    }
  }, [open, activeTab]);

  // Search when query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      const timer = setTimeout(() => {
        handleSearch();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      loadTrending();
    }
  }, [searchQuery, activeTab]);

  const loadTrending = async () => {
    setLoading(true);
    try {
      const results = activeTab === 'gifs' 
        ? await getTrendingGifs(30) 
        : await getTrendingStickers(30);
      setGifs(results);
    } catch (error) {
      console.error('Failed to load trending:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const results = activeTab === 'gifs'
        ? await searchGifs(searchQuery, 30)
        : await searchStickers(searchQuery, 30);
      setGifs(results);
    } catch (error) {
      console.error('Failed to search:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGif = (gif: any) => {
    const gifUrl = gif.images?.fixed_height?.url || gif.images?.original?.url;
    if (gifUrl) {
      onSelect(gifUrl, activeTab === 'stickers' ? 'sticker' : 'gif');
      onOpenChange(false);
      setSearchQuery('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="p-4 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${activeTab === 'gifs' ? 'GIFs' : 'stickers'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'gifs' | 'stickers')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="gifs">GIFs</TabsTrigger>
              <TabsTrigger value="stickers">Stickers</TabsTrigger>
            </TabsList>

            {/* GIFs Grid */}
            <TabsContent value="gifs" className="mt-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : gifs.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 max-h-[400px] overflow-y-auto">
                  {gifs.map((gif) => (
                    <button
                      key={gif.id}
                      onClick={() => handleSelectGif(gif)}
                      className="aspect-square rounded-lg overflow-hidden hover:opacity-80 transition-opacity bg-muted"
                    >
                      <img
                        src={gif.images?.fixed_height?.url || gif.images?.preview_gif?.url}
                        alt={gif.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No GIFs found</p>
                </div>
              )}
            </TabsContent>

            {/* Stickers Grid */}
            <TabsContent value="stickers" className="mt-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : gifs.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 max-h-[400px] overflow-y-auto">
                  {gifs.map((gif) => (
                    <button
                      key={gif.id}
                      onClick={() => handleSelectGif(gif)}
                      className="aspect-square rounded-lg overflow-hidden hover:opacity-80 transition-opacity bg-muted"
                    >
                      <img
                        src={gif.images?.fixed_height?.url || gif.images?.preview_gif?.url}
                        alt={gif.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No stickers found</p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Powered by GIPHY */}
          <div className="text-center text-xs text-muted-foreground pt-2 border-t">
            Powered by <span className="font-bold">GIPHY</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
