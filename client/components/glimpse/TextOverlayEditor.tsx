import { useState, useRef } from 'react';
import { X, Type, AlignLeft, AlignCenter, AlignRight, Palette, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TextLayer {
  id: string;
  text: string;
  x: number;
  y: number;
  scale: number;
  color: string;
  bgColor: string;
  align: 'left' | 'center' | 'right';
  fontStyle: 'normal' | 'bold' | 'script' | 'typewriter' | 'modern' | 'neon';
  startTime: number; // seconds
  endTime: number; // seconds
  rotation: number;
}

interface TextOverlayEditorProps {
  onClose: () => void;
  onSave: (layers: TextLayer[]) => void;
  videoDuration: number;
}

const textStyles = [
  { id: 'normal', label: 'Classic', font: 'font-sans', sample: 'Aa' },
  { id: 'bold', label: 'Bold', font: 'font-bold', sample: 'Aa' },
  { id: 'script', label: 'Script', font: 'font-serif italic', sample: 'Aa' },
  { id: 'typewriter', label: 'Mono', font: 'font-mono', sample: 'Aa' },
  { id: 'modern', label: 'Modern', font: 'font-sans tracking-wider', sample: 'Aa' },
  { id: 'neon', label: 'Neon', font: 'font-bold', sample: 'Aa' },
];

const textColors = [
  { color: '#FFFFFF', label: 'White' },
  { color: '#000000', label: 'Black' },
  { color: '#FF0000', label: 'Red' },
  { color: '#00FF00', label: 'Green' },
  { color: '#0000FF', label: 'Blue' },
  { color: '#FFFF00', label: 'Yellow' },
  { color: '#FF00FF', label: 'Magenta' },
  { color: '#00FFFF', label: 'Cyan' },
  { color: '#FF6B35', label: 'Orange' },
  { color: '#9D4EDD', label: 'Purple' },
];

const bgColors = [
  { color: 'transparent', label: 'None' },
  { color: 'rgba(0,0,0,0.6)', label: 'Dark' },
  { color: 'rgba(255,255,255,0.6)', label: 'Light' },
  { color: 'rgba(255,0,0,0.6)', label: 'Red' },
  { color: 'rgba(0,0,255,0.6)', label: 'Blue' },
];

export function TextOverlayEditor({ onClose, onSave, videoDuration }: TextOverlayEditorProps) {
  const [layers, setLayers] = useState<TextLayer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [currentText, setCurrentText] = useState('');
  const [showStylePanel, setShowStylePanel] = useState(false);
  const [activeTab, setActiveTab] = useState<'style' | 'color' | 'bg' | 'align'>('style');
  
  const selectedLayer = layers.find(l => l.id === selectedLayerId);

  const addTextLayer = () => {
    if (!currentText.trim()) return;
    
    const newLayer: TextLayer = {
      id: Date.now().toString(),
      text: currentText,
      x: 150,
      y: 200,
      scale: 1,
      color: '#FFFFFF',
      bgColor: 'transparent',
      align: 'center',
      fontStyle: 'normal',
      startTime: 0,
      endTime: videoDuration,
      rotation: 0,
    };
    
    setLayers([...layers, newLayer]);
    setSelectedLayerId(newLayer.id);
    setCurrentText('');
    setShowStylePanel(true);
  };

  const updateLayer = (id: string, updates: Partial<TextLayer>) => {
    setLayers(layers.map(layer => 
      layer.id === id ? { ...layer, ...updates } : layer
    ));
  };

  const deleteLayer = (id: string) => {
    setLayers(layers.filter(l => l.id !== id));
    if (selectedLayerId === id) {
      setSelectedLayerId(null);
    }
  };

  // Drag functionality removed for now - will add native drag later

  const handleScale = (id: string, delta: number) => {
    const layer = layers.find(l => l.id === id);
    if (layer) {
      const newScale = Math.max(0.5, Math.min(3, layer.scale + delta));
      updateLayer(id, { scale: newScale });
    }
  };

  const getFontClass = (style: string) => {
    const styleObj = textStyles.find(s => s.id === style);
    return styleObj?.font || 'font-sans';
  };

  const getTextStyle = (layer: TextLayer) => {
    let style: any = {
      color: layer.color,
      transform: `scale(${layer.scale}) rotate(${layer.rotation}deg)`,
      textAlign: layer.align,
    };

    if (layer.bgColor !== 'transparent') {
      style.backgroundColor = layer.bgColor;
      style.padding = '8px 16px';
      style.borderRadius = '8px';
    }

    if (layer.fontStyle === 'neon') {
      style.textShadow = `0 0 10px ${layer.color}, 0 0 20px ${layer.color}, 0 0 30px ${layer.color}`;
    }

    return style;
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black to-transparent">
        <button onClick={onClose} className="text-white p-2 hover:bg-white/10 rounded-full">
          <X className="h-6 w-6" />
        </button>
        <h2 className="text-white font-bold">Add Text</h2>
        <Button 
          onClick={() => onSave(layers)} 
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 rounded-full"
        >
          Done
        </Button>
      </div>

      {/* Mobile Preview Screen */}
      <div className="flex-1 flex items-center justify-center p-4 bg-gradient-to-b from-transparent via-gray-900/30 to-transparent">
        <div className="relative w-full max-w-sm aspect-[9/16] bg-gray-900 rounded-3xl overflow-hidden border-4 border-gray-800 shadow-2xl">
          {/* Preview Area */}
          <div className="absolute inset-0 bg-black/20">
            {layers.map((layer) => (
            <div
              key={layer.id}
              className={`absolute cursor-move select-none ${getFontClass(layer.fontStyle)} ${
                selectedLayerId === layer.id ? 'ring-2 ring-purple-500' : ''
              }`}
              style={{
                ...getTextStyle(layer),
                left: `${layer.x}px`,
                top: `${layer.y}px`,
              }}
              onClick={() => setSelectedLayerId(layer.id)}
              onWheel={(e) => {
                e.preventDefault();
                handleScale(layer.id, e.deltaY > 0 ? -0.1 : 0.1);
              }}
            >
              <p className="text-2xl font-semibold whitespace-pre-wrap break-words max-w-xs">
                {layer.text}
              </p>
              {selectedLayerId === layer.id && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-2 bg-black/80 rounded-full px-3 py-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleScale(layer.id, -0.2);
                    }}
                    className="text-white text-xs px-2 py-1 hover:bg-white/20 rounded"
                  >
                    A-
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleScale(layer.id, 0.2);
                    }}
                    className="text-white text-xs px-2 py-1 hover:bg-white/20 rounded"
                  >
                    A+
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteLayer(layer.id);
                    }}
                    className="text-red-500 text-xs px-2 py-1 hover:bg-white/20 rounded"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          ))}
          </div>

          {/* Hint */}
          {layers.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-white/40 text-center px-8">
                Add text below to get started
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Text Input */}
      {!showStylePanel && (
        <div className="px-4 pb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={currentText}
              onChange={(e) => setCurrentText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTextLayer()}
              placeholder="Type your text..."
              className="flex-1 px-4 py-4 bg-white/10 text-white text-lg rounded-2xl border-2 border-white/20 focus:border-purple-500 outline-none placeholder:text-white/40"
              autoFocus
            />
            <Button
              onClick={addTextLayer}
              disabled={!currentText.trim()}
              className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 rounded-2xl"
            >
              Add
            </Button>
          </div>
        </div>
      )}

      {/* Layers Panel */}
      {layers.length > 0 && (
        <div className="px-4 pb-2">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="h-4 w-4 text-white/60" />
            <span className="text-white/60 text-sm font-semibold">Layers ({layers.length})</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {layers.map((layer, index) => (
              <button
                key={layer.id}
                onClick={() => setSelectedLayerId(layer.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl transition-all ${
                  selectedLayerId === layer.id
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
              >
                <p className="text-xs font-semibold">Layer {index + 1}</p>
                <p className="text-xs truncate max-w-[80px]">{layer.text}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Style Panel - Swipeable Bottom Toolbar */}
      {selectedLayer && showStylePanel && (
        <div className="bg-gradient-to-t from-black via-gray-900 to-transparent px-4 pb-6 pt-4">
          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-3 mb-3 border-b border-white/10">
            <button
              onClick={() => setActiveTab('style')}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                activeTab === 'style'
                  ? 'bg-white text-black'
                  : 'bg-white/10 text-white/60'
              }`}
            >
              <Type className="h-4 w-4 inline mr-2" />
              Style
            </button>
            <button
              onClick={() => setActiveTab('color')}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                activeTab === 'color'
                  ? 'bg-white text-black'
                  : 'bg-white/10 text-white/60'
              }`}
            >
              <Palette className="h-4 w-4 inline mr-2" />
              Color
            </button>
            <button
              onClick={() => setActiveTab('bg')}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                activeTab === 'bg'
                  ? 'bg-white text-black'
                  : 'bg-white/10 text-white/60'
              }`}
            >
              Background
            </button>
            <button
              onClick={() => setActiveTab('align')}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                activeTab === 'align'
                  ? 'bg-white text-black'
                  : 'bg-white/10 text-white/60'
              }`}
            >
              Align
            </button>
          </div>

          {/* Content */}
          <div className="overflow-x-auto">
            {/* Font Styles */}
            {activeTab === 'style' && (
              <div className="flex gap-3 pb-2">
                {textStyles.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => updateLayer(selectedLayer.id, { fontStyle: style.id as any })}
                    className={`flex-shrink-0 flex flex-col items-center gap-2 px-4 py-3 rounded-2xl transition-all ${
                      selectedLayer.fontStyle === style.id
                        ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white scale-105'
                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                    }`}
                  >
                    <span className={`text-3xl ${style.font}`}>{style.sample}</span>
                    <span className="text-xs font-semibold">{style.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Text Colors */}
            {activeTab === 'color' && (
              <div className="flex gap-3 pb-2">
                {textColors.map((c) => (
                  <button
                    key={c.color}
                    onClick={() => updateLayer(selectedLayer.id, { color: c.color })}
                    className={`flex-shrink-0 w-14 h-14 rounded-full border-4 transition-all ${
                      selectedLayer.color === c.color
                        ? 'border-white scale-110'
                        : 'border-white/20 hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.color }}
                  />
                ))}
              </div>
            )}

            {/* Background Colors */}
            {activeTab === 'bg' && (
              <div className="flex gap-3 pb-2">
                {bgColors.map((c) => (
                  <button
                    key={c.color}
                    onClick={() => updateLayer(selectedLayer.id, { bgColor: c.color })}
                    className={`flex-shrink-0 w-14 h-14 rounded-2xl border-4 transition-all ${
                      selectedLayer.bgColor === c.color
                        ? 'border-white scale-110'
                        : 'border-white/20 hover:scale-105'
                    }`}
                    style={{ 
                      backgroundColor: c.color === 'transparent' ? '#1f2937' : c.color,
                      backgroundImage: c.color === 'transparent' 
                        ? 'linear-gradient(45deg, #374151 25%, transparent 25%, transparent 75%, #374151 75%, #374151), linear-gradient(45deg, #374151 25%, transparent 25%, transparent 75%, #374151 75%, #374151)'
                        : 'none',
                      backgroundSize: c.color === 'transparent' ? '10px 10px' : 'auto',
                      backgroundPosition: c.color === 'transparent' ? '0 0, 5px 5px' : '0 0',
                    }}
                  >
                    {c.color === 'transparent' && (
                      <div className="w-full h-full flex items-center justify-center">
                        <X className="h-6 w-6 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Text Alignment */}
            {activeTab === 'align' && (
              <div className="flex gap-3 pb-2">
                <button
                  onClick={() => updateLayer(selectedLayer.id, { align: 'left' })}
                  className={`flex-shrink-0 px-6 py-4 rounded-2xl transition-all ${
                    selectedLayer.align === 'left'
                      ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white'
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  <AlignLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={() => updateLayer(selectedLayer.id, { align: 'center' })}
                  className={`flex-shrink-0 px-6 py-4 rounded-2xl transition-all ${
                    selectedLayer.align === 'center'
                      ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white'
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  <AlignCenter className="h-6 w-6" />
                </button>
                <button
                  onClick={() => updateLayer(selectedLayer.id, { align: 'right' })}
                  className={`flex-shrink-0 px-6 py-4 rounded-2xl transition-all ${
                    selectedLayer.align === 'right'
                      ? 'bg-gradient-to-br from-purple-600 to-pink-600 text-white'
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  <AlignRight className="h-6 w-6" />
                </button>
              </div>
            )}
          </div>

          {/* Close Style Panel */}
          <button
            onClick={() => setShowStylePanel(false)}
            className="w-full mt-3 px-4 py-3 bg-white/10 text-white rounded-2xl hover:bg-white/20 transition-all"
          >
            Add More Text
          </button>
        </div>
      )}
    </div>
  );
}
