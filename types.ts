
export interface StylePreset {
  id: string;
  name: string;
  description: string;
  prompt: string;
  icon: string;
  isCustom?: boolean;
}

export interface CapturedImage {
  dataUrl: string;
  analysis?: string;
}

export interface AppState {
  step: 'welcome' | 'camera' | 'review' | 'transforming' | 'result';
  capturedImage: CapturedImage | null;
  selectedStyle: StylePreset | null;
  resultImage: string | null;
  error: string | null;
}
