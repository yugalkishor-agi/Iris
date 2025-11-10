import React from 'react';
import { Command } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CollapsiblePanel } from './CollapsiblePanel';

interface ShortcutProps {
  keys: string[];
  description: string;
}

const Shortcut: React.FC<ShortcutProps> = ({ keys, description }) => {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-white/80 text-sm">{description}</span>
      <div className="flex items-center gap-1">
        {keys.map((key, index) => (
          <React.Fragment key={index}>
            <kbd className="px-2 py-1 bg-white/10 rounded text-xs font-mono text-white">
              {key}
            </kbd>
            {index < keys.length - 1 && <span className="text-white/50">+</span>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export function KeyboardShortcutsPanel() {
  return (
    <CollapsiblePanel 
      title="Keyboard Shortcuts" 
      icon={<Command className="h-4 w-4 text-white/70" />}
      defaultOpen={false}
    >
      <div className="space-y-4">
        <div>
          <h4 className="text-white/90 font-medium mb-2 text-sm">General</h4>
          <div className="space-y-1 border-l-2 border-white/10 pl-3">
            <Shortcut keys={['Ctrl', 'S']} description="Save project" />
            <Shortcut keys={['Ctrl', 'Z']} description="Undo" />
            <Shortcut keys={['Ctrl', 'Shift', 'Z']} description="Redo" />
            <Shortcut keys={['Esc']} description="Close current panel" />
          </div>
        </div>
        
        <div>
          <h4 className="text-white/90 font-medium mb-2 text-sm">Playback</h4>
          <div className="space-y-1 border-l-2 border-white/10 pl-3">
            <Shortcut keys={['Space']} description="Play/Pause" />
            <Shortcut keys={['←']} description="Step backward" />
            <Shortcut keys={['→']} description="Step forward" />
            <Shortcut keys={['Home']} description="Go to start" />
            <Shortcut keys={['End']} description="Go to end" />
          </div>
        </div>
        
        <div>
          <h4 className="text-white/90 font-medium mb-2 text-sm">Timeline</h4>
          <div className="space-y-1 border-l-2 border-white/10 pl-3">
            <Shortcut keys={['Ctrl', '+']} description="Zoom in" />
            <Shortcut keys={['Ctrl', '-']} description="Zoom out" />
            <Shortcut keys={['Ctrl', '0']} description="Reset zoom" />
            <Shortcut keys={['Shift', 'Scroll']} description="Horizontal scroll" />
          </div>
        </div>
        
        <div>
          <h4 className="text-white/90 font-medium mb-2 text-sm">Editing</h4>
          <div className="space-y-1 border-l-2 border-white/10 pl-3">
            <Shortcut keys={['T']} description="Text tool" />
            <Shortcut keys={['S']} description="Sticker tool" />
            <Shortcut keys={['F']} description="Filter tool" />
            <Shortcut keys={['A']} description="Audio tool" />
            <Shortcut keys={['Delete']} description="Delete selected" />
            <Shortcut keys={['Ctrl', 'D']} description="Duplicate selected" />
          </div>
        </div>
      </div>
    </CollapsiblePanel>
  );
}

export function KeyboardShortcutsButton() {
  const [isOpen, setIsOpen] = React.useState(false);
  
  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setIsOpen(true)}
            className="h-8 w-8 rounded-full bg-white/5"
          >
            <Command className="h-4 w-4 text-white/70" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">Keyboard Shortcuts</TooltipContent>
      </Tooltip>
      
      {isOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-gray-900 rounded-lg w-full max-w-md p-4 border border-white/10 shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white text-lg font-medium">Keyboard Shortcuts</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <span className="sr-only">Close</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white/70">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </Button>
            </div>
            
            <div className="space-y-6 max-h-[70vh] overflow-y-auto glimpse-scrollbar glimpse-scrollbar-vertical glimpse-smooth-scroll pr-2">
              <div>
                <h4 className="text-white/90 font-medium mb-2">General</h4>
                <div className="space-y-2">
                  <Shortcut keys={['Ctrl', 'S']} description="Save project" />
                  <Shortcut keys={['Ctrl', 'Z']} description="Undo" />
                  <Shortcut keys={['Ctrl', 'Shift', 'Z']} description="Redo" />
                  <Shortcut keys={['Esc']} description="Close current panel" />
                </div>
              </div>
              
              <div>
                <h4 className="text-white/90 font-medium mb-2">Playback</h4>
                <div className="space-y-2">
                  <Shortcut keys={['Space']} description="Play/Pause" />
                  <Shortcut keys={['←']} description="Step backward" />
                  <Shortcut keys={['→']} description="Step forward" />
                  <Shortcut keys={['Home']} description="Go to start" />
                  <Shortcut keys={['End']} description="Go to end" />
                </div>
              </div>
              
              <div>
                <h4 className="text-white/90 font-medium mb-2">Timeline</h4>
                <div className="space-y-2">
                  <Shortcut keys={['Ctrl', '+']} description="Zoom in" />
                  <Shortcut keys={['Ctrl', '-']} description="Zoom out" />
                  <Shortcut keys={['Ctrl', '0']} description="Reset zoom" />
                  <Shortcut keys={['Shift', 'Scroll']} description="Horizontal scroll" />
                </div>
              </div>
              
              <div>
                <h4 className="text-white/90 font-medium mb-2">Editing</h4>
                <div className="space-y-2">
                  <Shortcut keys={['T']} description="Text tool" />
                  <Shortcut keys={['S']} description="Sticker tool" />
                  <Shortcut keys={['F']} description="Filter tool" />
                  <Shortcut keys={['A']} description="Audio tool" />
                  <Shortcut keys={['Delete']} description="Delete selected" />
                  <Shortcut keys={['Ctrl', 'D']} description="Duplicate selected" />
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
              <Button onClick={() => setIsOpen(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}