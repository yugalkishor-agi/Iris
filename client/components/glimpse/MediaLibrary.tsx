import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Download, X, Loader2 } from 'lucide-react';
import { searchImages, getPopularImages, PixabayImage } from '@/services/pixabay.service';
import { searchGifs, getTrendingGifs, GiphyGif } from '@/services/giphy.service';

interface MediaLibraryProps {
  onSelectImage: (url: string) => void;
  onSelectGif: (url: string) => void;
  onClose: () => void;
}

export function MediaLibrary({ onSelectImage, onSelectGif, onClose }: MediaLibraryProps) {
  const [activeTab, setActiveTab] = useState<'images' | 'gifs'>('images');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Images
  const [images, setImages] = useState<PixabayImage[]>([]);
  const [imagePage, setImagePage] = useState(1);
  
  // GIFs
  const [gifs, setGifs] = useState<GiphyGif[]>([]);
  const [gifOffset, setGifOffset] = useState(0);

  useEffect(() => {
    if (activeTab === 'images') {
      loadPopularImages();
    } else {
      loadTrendingGifs();
    }
  }, [activeTab]);

  const loadPopularImages = async () => {
    setLoading(true);
    const results = await getPopularImages(1, 30);
    setImages(results);
    setImagePage(1);
    setLoading(false);
  };

  const loadTrendingGifs = async () => {
    setLoading(true);
    const results = await getTrendingGifs(30, 0);
    setGifs(results);
    setGifOffset(0);
    setLoading(false);
  };

  const handleSearchImages = async () => {
    if (!searchQuery.trim()) {
      loadPopularImages();
      return;
    }

    setLoading(true);
    const results = await searchImages(searchQuery, 1, 30);
    setImages(results);
    setImagePage(1);
    setLoading(false);
  };

  const handleSearchGifs = async () => {
    if (!searchQuery.trim()) {
      loadTrendingGifs();
      return;
    }

    setLoading(true);
    const results = await searchGifs(searchQuery, 30, 0);
    setGifs(results);
    setGifOffset(0);
    setLoading(false);
  };

  const handleSearch = () => {
    if (activeTab === 'images') {
      handleSearchImages();
    } else {
      handleSearchGifs();
    }
  };

  const loadMoreImages = async () => {
    setLoading(true);
    const nextPage = imagePage + 1;
    const results = searchQuery
      ? await searchImages(searchQuery, nextPage, 30)
      : await getPopularImages(nextPage, 30);
    setImages([...images, ...results]);
    setImagePage(nextPage);
    setLoading(false);
  };

  const loadMoreGifs = async () => {
    setLoading(true);
    const nextOffset = gifOffset + 30;
    const results = searchQuery
      ? await searchGifs(searchQuery, 30, nextOffset)
      : await getTrendingGifs(30, nextOffset);
    setGifs([...gifs, ...results]);
    setGifOffset(nextOffset);
    setLoading(false);
  };

  const handleSelectImage = (image: PixabayImage) => {
    onSelectImage(image.largeImageURL);
    onClose();
  };

  const handleSelectGif = (gif: GiphyGif) => {
    onSelectGif(gif.images.original.url);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 p-4 border-b border-white/10">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5 text-white" />
        </Button>
        <h2 className="text-white font-semibold flex-1">Media Library</h2>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-white/10">
        <div className="flex gap-2">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={`Search ${activeTab}...`}
            className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/50"
          />
          <Button onClick={handleSearch} disabled={loading}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'images' | 'gifs')} className="flex-1 flex flex-col">
        <TabsList className="w-full rounded-none border-b border-white/10 bg-transparent">
          <TabsTrigger value="images" className="flex-1 data-[state=active]:bg-white/10">
            Images
          </TabsTrigger>
          <TabsTrigger value="gifs" className="flex-1 data-[state=active]:bg-white/10">
            GIFs
          </TabsTrigger>
        </TabsList>

        {/* Images Tab */}
        <TabsContent value="images" className="flex-1 overflow-y-auto mt-0">
          {loading && images.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-4">
                {images.map((image) => (
                  <button
                    key={image.id}
                    onClick={() => handleSelectImage(image)}
                    className="relative aspect-square rounded-lg overflow-hidden group"
                  >
                    <img
                      src={image.webformatURL}
                      alt={image.tags}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Download className="h-6 w-6 text-white" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                      <p className="text-white text-xs truncate">{image.user}</p>
                    </div>
                  </button>
                ))}
              </div>
              {images.length > 0 && (
                <div className="p-4">
                  <Button
                    onClick={loadMoreImages}
                    disabled={loading}
                    variant="outline"
                    className="w-full"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Load More
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* GIFs Tab */}
        <TabsContent value="gifs" className="flex-1 overflow-y-auto mt-0">
          {loading && gifs.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-4">
                {gifs.map((gif) => (
                  <button
                    key={gif.id}
                    onClick={() => handleSelectGif(gif)}
                    className="relative aspect-square rounded-lg overflow-hidden group"
                  >
                    <img
                      src={gif.images.fixed_height.url}
                      alt={gif.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Download className="h-6 w-6 text-white" />
                    </div>
                  </button>
                ))}
              </div>
              {gifs.length > 0 && (
                <div className="p-4">
                  <Button
                    onClick={loadMoreGifs}
                    disabled={loading}
                    variant="outline"
                    className="w-full"
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Load More
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Attribution */}
      <div className="p-2 border-t border-white/10 text-center">
        <p className="text-white/40 text-xs">
          {activeTab === 'images' ? 'Images from Pixabay' : 'GIFs from Giphy'}
        </p>
      </div>
    </div>
  );
}
