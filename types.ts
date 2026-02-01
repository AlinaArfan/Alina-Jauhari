
export enum AspectRatio {
  SQUARE = '1:1',
  LANDSCAPE = '16:9',
  PORTRAIT = '9:16',
}

export enum ImageQuality {
  STANDARD = '1K',
  HD_2K = '2K',
  ULTRA_HD_4K = '4K',
}

export interface UploadedImage {
  id: string;
  file: File;
  previewUrl: string;
}

export interface HistoryItem {
  id: string;
  url: string;
  angle: string;
  timestamp: number;
  mode: string;
  category: string;
}

export enum NavItem {
  HOME = 'Dashboard',
  HISTORY = 'Riwayat Galeri',
  COMMERCIAL = 'Commercial Hub',
  UGC = 'UGC Studio',
  ADS = 'Ads Studio',
  HUMAN = 'Human Studio',
  MAGIC = 'Magic Tools',
  SEO = 'SEO Trends',
  LIVE = 'Live Assistant',
  COPYWRITER = 'Marketing Lab',
  LEARNING = 'Edu Center',
}
