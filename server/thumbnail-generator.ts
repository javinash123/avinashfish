import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

interface ThumbnailResult {
  thumbnailUrl: string;
  thumbnailUrlMd: string;
  thumbnailUrlLg: string;
}

interface ThumbnailConfig {
  width: number;
  height: number;
  suffix: string;
}

const THUMBNAIL_CONFIGS: Record<string, ThumbnailConfig> = {
  sm: { width: 442, height: 248, suffix: '-sm' },
  md: { width: 602, height: 338, suffix: '-md' },
  lg: { width: 884, height: 497, suffix: '-lg' }
};

export async function generateCompetitionThumbnails(
  sourcePath: string,
  outputDir: string,
  baseFilename: string
): Promise<ThumbnailResult> {
  const results: Partial<ThumbnailResult> = {};
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const ext = path.extname(baseFilename);
  const nameWithoutExt = path.basename(baseFilename, ext);

  for (const [size, config] of Object.entries(THUMBNAIL_CONFIGS)) {
    const thumbnailFilename = `${nameWithoutExt}${config.suffix}.webp`;
    const thumbnailPath = path.join(outputDir, thumbnailFilename);
    
    try {
      await sharp(sourcePath)
        .resize(config.width, config.height, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0.1 }
        })
        .webp({ quality: 85 })
        .toFile(thumbnailPath);
      
      const relativeUrl = `/attached-assets/uploads/competitions/${thumbnailFilename}`;
      
      if (size === 'sm') {
        results.thumbnailUrl = relativeUrl;
      } else if (size === 'md') {
        results.thumbnailUrlMd = relativeUrl;
      } else if (size === 'lg') {
        results.thumbnailUrlLg = relativeUrl;
      }
      
      console.log(`Generated ${size} thumbnail: ${thumbnailFilename} (${config.width}x${config.height})`);
    } catch (error) {
      console.error(`Error generating ${size} thumbnail:`, error);
      throw error;
    }
  }

  return results as ThumbnailResult;
}

export async function cleanupOldThumbnails(baseFilename: string, outputDir: string): Promise<void> {
  const ext = path.extname(baseFilename);
  const nameWithoutExt = path.basename(baseFilename, ext);
  
  for (const config of Object.values(THUMBNAIL_CONFIGS)) {
    const thumbnailFilename = `${nameWithoutExt}${config.suffix}.webp`;
    const thumbnailPath = path.join(outputDir, thumbnailFilename);
    
    if (fs.existsSync(thumbnailPath)) {
      try {
        fs.unlinkSync(thumbnailPath);
        console.log(`Cleaned up old thumbnail: ${thumbnailFilename}`);
      } catch (error) {
        console.error(`Error cleaning up thumbnail ${thumbnailFilename}:`, error);
      }
    }
  }
}
