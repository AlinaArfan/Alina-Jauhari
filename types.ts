
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

export interface GeneratedImageResult {
  url: string;
  timestamp: number;
}

// SUPER MODULES NAVIGATION
export enum NavItem {
  HOME = 'Dashboard',
  
  // 1. The Core (Edit & Manipulation)
  MAGIC_TOOLS = 'Magic Tools', // Gabungan: Edit, Gabung, Expand
  FACESWAP = 'Face Swap', // Tetap dipisah karena logicnya unik
  
  // 2. Affiliate & Business (The Money Maker)
  COMMERCIAL_HUB = 'Commercial Hub', // Gabungan: Produk, Fashion, Mockup, Magic Photographer
  ADS_STUDIO = 'Ads Studio', // Gabungan: Banner, Thumbnail, Carousel
  UGC_STUDIO = 'UGC Studio', // NEW: User Generated Content (Raw, Authentic, Review style)
  
  // 3. Human & Creative
  HUMAN_STUDIO = 'Human Studio', // Gabungan: Model, Prewed, Barbershop
  CREATIVE_LAB = 'Creative Lab', // Gabungan: Art, Sketch, Home
}
