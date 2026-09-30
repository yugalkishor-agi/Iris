import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  PanResponder,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing, borderRadius, typography } from '../../styles/theme';

const { width, height } = Dimensions.get('window');

interface DrawingToolProps {
  visible: boolean;
  onClose: () => void;
  onSaveDrawing: (svgData: string) => void;
}

interface PathData {
  id: string;
  path: string;
  color: string;
  strokeWidth: number;
  opacity?: number;
}

export function DrawingTool({ visible, onClose, onSaveDrawing }: DrawingToolProps) {
  const [paths, setPaths] = useState<PathData[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [selectedColor, setSelectedColor] = useState('#FFFFFF');
  const [strokeWidth, setStrokeWidth] = useState(5);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'marker' | 'highlighter' | 'eraser'>('pen');
  const [eraserPath, setEraserPath] = useState('');
  
  const pathRef = useRef('');
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number>(0);
  const lastPointRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastEraserPointRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  // On low-end devices / emulators, throttle more aggressively to reduce JS/render load
  const THROTTLE_MS = 72; // ~14 fps updates
  const MIN_SEGMENT_DIST = 8; // px minimum movement to append a point

  const drawingColors = [
    '#FFFFFF', '#000000', '#FF4444', '#44FF44', '#4444FF',
    '#FFFF44', '#FF44FF', '#44FFFF', '#FFA500', '#800080',
    '#FF69B4', '#32CD32', '#FF1493', '#00CED1', '#FFD700'
  ];

  const strokeWidths = [2, 5, 8, 12, 16, 20];

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      if (tool === 'eraser') {
        const p = `M${locationX},${locationY}`;
        setEraserPath(p);
        lastEraserPointRef.current = { x: locationX, y: locationY };
      } else {
        pathRef.current = `M${locationX},${locationY}`;
        setCurrentPath(pathRef.current);
        lastPointRef.current = { x: locationX, y: locationY };
      }
      setIsDrawing(true);
    },
    onPanResponderMove: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      if (tool === 'eraser') {
        // Update eraser path with throttling + distance gating
        const now = Date.now();
        const dx = locationX - lastEraserPointRef.current.x;
        const dy = locationY - lastEraserPointRef.current.y;
        if ((now - lastTsRef.current > THROTTLE_MS) && (dx*dx + dy*dy) >= (MIN_SEGMENT_DIST * MIN_SEGMENT_DIST)) {
          lastTsRef.current = now;
          lastEraserPointRef.current = { x: locationX, y: locationY };
          setEraserPath(prev => (prev ? prev + ` L${locationX},${locationY}` : `M${locationX},${locationY}`));
        }
        return;
      }
      // Throttle drawing updates and decimate points by distance
      const now = Date.now();
      const dx = locationX - lastPointRef.current.x;
      const dy = locationY - lastPointRef.current.y;
      if ((now - lastTsRef.current > THROTTLE_MS) && (dx*dx + dy*dy) >= (MIN_SEGMENT_DIST * MIN_SEGMENT_DIST)) {
        lastTsRef.current = now;
        lastPointRef.current = { x: locationX, y: locationY };
        pathRef.current += ` L${locationX},${locationY}`;
        const req = () => setCurrentPath(pathRef.current);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(req);
      }
    },
    onPanResponderRelease: () => {
      if (tool === 'eraser') {
        if (eraserPath) {
          try {
            const eraserPts = parsePathPoints(eraserPath);
            const threshold = Math.max(8, strokeWidth);
            setPaths(prev => prev.filter(p => {
              const pts = parsePathPoints(p.path);
              // quick reject via bounding box
              const eb = bounds(eraserPts);
              const pb = bounds(pts);
              if (!intersects(eb, pb)) return true;
              // check min distance between any points (approx)
              for (let i = 0; i < eraserPts.length; i++) {
                const ept = eraserPts[i];
                for (let j = 0; j < pts.length; j++) {
                  const ppt = pts[j];
                  const dx = ept.x - ppt.x;
                  const dy = ept.y - ppt.y;
                  const d = Math.sqrt(dx*dx + dy*dy);
                  if (d <= threshold) return false; // erase this stroke
                }
              }
              return true;
            }));
          } catch {}
        }
        setEraserPath('');
      } else if (pathRef.current) {
        const newPath: PathData = {
          id: Date.now().toString(),
          path: pathRef.current,
          color: selectedColor,
          strokeWidth,
          opacity: tool === 'marker' ? 0.7 : tool === 'highlighter' ? 0.45 : 1,
        };
        setPaths(prev => [...prev, newPath]);
        setCurrentPath('');
        pathRef.current = '';
      }
      setIsDrawing(false);
    },
  });

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null as any;
      }
      pathRef.current = '';
      setCurrentPath('');
    };
  }, []);

  const handleUndo = () => {
    setPaths(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPaths([]);
    setCurrentPath('');
    pathRef.current = '';
  };

  const handleSave = () => {
    if (paths.length > 0) {
      // Create SVG string from paths
      const svgPaths = paths.map(path => 
        `<path d="${path.path}" stroke="${path.color}" stroke-opacity="${path.opacity ?? 1}" stroke-width="${path.strokeWidth}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
      ).join('');
      
      const svgData = `<svg width="${width}" height="${height * 0.7}" xmlns="http://www.w3.org/2000/svg">${svgPaths}</svg>`;
      onSaveDrawing(svgData);
    }
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.headerButton}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.title}>Draw</Text>
            <TouchableOpacity 
              onPress={handleSave} 
              style={[styles.headerButton, styles.saveButton]}
              disabled={paths.length === 0}
            >
              <Text style={[styles.saveText, paths.length === 0 && styles.disabledText]}>
                Save
              </Text>
            </TouchableOpacity>
          </View>

          {/* Drawing Canvas */}
          <View style={styles.canvasContainer} {...panResponder.panHandlers} renderToHardwareTextureAndroid needsOffscreenAlphaCompositing collapsable={false}>
            <Svg style={styles.canvas} width={width} height={height * 0.6}>
              {/* Render saved paths */}
              {paths.map((pathData) => (
                <Path
                  key={pathData.id}
                  d={pathData.path}
                  stroke={pathData.color}
                  strokeWidth={pathData.strokeWidth}
                  opacity={pathData.opacity ?? 1}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
              {/* Render current drawing path */}
              {currentPath && (
                <Path
                  d={currentPath}
                  stroke={selectedColor}
                  strokeWidth={strokeWidth}
                  opacity={tool === 'marker' ? 0.7 : tool === 'highlighter' ? 0.45 : 1}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {/* Render eraser path for feedback (optional subtle) */}
              {tool === 'eraser' && eraserPath ? (
                <Path d={eraserPath} stroke="#fff" strokeOpacity={0.6 as any} strokeWidth={Math.max(12, strokeWidth * 1.5)} fill="none" strokeLinecap="round" strokeLinejoin="round" />
              ) : null}
            </Svg>
            
            {/* Drawing Instructions */}
            {paths.length === 0 && !isDrawing && (
              <View style={styles.instructionsContainer}>
                <Ionicons name="brush" size={48} color={colors.text.secondary} />
                <Text style={styles.instructionsText}>
                  Start drawing with your finger
                </Text>
              </View>
            )}
          </View>

          {/* Tools */}
          <View style={styles.toolsContainer}>
            {/* Tool Mode */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tool</Text>
              <View style={styles.sizeRow}>
                <TouchableOpacity onPress={() => setTool('pen')} style={[styles.modeButton, tool === 'pen' && styles.modeSelected]}>
                  <Ionicons name="pencil" size={18} color={tool === 'pen' ? colors.text.inverse : colors.text.primary} />
                  <Text style={[styles.modeText, tool === 'pen' && styles.modeTextSelected]}>Pen</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setTool('marker')} style={[styles.modeButton, tool === 'marker' && styles.modeSelected]}>
                  <Ionicons name="brush" size={18} color={tool === 'marker' ? colors.text.inverse : colors.text.primary} />
                  <Text style={[styles.modeText, tool === 'marker' && styles.modeTextSelected]}>Marker</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setTool('highlighter')} style={[styles.modeButton, tool === 'highlighter' && styles.modeSelected]}>
                  <Ionicons name="color-fill" size={18} color={tool === 'highlighter' ? colors.text.inverse : colors.text.primary} />
                  <Text style={[styles.modeText, tool === 'highlighter' && styles.modeTextSelected]}>Highlighter</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setTool('eraser')} style={[styles.modeButton, tool === 'eraser' && styles.modeSelected]}>
                  <Ionicons name="backspace" size={18} color={tool === 'eraser' ? colors.text.inverse : colors.text.primary} />
                  <Text style={[styles.modeText, tool === 'eraser' && styles.modeTextSelected]}>Eraser</Text>
                </TouchableOpacity>
              </View>
            </View>
            {/* Color Picker */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Color</Text>
              <View style={styles.colorRow}>
                {drawingColors.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorButton,
                      { backgroundColor: color },
                      color === '#FFFFFF' && styles.whiteColorBorder,
                      selectedColor === color && styles.selectedColor,
                    ]}
                    onPress={() => setSelectedColor(color)}
                  >
                    {selectedColor === color && (
                      <Ionicons 
                        name="checkmark" 
                        size={12} 
                        color={color === '#FFFFFF' ? '#000' : '#FFF'} 
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Brush Size */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Brush Size</Text>
              <View style={styles.sizeRow}>
                {strokeWidths.map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.sizeButton,
                      strokeWidth === size && styles.selectedSize,
                    ]}
                    onPress={() => setStrokeWidth(size)}
                  >
                    <View 
                      style={[
                        styles.sizeDot,
                        { 
                          width: size + 4, 
                          height: size + 4,
                          backgroundColor: strokeWidth === size ? '#FFFFFF' : colors.text.secondary,
                        }
                      ]} 
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionButton, paths.length === 0 && styles.disabledButton]}
                onPress={handleUndo}
                disabled={paths.length === 0}
              >
                <Ionicons 
                  name="arrow-undo" 
                  size={20} 
                  color={paths.length === 0 ? colors.text.secondary : colors.text.primary} 
                />
                <Text style={[
                  styles.actionText,
                  paths.length === 0 && styles.disabledText
                ]}>
                  Undo
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, paths.length === 0 && styles.disabledButton]}
                onPress={handleClear}
                disabled={paths.length === 0}
              >
                <Ionicons 
                  name="trash" 
                  size={20} 
                  color={paths.length === 0 ? colors.text.secondary : '#FF4444'} 
                />
                <Text style={[
                  styles.actionText,
                  paths.length === 0 && styles.disabledText
                ]}>
                  Clear
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function parsePathPoints(d: string): Array<{x:number;y:number}> {
  const pts: Array<{x:number;y:number}> = [];
  const tokens = d.replace(/M/g, ' M').replace(/L/g, ' L').trim().split(/\s+/);
  for (const t of tokens) {
    if (t === 'M' || t === 'L') continue;
    const parts = t.replace('M', '').replace('L', '').split(',');
    if (parts.length === 2) {
      const x = parseFloat(parts[0]);
      const y = parseFloat(parts[1]);
      if (!isNaN(x) && !isNaN(y)) pts.push({ x, y });
    }
  }
  return pts;
}

function bounds(pts: Array<{x:number;y:number}>) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of pts) { if (p.x < minX) minX = p.x; if (p.y < minY) minY = p.y; if (p.x > maxX) maxX = p.x; if (p.y > maxY) maxY = p.y; }
  return { minX, minY, maxX, maxY };
}

function intersects(a: {minX:number;minY:number;maxX:number;maxY:number}, b: {minX:number;minY:number;maxX:number;maxY:number}) {
  return a.minX <= b.maxX && a.maxX >= b.minX && a.minY <= b.maxY && a.maxY >= b.minY;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  modal: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerButton: {
    padding: spacing.xs,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  saveButton: {
    backgroundColor: colors.accent.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
  },
  saveText: {
    color: '#FFFFFF',
    fontWeight: typography.fontWeight.semibold,
  },
  disabledText: {
    opacity: 0.5,
  },
  canvasContainer: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    margin: spacing.md,
    borderRadius: borderRadius.lg,
    position: 'relative',
  },
  canvas: {
    flex: 1,
  },
  instructionsContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -75 }, { translateY: -40 }] as const,
    alignItems: 'center',
    gap: spacing.sm,
  },
  instructionsText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  toolsContainer: {
    backgroundColor: colors.background.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  colorRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  colorButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  whiteColorBorder: {
    borderColor: colors.border.medium,
  },
  selectedColor: {
    borderColor: colors.accent.primary,
    borderWidth: 3,
  },
  sizeRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  modeSelected: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  modeText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  modeTextSelected: {
    color: colors.text.inverse,
  },
  sizeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.secondary,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedSize: {
    backgroundColor: colors.accent.primary,
    borderColor: colors.accent.primary,
  },
  sizeDot: {
    borderRadius: 50,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  disabledButton: {
    opacity: 0.5,
  },
  actionText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
  },
});
