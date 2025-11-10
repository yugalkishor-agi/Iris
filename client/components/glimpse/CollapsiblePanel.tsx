import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import './editor-animations.css';

interface CollapsiblePanelProps {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  children: React.ReactNode;
}

export function CollapsiblePanel({
  title,
  icon,
  defaultOpen = true,
  className = '',
  headerClassName = '',
  contentClassName = '',
  children
}: CollapsiblePanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const togglePanel = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`border border-white/10 rounded-lg overflow-hidden mb-4 ${className}`}>
      <div 
        className={`flex items-center justify-between p-3 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors ${headerClassName}`}
        onClick={togglePanel}
      >
        <div className="flex items-center gap-2">
          {icon && (
            <div className="w-5 h-5 flex items-center justify-center">
              {icon}
            </div>
          )}
          <h3 className="text-white font-medium">{title}</h3>
        </div>
        <div className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDown className="h-5 w-5 text-white/70" />
        </div>
      </div>
      
      {isOpen && (
        <div className={`p-4 bg-black/30 animate-slide-in-down ${contentClassName}`}>
          {children}
        </div>
      )}
    </div>
  );
}

export function SideCollapsiblePanel({
  title,
  icon,
  defaultOpen = true,
  className = '',
  headerClassName = '',
  contentClassName = '',
  children
}: CollapsiblePanelProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const togglePanel = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`border-l-4 border-primary/50 pl-2 mb-4 ${className}`}>
      <div 
        className={`flex items-center gap-2 py-2 cursor-pointer hover:bg-white/5 rounded px-2 transition-colors ${headerClassName}`}
        onClick={togglePanel}
      >
        <div className={`transition-transform duration-200`}>
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-white/70" />
          ) : (
            <ChevronRight className="h-4 w-4 text-white/70" />
          )}
        </div>
        {icon && (
          <div className="w-4 h-4 flex items-center justify-center">
            {icon}
          </div>
        )}
        <h3 className="text-white/90 text-sm font-medium">{title}</h3>
      </div>
      
      {isOpen && (
        <div className={`pl-6 py-2 animate-slide-in-right ${contentClassName}`}>
          {children}
        </div>
      )}
    </div>
  );
}