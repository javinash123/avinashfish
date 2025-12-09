import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { IStorage } from './storage';

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

interface RegenerationResult {
  competitionId: string;
  competitionName: string;
  status: 'success' | 'skipped' | 'error';
  message: string;
  thumbnailUrl?: string;
  thumbnailUrlMd?: string;
  thumbnailUrlLg?: string;
}

export async function regenerateAllThumbnails(storage: IStorage): Promise<{
  processed: number;
  success: number;
  skipped: number;
  errors: number;
  results: RegenerationResult[];
}> {
  const results: RegenerationResult[] = [];
  let processed = 0;
  let success = 0;
  let skipped = 0;
  let errors = 0;

  try {
    const competitions = await storage.getAllCompetitions();
    
    for (const competition of competitions) {
      processed++;
      
      if (!competition.imageUrl) {
        results.push({
          competitionId: competition.id,
          competitionName: competition.name,
          status: 'skipped',
          message: 'No image URL found'
        });
        skipped++;
        continue;
      }

      const hasAllThumbnails = 
        (competition as any).thumbnailUrl && 
        (competition as any).thumbnailUrlMd && 
        (competition as any).thumbnailUrlLg;

      if (hasAllThumbnails) {
        results.push({
          competitionId: competition.id,
          competitionName: competition.name,
          status: 'skipped',
          message: 'Thumbnails already exist'
        });
        skipped++;
        continue;
      }

      try {
        const thumbnails = await generateThumbnailsForCompetition(competition.imageUrl);
        
        await storage.updateCompetition(competition.id, {
          thumbnailUrl: thumbnails.thumbnailUrl,
          thumbnailUrlMd: thumbnails.thumbnailUrlMd,
          thumbnailUrlLg: thumbnails.thumbnailUrlLg,
        });

        results.push({
          competitionId: competition.id,
          competitionName: competition.name,
          status: 'success',
          message: 'Thumbnails generated successfully',
          ...thumbnails
        });
        success++;
      } catch (error: any) {
        results.push({
          competitionId: competition.id,
          competitionName: competition.name,
          status: 'error',
          message: error.message || 'Unknown error'
        });
        errors++;
      }
    }

    return { processed, success, skipped, errors, results };
  } catch (error: any) {
    throw new Error(`Failed to regenerate thumbnails: ${error.message}`);
  }
}

async function generateThumbnailsForCompetition(imageUrl: string): Promise<{
  thumbnailUrl: string;
  thumbnailUrlMd: string;
  thumbnailUrlLg: string;
}> {
  const baseDir = process.cwd();
  
  let sourcePath: string;
  if (imageUrl.startsWith('/attached-assets/')) {
    sourcePath = path.join(baseDir, imageUrl.replace('/attached-assets/', 'attached_assets/'));
  } else if (imageUrl.startsWith('/uploads/')) {
    sourcePath = path.join(baseDir, 'attached_assets', imageUrl);
  } else {
    sourcePath = path.join(baseDir, 'attached_assets', 'uploads', 'competitions', path.basename(imageUrl));
  }

  if (!fs.existsSync(sourcePath)) {
    const altPath = path.join(baseDir, 'attached_assets', 'uploads', 'competitions', path.basename(imageUrl));
    if (fs.existsSync(altPath)) {
      sourcePath = altPath;
    } else {
      throw new Error(`Source image not found at ${sourcePath}`);
    }
  }

  const outputDir = path.join(baseDir, 'attached_assets', 'uploads', 'competitions');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const ext = path.extname(sourcePath);
  const nameWithoutExt = path.basename(sourcePath, ext);

  const results: Partial<{
    thumbnailUrl: string;
    thumbnailUrlMd: string;
    thumbnailUrlLg: string;
  }> = {};

  for (const [size, config] of Object.entries(THUMBNAIL_CONFIGS)) {
    const thumbnailFilename = `${nameWithoutExt}${config.suffix}.webp`;
    const thumbnailPath = path.join(outputDir, thumbnailFilename);
    
    if (fs.existsSync(thumbnailPath)) {
      console.log(`Thumbnail ${size} already exists: ${thumbnailFilename}`);
    } else {
      await sharp(sourcePath)
        .resize(config.width, config.height, {
          fit: 'cover',
          position: 'center'
        })
        .webp({ quality: 85 })
        .toFile(thumbnailPath);
      
      console.log(`Generated ${size} thumbnail: ${thumbnailFilename} (${config.width}x${config.height})`);
    }
    
    const relativeUrl = `/attached-assets/uploads/competitions/${thumbnailFilename}`;
    
    if (size === 'sm') {
      results.thumbnailUrl = relativeUrl;
    } else if (size === 'md') {
      results.thumbnailUrlMd = relativeUrl;
    } else if (size === 'lg') {
      results.thumbnailUrlLg = relativeUrl;
    }
  }

  return results as {
    thumbnailUrl: string;
    thumbnailUrlMd: string;
    thumbnailUrlLg: string;
  };
}

export async function regenerateSingleThumbnail(
  storage: IStorage, 
  competitionId: string
): Promise<RegenerationResult> {
  const competition = await storage.getCompetition(competitionId);
  
  if (!competition) {
    return {
      competitionId,
      competitionName: 'Unknown',
      status: 'error',
      message: 'Competition not found'
    };
  }

  if (!competition.imageUrl) {
    return {
      competitionId,
      competitionName: competition.name,
      status: 'error',
      message: 'No image URL found for this competition'
    };
  }

  try {
    const thumbnails = await generateThumbnailsForCompetition(competition.imageUrl);
    
    await storage.updateCompetition(competitionId, {
      thumbnailUrl: thumbnails.thumbnailUrl,
      thumbnailUrlMd: thumbnails.thumbnailUrlMd,
      thumbnailUrlLg: thumbnails.thumbnailUrlLg,
    });

    return {
      competitionId,
      competitionName: competition.name,
      status: 'success',
      message: 'Thumbnails regenerated successfully',
      ...thumbnails
    };
  } catch (error: any) {
    return {
      competitionId,
      competitionName: competition.name,
      status: 'error',
      message: error.message || 'Unknown error'
    };
  }
}
