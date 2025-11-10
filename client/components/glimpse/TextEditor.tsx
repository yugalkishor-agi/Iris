import { useState, useEffect } from 'react';
import { X, Type, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useGlimpseEditorStore, TextLayer } from '@/stores/glimpseEditorStore';
import { HexColorPicker } from 'react-colorful';
import { SelectionIndicator } from './SelectionIndicator';
import './editor-animations.css';
import './editor-scrollbar.css';

const fonts = ['Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana', 'Impact', 'Comic Sans MS'];
const animations = ['none', 'fade', 'bounce', 'slide', 'zoom', 'typewriter'];

export function TextEditor() {
  const {
    textLayers,
    selectedTextId,
    addTextLayer,
    updateTextLayer,
    deleteTextLayer,
    setSelectedText,
    currentTime,
    duration,
    setActiveTool,
    videoWidth,
    videoHeight,
  } = useGlimpseEditorStore();

  const selectedText = textLayers.find(t => t.id === selectedTextId);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  const [textContent, setTextContent] = useState('');
  const [fontSize, setFontSize] = useState(32);
  const [fontFamily, setFontFamily] = useState('Arial');
  const [color, setColor] = useState('#ffffff');
  const [fontWeight, setFontWeight] = useState<'normal' | 'bold'>('normal');
  const [fontStyle, setFontStyle] = useState<'normal' | 'italic'>('normal');
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');
  const [underline, setUnderline] = useState(false);
  const [animation, setAnimation] = useState<TextLayer['animation']>('none');

  useEffect(() => {
    if (selectedText) {
      setTextContent(selectedText.content);
      setFontSize(selectedText.fontSize);
      setFontFamily(selectedText.fontFamily);
      setColor(selectedText.fill);
      setFontWeight(selectedText.fontWeight);
      setFontStyle(selectedText.fontStyle);
      setTextAlign(selectedText.align);
      setUnderline(selectedText.underline);
      setAnimation(selectedText.animation);
    }
  }, [selectedText]);

  const handleAddText = () => {
    const newText: TextLayer = {
      id: `text-${Date.now()}`,
      content: textContent || 'New Text',
      x: 50,
      y: 50,
      rotation: 0,
      scale: 1,
      fontSize,
      fontFamily,
      fill: color,
      strokeWidth: 0,
      align: textAlign,
      fontStyle,
      fontWeight,
      underline,
      textDecoration: underline ? 'underline' : 'none',
      animation,
      startTime: currentTime,
      endTime: currentTime + 5,
      shadow: false,
      shadowBlur: 0,
      shadowColor: 'rgba(0,0,0,0.5)',
    };

    addTextLayer(newText);
    setTextContent('');
  };

  const handleUpdateText = () => {
    if (!selectedTextId) return;

    updateTextLayer(selectedTextId, {
      content: textContent,
      fontSize,
      fontFamily,
      fill: color,
      fontWeight,
      fontStyle,
      align: textAlign,
      underline,
      textDecoration: underline ? 'underline' : 'none',
      animation,
    });
    
    // Show animation feedback
    setAnimating(true);
    setTimeout(() => setAnimating(false), 1000);
  };

  const handleDelete = () => {
    if (selectedTextId) {
      deleteTextLayer(selectedTextId);
      setSelectedText(null);
    }
  };
  
  const handleMoveText = (id: string, dx: number, dy: number) => {
    if (!selectedText) return;
    
    const newX = Math.max(0, Math.min(videoWidth - 20, selectedText.x + dx));
    const newY = Math.max(0, Math.min(videoHeight - 20, selectedText.y + dy));
    
    updateTextLayer(id, { x: newX, y: newY });
  };
  
  const handleRotateText = (id: string, angle: number) => {
    if (!selectedText) return;
    
    const newRotation = (selectedText.rotation + angle) % 360;
    updateTextLayer(id, { rotation: newRotation });
  };
  
  const handleDuplicateText = (id: string) => {
    if (!selectedText) return;
    
    const newText = {
      ...selectedText,
      id: `text-${Date.now()}`,
      x: selectedText.x + 20,
      y: selectedText.y + 20,
    };
    
    addTextLayer(newText);
  };
  
  const togglePreviewMode = () => {
    setPreviewMode(!previewMode);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-black via-gray-900 to-transparent z-40 p-6 max-h-[80vh] overflow-y-auto glimpse-scrollbar glimpse-scrollbar-vertical glimpse-smooth-scroll">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center animate-pulse-ring">
              <Type className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-white text-lg font-semibold">Text Editor</h3>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={previewMode ? "default" : "outline"} 
                  size="icon" 
                  onClick={togglePreviewMode}
                  className={`${previewMode ? 'bg-primary' : ''}`}
                >
                  <Sparkles className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">Preview Mode</TooltipContent>
            </Tooltip>
            <Button variant="ghost" size="icon" onClick={() => setActiveTool('none')}>
              <X className="h-5 w-5 text-white" />
            </Button>
          </div>
        </div>

        {/* Text Input */}
        <div className="mb-6">
          <Input
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            placeholder="Enter your text..."
            className={`bg-white/10 border-white/20 text-white text-lg placeholder:text-white/40 ${animating ? 'animate-pulse-ring' : ''}`}
          />
        </div>

        {/* Font Style Controls */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <Button
            variant={fontWeight === 'bold' ? 'default' : 'outline'}
            onClick={() => setFontWeight(fontWeight === 'bold' ? 'normal' : 'bold')}
            className="h-12"
          >
            <Bold className="h-5 w-5" />
          </Button>
          <Button
            variant={fontStyle === 'italic' ? 'default' : 'outline'}
            onClick={() => setFontStyle(fontStyle === 'italic' ? 'normal' : 'italic')}
            className="h-12"
          >
            <Italic className="h-5 w-5" />
          </Button>
          <Button
            variant={underline ? 'default' : 'outline'}
            onClick={() => setUnderline(!underline)}
            className="h-12"
          >
            <Underline className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="h-12"
          >
            <div className="w-6 h-6 rounded-full border-2 border-white" style={{ backgroundColor: color }} />
          </Button>
        </div>

        {/* Color Picker */}
        {showColorPicker && (
          <div className="mb-4 p-4 bg-white/10 rounded-lg">
            <HexColorPicker color={color} onChange={setColor} />
          </div>
        )}

        {/* Text Alignment */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <Button
            variant={textAlign === 'left' ? 'default' : 'outline'}
            onClick={() => setTextAlign('left')}
          >
            <AlignLeft className="h-5 w-5" />
          </Button>
          <Button
            variant={textAlign === 'center' ? 'default' : 'outline'}
            onClick={() => setTextAlign('center')}
          >
            <AlignCenter className="h-5 w-5" />
          </Button>
          <Button
            variant={textAlign === 'right' ? 'default' : 'outline'}
            onClick={() => setTextAlign('right')}
          >
            <AlignRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Font Size */}
        <div className="mb-4">
          <label className="text-white text-sm mb-2 block">Font Size: {fontSize}px</label>
          <Slider
            value={[fontSize]}
            min={12}
            max={120}
            step={1}
            onValueChange={([val]) => setFontSize(val)}
            className="w-full"
          />
        </div>

        {/* Font Family */}
        <div className="mb-4">
          <label className="text-white text-sm mb-2 block">Font Family</label>
          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-md px-3 py-2 text-white"
          >
            {fonts.map(font => (
              <option key={font} value={font} style={{ fontFamily: font }}>
                {font}
              </option>
            ))}
          </select>
        </div>

        {/* Animation */}
        <div className="mb-6">
          <label className="text-white text-sm mb-2 block">Animation</label>
          <div className="grid grid-cols-3 gap-2">
            {animations.map(anim => (
              <Button
                key={anim}
                variant={animation === anim ? 'default' : 'outline'}
                onClick={() => setAnimation(anim as TextLayer['animation'])}
                className="capitalize"
              >
                {anim}
              </Button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {selectedText ? (
            <>
              <Button 
                onClick={handleUpdateText} 
                className={`flex-1 bg-primary ${animating ? 'animate-bounce-once' : ''}`}
              >
                Update Text
              </Button>
              <Button 
                onClick={handleDelete} 
                variant="destructive" 
                className="flex-1 hover:bg-red-600 transition-colors"
              >
                Delete
              </Button>
            </>
          ) : (
            <Button 
              onClick={handleAddText} 
              className="w-full bg-primary hover:bg-primary/80 transition-colors"
            >
              Add Text
            </Button>
          )}
        </div>
        
        {/* Selection Indicator for selected text */}
        {selectedText && !previewMode && (
          <SelectionIndicator
            type="text"
            id={selectedText.id}
            x={selectedText.x}
            y={selectedText.y}
            width={selectedText.content.length * selectedText.fontSize * 0.6}
            height={selectedText.fontSize * 1.2}
            rotation={selectedText.rotation}
            onMove={handleMoveText}
            onRotate={handleRotateText}
            onDelete={handleDelete}
            onDuplicate={handleDuplicateText}
            onSelect={() => setSelectedText(selectedText.id)}
          />
        )}
      </div>
    </div>
  );
}
