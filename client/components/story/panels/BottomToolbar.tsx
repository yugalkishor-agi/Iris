import { useStoryEditorStore } from '@/stores/storyEditorStore';
import { Type, Pencil, Smile, Wand2, Music, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BottomToolbar() {
  const { activeTool, setActiveTool } = useStoryEditorStore();

  const tools = [
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'draw', icon: Pencil, label: 'Draw' },
    { id: 'sticker', icon: Smile, label: 'Sticker' },
    { id: 'filter', icon: Wand2, label: 'Filter' },
    { id: 'music', icon: Music, label: 'Music' },
    { id: 'background', icon: Palette, label: 'Background' },
  ] as const;

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-6 pb-8">
      <div className="max-w-md mx-auto flex items-center justify-around gap-2">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          
          return (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id as any)}
              className="flex flex-col items-center gap-2 transition-all duration-200"
            >
              <div
                className={`
                  relative p-3 rounded-2xl transition-all duration-300
                  ${isActive 
                    ? 'bg-gradient-to-br from-purple-600 to-pink-600 scale-110 shadow-lg shadow-purple-500/50' 
                    : 'bg-white/10 hover:bg-white/20 hover:scale-105'
                  }
                `}
              >
                <Icon className="h-6 w-6 text-white" />
                {isActive && (
                  <div className="absolute -inset-0.5 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl blur opacity-50 -z-10 animate-pulse" />
                )}
              </div>
              <span className={`text-xs font-medium transition-all ${isActive ? 'text-white' : 'text-white/60'}`}>
                {tool.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
