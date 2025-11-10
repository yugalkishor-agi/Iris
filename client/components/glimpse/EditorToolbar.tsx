import { Type, Music, Palette, Sticker, Pen, Scissors, Zap, Volume2, Command, Settings, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { KeyboardShortcutsButton } from './KeyboardShortcuts';
import { CollapsiblePanel, SideCollapsiblePanel } from './CollapsiblePanel';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import './editor-scrollbar.css';
import './editor-animations.css';
import { useState, useEffect } from 'react';

interface EditorToolbarProps {
  activeTool: string;
  onToolChange: (tool: 'none' | 'text' | 'sticker' | 'audio' | 'filter' | 'draw' | 'effects' | 'crop' | 'trim' | 'speed') => void;
}

const tools = [
  { id: 'text', icon: Type, label: 'Text', color: 'text-blue-400' },
  { id: 'sticker', icon: Sticker, label: 'Stickers', color: 'text-pink-400' },
  { id: 'audio', icon: Music, label: 'Audio', color: 'text-green-400' },
  { id: 'filter', icon: Palette, label: 'Filters', color: 'text-purple-400' },
  { id: 'draw', icon: Pen, label: 'Draw', color: 'text-orange-400' },
  { id: 'trim', icon: Scissors, label: 'Trim', color: 'text-yellow-400' },
  { id: 'speed', icon: Zap, label: 'Speed', color: 'text-cyan-400' },
  { id: 'effects', icon: Volume2, label: 'Effects', color: 'text-red-400' },
];

export function EditorToolbar({ activeTool, onToolChange }: EditorToolbarProps) {
  const [lastActiveTool, setLastActiveTool] = useState<string | null>(null);
  const [animatingTool, setAnimatingTool] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Initialize keyboard shortcuts
  useKeyboardShortcuts();
  
  // Handle tool change with animation
  const handleToolChange = (toolId: string) => {
    const newTool = toolId === activeTool ? 'none' : toolId;
    
    // Set animating state for the clicked tool
    setAnimatingTool(toolId);
    setTimeout(() => setAnimatingTool(null), 300);
    
    // Update last active tool for transition effect
    setLastActiveTool(activeTool);
    
    // Call the parent handler
    onToolChange(newTool as any);
  };
  
  // Reset last active tool after animation completes
  useEffect(() => {
    if (lastActiveTool) {
      const timer = setTimeout(() => setLastActiveTool(null), 300);
      return () => clearTimeout(timer);
    }
  }, [lastActiveTool]);

  return (
    <div className="bg-gradient-to-t from-black via-gray-900 to-black border-t border-white/20 p-4 relative">
      {/* Collapse/Expand button */}
      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
        <Button 
          variant="outline" 
          size="icon" 
          className="h-8 w-8 rounded-full bg-black border border-white/20 shadow-lg"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? (
            <ChevronUp className="h-4 w-4 text-white/70" />
          ) : (
            <ChevronDown className="h-4 w-4 text-white/70" />
          )}
        </Button>
      </div>
      
      {/* Utility buttons */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <KeyboardShortcutsButton />
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setShowSettings(!showSettings)}
              className={`h-8 w-8 rounded-full bg-white/5 ${showSettings ? 'bg-primary/20 border-primary' : ''}`}
            >
              <Settings className="h-4 w-4 text-white/70" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Settings</TooltipContent>
        </Tooltip>
      </div>
      
      {/* Main toolbar */}
      <div className={`flex items-center gap-3 overflow-x-auto glimpse-scrollbar glimpse-scrollbar-horizontal pb-2 transition-all duration-300 ${isCollapsed ? 'max-h-0 opacity-0 overflow-hidden' : 'max-h-24 opacity-100'}`}>
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;
          const wasActive = lastActiveTool === tool.id;
          const isAnimating = animatingTool === tool.id;
          
          return (
            <Tooltip key={tool.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleToolChange(tool.id)}
                  className={`
                    flex flex-col items-center gap-2 p-3 rounded-xl min-w-[70px]
                    transition-all duration-300 transform
                    ${isAnimating ? 'scale-90' : ''}
                    ${isActive 
                      ? 'bg-primary/20 border-2 border-primary shadow-lg shadow-primary/20 scale-105' 
                      : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:scale-105 active:scale-95'}
                  `}
                >
                  <div className="relative">
                    <Icon 
                      className={`
                        h-6 w-6 transition-all duration-300
                        ${isActive ? 'text-primary scale-110' : tool.color}
                        ${wasActive ? 'animate-bounce-once' : ''}
                      `} 
                    />
                    {isActive && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-pulse" />
                    )}
                  </div>
                  <span 
                    className={`
                      text-xs font-medium transition-all duration-300
                      ${isActive ? 'text-primary' : 'text-white/80'}
                    `}
                  >
                    {tool.label}
                  </span>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="bg-black/90 border-primary/30">
                {tool.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
      
      {/* Settings panel */}
      {showSettings && (
        <div className="mt-4 border-t border-white/10 pt-4 animate-fade-in">
          <div className="grid grid-cols-2 gap-4">
            <SideCollapsiblePanel title="Interface" icon={<Settings className="h-3 w-3 text-white/70" />}>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-white/80 text-sm">Dark mode</span>
                  <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                    Enabled
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/80 text-sm">Show tooltips</span>
                  <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                    Enabled
                  </Button>
                </div>
              </div>
            </SideCollapsiblePanel>
            
            <SideCollapsiblePanel title="Performance" icon={<Zap className="h-3 w-3 text-white/70" />}>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-white/80 text-sm">Preview quality</span>
                  <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                    High
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/80 text-sm">Auto-save</span>
                  <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                    5 min
                  </Button>
                </div>
              </div>
            </SideCollapsiblePanel>
          </div>
        </div>
      )}
    </div>
  );
}
