import { useState } from 'react';
import { Eye, EyeOff, Lock, Unlock, Copy, Trash2, ChevronUp, ChevronDown, Layers } from 'lucide-react';
import { Layer, TextLayer, EmojiLayer, InteractiveLayer } from './EditorTypes';

interface LayerManagementPanelProps {
  layers: Layer[];
  selectedLayerId: string | null;
  onSelectLayer: (layerId: string) => void;
  onDeleteLayer: (layerId: string) => void;
  onDuplicateLayer: (layerId: string) => void;
  onMoveLayerUp: (layerId: string) => void;
  onMoveLayerDown: (layerId: string) => void;
}

export function LayerManagementPanel({
  layers,
  selectedLayerId,
  onSelectLayer,
  onDeleteLayer,
  onDuplicateLayer,
  onMoveLayerUp,
  onMoveLayerDown
}: LayerManagementPanelProps) {
  const [hiddenLayers, setHiddenLayers] = useState<Set<string>>(new Set());
  const [lockedLayers, setLockedLayers] = useState<Set<string>>(new Set());

  const toggleLayerVisibility = (layerId: string) => {
    const newHidden = new Set(hiddenLayers);
    if (newHidden.has(layerId)) {
      newHidden.delete(layerId);
    } else {
      newHidden.add(layerId);
    }
    setHiddenLayers(newHidden);
  };

  const toggleLayerLock = (layerId: string) => {
    const newLocked = new Set(lockedLayers);
    if (newLocked.has(layerId)) {
      newLocked.delete(layerId);
    } else {
      newLocked.add(layerId);
    }
    setLockedLayers(newLocked);
  };

  const getLayerPreview = (layer: Layer) => {
    if (layer.type === 'text') {
      const textLayer = layer as TextLayer;
      return (
        <div className="flex items-center gap-2">
          <span className="text-xl">T</span>
          <span className="text-xs text-white/80 truncate">{textLayer.content}</span>
        </div>
      );
    } else if (layer.type === 'emoji') {
      const emojiLayer = layer as EmojiLayer;
      return (
        <div className="flex items-center gap-2">
          <span className="text-xl">{emojiLayer.content}</span>
          <span className="text-xs text-white/80">Emoji</span>
        </div>
      );
    } else {
      const interactiveLayer = layer as InteractiveLayer;
      return (
        <div className="flex items-center gap-2">
          <span className="text-xl">
            {interactiveLayer.type === 'poll' ? '📊' : 
             interactiveLayer.type === 'question' ? '❓' :
             interactiveLayer.type === 'slider' ? '📏' : '🎵'}
          </span>
          <span className="text-xs text-white/80 capitalize">{interactiveLayer.type}</span>
        </div>
      );
    }
  };

  const sortedLayers = [...layers].sort((a, b) => b.zIndex - a.zIndex);

  return (
    <div className="space-y-3">
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl p-3 border border-purple-500/20">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-purple-300" />
          <p className="text-purple-300 text-xs font-medium">Layer Management ({layers.length})</p>
        </div>
      </div>

      {layers.length === 0 ? (
        <div className="bg-white/5 rounded-xl p-6 border border-white/10 text-center">
          <Layers className="h-12 w-12 text-white/30 mx-auto mb-2" />
          <p className="text-white/50 text-sm">No layers yet</p>
          <p className="text-white/30 text-xs mt-1">Add text, stickers, or drawings</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
          {sortedLayers.map((layer, index) => (
            <div
              key={layer.id}
              onClick={() => onSelectLayer(layer.id)}
              className={`bg-white/5 rounded-xl p-3 border transition-all cursor-pointer hover:bg-white/10 ${
                selectedLayerId === layer.id
                  ? 'border-primary bg-primary/10'
                  : 'border-white/10'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {getLayerPreview(layer)}
                </div>

                <div className="flex items-center gap-1">
                  {/* Visibility Toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLayerVisibility(layer.id);
                    }}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    {hiddenLayers.has(layer.id) ? (
                      <EyeOff className="h-4 w-4 text-white/40" />
                    ) : (
                      <Eye className="h-4 w-4 text-white/70" />
                    )}
                  </button>

                  {/* Lock Toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLayerLock(layer.id);
                    }}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    {lockedLayers.has(layer.id) ? (
                      <Lock className="h-4 w-4 text-yellow-400" />
                    ) : (
                      <Unlock className="h-4 w-4 text-white/40" />
                    )}
                  </button>

                  {/* Move Up */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveLayerUp(layer.id);
                    }}
                    disabled={index === 0}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-30"
                  >
                    <ChevronUp className="h-4 w-4 text-white/70" />
                  </button>

                  {/* Move Down */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveLayerDown(layer.id);
                    }}
                    disabled={index === sortedLayers.length - 1}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-30"
                  >
                    <ChevronDown className="h-4 w-4 text-white/70" />
                  </button>

                  {/* Duplicate */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicateLayer(layer.id);
                    }}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <Copy className="h-4 w-4 text-blue-400" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Delete this layer?')) {
                        onDeleteLayer(layer.id);
                      }
                    }}
                    className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Layer Actions */}
      {layers.length > 0 && (
        <div className="bg-white/5 rounded-xl p-3 border border-white/10">
          <div className="text-white/60 text-xs space-y-1">
            <p>👁️ <span className="text-white/80">Hide/show</span> layers</p>
            <p>🔒 <span className="text-white/80">Lock</span> to prevent edits</p>
            <p>⬆️⬇️ <span className="text-white/80">Reorder</span> layers</p>
            <p>📋 <span className="text-white/80">Duplicate</span> or delete</p>
          </div>
        </div>
      )}
    </div>
  );
}
