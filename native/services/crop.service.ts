import { Platform} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { editorFlags } from '../config/editorFlags';
import { Image } from 'expo-image';
import { Image as RNImage } from 'react-native';

const safeRequire = (name: string): any => {
  try { return (eval('require') as any)(name); } catch { return undefined; }
};

export interface CropOptions {
  aspectRatio?: { w: number; h: number };
}

class CropService {
  async cropImage(input: string, options: CropOptions = {}): Promise<string> {
    const { aspectRatio } = options;

    // Try Android native crop UI via react-native-image-crop-picker (uses uCrop internally)
    if (Platform.OS === 'android' && editorFlags.useAndroidUCrop) {
      try {
        const ImageCropPicker: any = safeRequire('react-native-image-crop-picker');
        if (ImageCropPicker?.openCropper) {
          const size = await this.getImageSize(input);
          const srcW = size?.width || 1080;
          const srcH = size?.height || 1920;
          let outW: number | undefined = undefined;
          let outH: number | undefined = undefined;
          if (aspectRatio && aspectRatio.w > 0 && aspectRatio.h > 0) {
            // Maintain aspect ratio; choose output width up to source width
            const ar = aspectRatio.w / aspectRatio.h;
            outW = srcW;
            outH = Math.round(outW / ar);
            if (outH > srcH) {
              outH = srcH;
              outW = Math.round(outH * ar);
            }
          }
          const result = await ImageCropPicker.openCropper({
            path: input,
            cropping: true,
            freeStyleCropEnabled: !aspectRatio,
            width: outW,
            height: outH,
            compressImageQuality: 0.9,
            includeBase64: false,
            mediaType: 'photo',
          });
          const uri = result?.path || result?.sourceURL || result?.uri;
          if (uri) return uri;
        }
      } catch {}
    }

    // Fallback: center-crop with expo-image-manipulator
    try {
      const size = await this.getImageSize(input);
      if (!size) return input;
      const { width, height } = size;
      if (!aspectRatio || aspectRatio.w <= 0 || aspectRatio.h <= 0) {
        // No aspect provided: return original
        return input;
      }
      const target = aspectRatio.w / aspectRatio.h;
      const current = width / height;
      let cropW = width; let cropH = height;
      if (current > target) {
        // too wide -> crop width
        cropH = height;
        cropW = Math.round(height * target);
      } else {
        // too tall -> crop height
        cropW = width;
        cropH = Math.round(width / target);
      }
      const originX = Math.max(0, Math.round((width - cropW) / 2));
      const originY = Math.max(0, Math.round((height - cropH) / 2));
      const res = await ImageManipulator.manipulateAsync(
        input,
        [{ crop: { originX, originY, width: cropW, height: cropH } }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );
      return res?.uri || input;
    } catch {
      return input;
    }
  }

  private async getImageSize(uri: string): Promise<{ width: number; height: number } | null> {
    return new Promise(resolve => {
      try {
        RNImage.getSize(uri, (w, h) => resolve({ width: w, height: h }), () => resolve(null));
      } catch {
        resolve(null);
      }
    });
  }
}

export const cropService = new CropService();
