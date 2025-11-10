import { useState } from 'react';
import { Type, Palette, Settings, AlignLeft, AlignCenter, AlignRight, ChevronLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { FONTS, TEXT_COLORS, TEXT_GRADIENTS, TEXT_ANIMATIONS, TEXT_EFFECTS_EXTENDED } from './EditorTypes';
import { MentionInput } from './MentionInput';

interface TextToolPanelProps {
  textInput: string;
  textFont: string;
  textSize: number;
  textColor: string;
  textBgColor: string;
  textEffect: string;
  textAlignment: 'left' | 'center' | 'right';
  letterSpacing?: number;
  lineHeight?: number;
  textOpacity?: number;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  fontWeight?: number;
  entranceAnimation?: 'none' | 'slideIn' | 'fadeIn' | 'bounceIn' | 'zoomIn' | 'popIn';
  backgroundMode?: 'none' | 'solid' | 'rounded';
  onTextInputChange: (text: string) => void;
  onFontChange: (font: string) => void;
  onSizeChange: (size: number) => void;
  onColorChange: (color: string) => void;
  onBgColorChange: (color: string) => void;
  onEffectChange: (effect: string) => void;
  onAlignmentChange: (alignment: 'left' | 'center' | 'right') => void;
  onLetterSpacingChange?: (spacing: number) => void;
  onLineHeightChange?: (height: number) => void;
  onOpacityChange?: (opacity: number) => void;
  onTextTransformChange?: (transform: 'none' | 'uppercase' | 'lowercase' | 'capitalize') => void;
  onFontWeightChange?: (weight: number) => void;
  onEntranceAnimationChange?: (animation: 'none' | 'slideIn' | 'fadeIn' | 'bounceIn' | 'zoomIn' | 'popIn') => void;
  onBackgroundModeChange?: (mode: 'none' | 'solid' | 'rounded') => void;
  onAddText: () => void;
}

type SubPanel = 'main' | 'font' | 'color' | 'style' | 'effects' | 'animations' | 'advanced';

export function TextToolPanel(props: TextToolPanelProps) {
  const [activePanel, setActivePanel] = useState<SubPanel>('main');

  // Main menu
  if (activePanel === 'main') {
    return (
      <div className="space-y-3 animate-fade-in">
        <MentionInput
          value={props.textInput}
          onChange={props.onTextInputChange}
          placeholder="Type your text... (use @ to mention)"
          className="w-full px-4 py-3 bg-white/10 text-white rounded-2xl focus:ring-2 focus:ring-primary outline-none placeholder-white/50"
        />

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setActivePanel('font')}
            className="flex flex-col items-center gap-2 p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
          >
            <Type className="h-5 w-5 text-white" />
            <span className="text-xs text-white/80">Font</span>
          </button>
          
          <button
            onClick={() => setActivePanel('color')}
            className="flex flex-col items-center gap-2 p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
          >
            <Palette className="h-5 w-5 text-white" />
            <span className="text-xs text-white/80">Colors</span>
          </button>
          
          <button
            onClick={() => setActivePanel('effects')}
            className="flex flex-col items-center gap-2 p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
          >
            <Sparkles className="h-5 w-5 text-white" />
            <span className="text-xs text-white/80">Effects</span>
          </button>
          
          <button
            onClick={() => setActivePanel('style')}
            className="flex flex-col items-center gap-2 p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
          >
            <Settings className="h-5 w-5 text-white" />
            <span className="text-xs text-white/80">Align</span>
          </button>
          
          <button
            onClick={() => setActivePanel('animations')}
            className="flex flex-col items-center gap-2 p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl hover:from-purple-500/30 hover:to-pink-500/30 transition-all border border-purple-500/30"
          >
            <Sparkles className="h-5 w-5 text-purple-300" />
            <span className="text-xs text-purple-300">Animations</span>
          </button>
          
          <button
            onClick={() => setActivePanel('advanced')}
            className="flex flex-col items-center gap-2 p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
          >
            <Settings className="h-5 w-5 text-white" />
            <span className="text-xs text-white/80">More</span>
          </button>
        </div>

        <Button
          onClick={props.onAddText}
          disabled={!props.textInput.trim()}
          className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-2xl disabled:opacity-50"
        >
          Add Text
        </Button>
      </div>
    );
  }

  // Font Panel
  if (activePanel === 'font') {
    return (
      <div className="space-y-4 animate-slide-up">
        <button
          onClick={() => setActivePanel('main')}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="text-sm">Back</span>
        </button>

        <div>
          <label className="text-white text-sm font-medium mb-2 block">Font Style</label>
          <div className="grid grid-cols-2 gap-2">
            {FONTS.map((font) => (
              <button
                key={font.name}
                onClick={() => props.onFontChange(font.value)}
                className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  props.textFont === font.value
                    ? 'bg-primary text-white scale-105'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
                style={{ fontFamily: font.value }}
              >
                {font.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-white text-sm font-medium mb-2 block">Size: {props.textSize}px</label>
          <Slider
            value={[props.textSize]}
            onValueChange={([val]) => props.onSizeChange(val)}
            min={16}
            max={72}
            step={1}
            className="w-full"
          />
        </div>
      </div>
    );
  }

  // Color Panel
  if (activePanel === 'color') {
    return (
      <div className="space-y-4 animate-slide-up">
        <button
          onClick={() => setActivePanel('main')}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="text-sm">Back</span>
        </button>

        <div>
          <label className="text-white text-sm font-medium mb-3 block">Text Color</label>
          <div className="grid grid-cols-5 gap-3">
            {TEXT_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => props.onColorChange(color)}
                className={`w-12 h-12 rounded-full border-2 transition-all hover:scale-110 ${
                  props.textColor === color ? 'border-white scale-110 shadow-lg' : 'border-white/30'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="text-white text-sm font-medium mb-3 block">Background</label>
          <div className="grid grid-cols-5 gap-3">
            <button
              onClick={() => props.onBgColorChange('transparent')}
              className={`w-12 h-12 rounded-full border-2 bg-gradient-to-br from-red-500 via-transparent to-blue-500 transition-all hover:scale-110 ${
                props.textBgColor === 'transparent' ? 'border-white scale-110 shadow-lg' : 'border-white/30'
              }`}
            />
            {TEXT_COLORS.filter((c) => c !== '#FFFFFF').map((color) => (
              <button
                key={color}
                onClick={() => props.onBgColorChange(color)}
                className={`w-12 h-12 rounded-full border-2 transition-all hover:scale-110 ${
                  props.textBgColor === color ? 'border-white scale-110 shadow-lg' : 'border-white/30'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="text-white text-sm font-medium mb-3 block">🌈 Gradients</label>
          <div className="grid grid-cols-2 gap-2">
            {TEXT_GRADIENTS.map((gradient) => (
              <button
                key={gradient.name}
                onClick={() => props.onColorChange(gradient.value)}
                className={`h-12 rounded-xl border-2 transition-all hover:scale-105 ${
                  props.textColor === gradient.value ? 'border-white scale-105 shadow-lg' : 'border-white/30'
                }`}
                style={{ background: gradient.value }}
              >
                <span className="text-xs font-bold text-white drop-shadow-lg">{gradient.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Effects Panel - Cool bulk effects
  if (activePanel === 'effects') {
    return (
      <div className="space-y-4 animate-slide-up">
        <button
          onClick={() => setActivePanel('main')}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="text-sm">Back</span>
        </button>

        <div>
          <label className="text-white text-sm font-medium mb-3 block">✨ Cool Effects</label>
          <div className="grid grid-cols-2 gap-2">
            {TEXT_EFFECTS_EXTENDED.map((effect) => (
              <button
                key={effect.value}
                onClick={() => props.onEffectChange(effect.value)}
                className={`px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  props.textEffect === effect.value
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white scale-105 shadow-lg'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {effect.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-white text-sm font-medium mb-3 block">🎬 Animations</label>
          <div className="grid grid-cols-2 gap-2">
            {TEXT_ANIMATIONS.map((anim) => (
              <button
                key={anim.value}
                onClick={() => props.onEffectChange(anim.value)}
                className="px-4 py-3 rounded-xl text-sm font-bold bg-white/10 text-white/90 hover:bg-white/20 transition-all"
              >
                {anim.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Style Panel - Alignment only
  if (activePanel === 'style') {
    return (
      <div className="space-y-4 animate-slide-up">
        <button
          onClick={() => setActivePanel('main')}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="text-sm">Back</span>
        </button>

        <div>
          <label className="text-white text-sm font-medium mb-3 block">Text Alignment</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { align: 'left' as const, icon: AlignLeft },
              { align: 'center' as const, icon: AlignCenter },
              { align: 'right' as const, icon: AlignRight }
            ].map(({ align, icon: Icon }) => (
              <button
                key={align}
                onClick={() => props.onAlignmentChange(align)}
                className={`p-4 rounded-xl transition-all ${
                  props.textAlignment === align
                    ? 'bg-primary text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                <Icon className="h-5 w-5 mx-auto" />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Animations Panel
  if (activePanel === 'animations') {
    return (
      <div className="space-y-4 animate-slide-up">
        <button
          onClick={() => setActivePanel('main')}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="text-sm">Back</span>
        </button>

        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-3 border border-purple-500/20">
          <p className="text-purple-300 text-xs font-medium">✨ Animations & Background</p>
        </div>

        {/* Entrance Animations */}
        <div>
          <label className="text-white text-sm font-medium mb-2 block">Entrance Animation</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'none' as const, label: 'None', emoji: '⚪' },
              { value: 'slideIn' as const, label: 'Slide In', emoji: '➡️' },
              { value: 'fadeIn' as const, label: 'Fade In', emoji: '🌫️' },
              { value: 'bounceIn' as const, label: 'Bounce', emoji: '🎾' },
              { value: 'zoomIn' as const, label: 'Zoom In', emoji: '🔍' },
              { value: 'popIn' as const, label: 'Pop In', emoji: '💥' }
            ].map(({ value, label, emoji }) => (
              <button
                key={value}
                onClick={() => props.onEntranceAnimationChange?.(value)}
                className={`py-3 px-3 rounded-xl text-xs font-medium transition-all ${
                  (props.entranceAnimation ?? 'none') === value
                    ? 'bg-primary text-white scale-105'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                <div className="text-lg mb-1">{emoji}</div>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Background Mode */}
        <div>
          <label className="text-white text-sm font-medium mb-2 block">Text Background</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'none' as const, label: 'None', emoji: '⚪' },
              { value: 'solid' as const, label: 'Solid', emoji: '▪️' },
              { value: 'rounded' as const, label: 'Rounded', emoji: '💊' }
            ].map(({ value, label, emoji }) => (
              <button
                key={value}
                onClick={() => props.onBackgroundModeChange?.(value)}
                className={`py-3 rounded-xl text-xs font-medium transition-all ${
                  (props.backgroundMode ?? 'none') === value
                    ? 'bg-primary text-white scale-105'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                <div className="text-lg mb-1">{emoji}</div>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Preview Info */}
        <div className="bg-white/5 rounded-xl p-3 border border-white/10">
          <p className="text-white/60 text-xs">🎬 Animation plays when text appears</p>
          <p className="text-white/60 text-xs mt-1">🎨 Background adds color behind text</p>
        </div>
      </div>
    );
  }

  // Advanced Typography Panel
  if (activePanel === 'advanced') {
    return (
      <div className="space-y-4 animate-slide-up">
        <button
          onClick={() => setActivePanel('main')}
          className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="text-sm">Back</span>
        </button>

        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-3 border border-purple-500/20">
          <p className="text-purple-300 text-xs">✨ Advanced Typography Controls</p>
        </div>

        {/* Letter Spacing */}
        <div>
          <label className="text-white text-sm font-medium mb-2 block">Letter Spacing: {props.letterSpacing ?? 0}px</label>
          <Slider
            value={[props.letterSpacing ?? 0]}
            onValueChange={([val]) => props.onLetterSpacingChange?.(val)}
            min={-5}
            max={20}
            step={0.5}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-white/50 mt-1">
            <span>Tight</span>
            <span>Normal</span>
            <span>Wide</span>
          </div>
        </div>

        {/* Line Height */}
        <div>
          <label className="text-white text-sm font-medium mb-2 block">Line Height: {props.lineHeight ?? 1.2}x</label>
          <Slider
            value={[props.lineHeight ?? 1.2]}
            onValueChange={([val]) => props.onLineHeightChange?.(val)}
            min={0.8}
            max={2.5}
            step={0.1}
            className="w-full"
          />
        </div>

        {/* Text Opacity */}
        <div>
          <label className="text-white text-sm font-medium mb-2 block">Opacity: {Math.round((props.textOpacity ?? 1) * 100)}%</label>
          <Slider
            value={[props.textOpacity ?? 1]}
            onValueChange={([val]) => props.onOpacityChange?.(val)}
            min={0.1}
            max={1}
            step={0.05}
            className="w-full"
          />
        </div>

        {/* Font Weight */}
        <div>
          <label className="text-white text-sm font-medium mb-2 block">Font Weight</label>
          <div className="grid grid-cols-4 gap-2">
            {[300, 400, 600, 800].map((weight) => (
              <button
                key={weight}
                onClick={() => props.onFontWeightChange?.(weight)}
                className={`py-2 rounded-lg text-xs font-medium transition-all ${
                  (props.fontWeight ?? 700) === weight
                    ? 'bg-primary text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
                style={{ fontWeight: weight }}
              >
                {weight === 300 ? 'Light' : weight === 400 ? 'Normal' : weight === 600 ? 'Bold' : 'Heavy'}
              </button>
            ))}
          </div>
        </div>

        {/* Text Transform */}
        <div>
          <label className="text-white text-sm font-medium mb-2 block">Text Transform</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'none' as const, label: 'Normal' },
              { value: 'uppercase' as const, label: 'UPPERCASE' },
              { value: 'lowercase' as const, label: 'lowercase' },
              { value: 'capitalize' as const, label: 'Capitalize' }
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => props.onTextTransformChange?.(value)}
                className={`py-2 rounded-lg text-xs transition-all ${
                  (props.textTransform ?? 'none') === value
                    ? 'bg-primary text-white font-medium'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
                style={{ textTransform: value }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
