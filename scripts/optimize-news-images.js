
import { MongoClient, ObjectId } from 'mongodb';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const UPLOADS_DIR = path.join(process.cwd(), 'attached_assets', 'uploads', 'news');

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not set');
  process.exit(1);
}

async function optimizeExistingNews() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db("peg_slam");
    const newsCollection = db.collection('news');
    
    // Check for "articles" as well in case the collection name is different in legacy data
    let collection = newsCollection;
    let count = await collection.countDocuments();
    
    if (count === 0) {
      console.log('No articles found in "news" collection, checking "articles"...');
      collection = db.collection('articles');
      count = await collection.countDocuments();
    }
    
    const articles = await collection.find({}).toArray();
    console.log(`Found ${articles.length} news articles to check in collection: ${collection.collectionName}`);

    for (const article of articles) {
      if (!article.image) continue;

      let fileName = article.image;
      // Handle URLs like /attached-assets/uploads/news/image.png
      if (fileName.startsWith('/')) {
        const parts = fileName.split('/');
        fileName = parts[parts.length - 1];
      }

      // First check in news directory
      let filePath = path.join(process.cwd(), 'attached_assets', 'uploads', 'news', fileName);
      let currentDir = 'news';
      
      if (!fs.existsSync(filePath)) {
        // Search in all subdirectories of attached_assets/uploads
        const uploadBase = path.join(process.cwd(), 'attached_assets', 'uploads');
        const subdirs = fs.readdirSync(uploadBase);
        let found = false;
        
        for (const subdir of subdirs) {
          const subdirPath = path.join(uploadBase, subdir);
          if (fs.statSync(subdirPath).isDirectory()) {
            const checkPath = path.join(subdirPath, fileName);
            if (fs.existsSync(checkPath)) {
              filePath = checkPath;
              currentDir = subdir;
              found = true;
              break;
            }
          }
        }

        if (!found) {
          // If still not found, try a case-insensitive search in news directory
          const newsFiles = fs.readdirSync(path.join(uploadBase, 'news'));
          const lowerFileName = fileName.toLowerCase();
          const caseInsensitiveMatch = newsFiles.find(f => f.toLowerCase() === lowerFileName);
          
          if (caseInsensitiveMatch) {
            filePath = path.join(uploadBase, 'news', caseInsensitiveMatch);
            fileName = caseInsensitiveMatch;
            currentDir = 'news';
            found = true;
          }
        }

        if (!found) {
          console.log(`File not found for article ${article.id || article._id}: ${fileName}`);
          continue;
        }
      }

      if (fileName.endsWith('-content.webp')) {
        console.log(`Article ${article.id || article._id} already optimized.`);
        continue;
      }

      try {
        const ext = path.extname(fileName);
        const nameWithoutExt = path.basename(fileName, ext);
        const optimizedName = `${nameWithoutExt}-content.webp`;
        const optimizedPath = path.join(process.cwd(), 'attached_assets', 'uploads', currentDir, optimizedName);

        console.log(`Optimizing ${fileName} in ${currentDir} -> ${optimizedName}`);
        
        await sharp(filePath)
          .resize(1200, null, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 75, effort: 6 })
          .toFile(optimizedPath);

        const newUrl = `/attached-assets/uploads/${currentDir}/${optimizedName}`;
        await collection.updateOne(
          { _id: article._id },
          { $set: { image: newUrl } }
        );
        
        console.log(`Updated article ${article.id || article._id} with optimized image.`);
      } catch (err) {
        console.error(`Failed to optimize image for article ${article._id}:`, err);
      }
    }
  } finally {
    await client.close();
  }
}

optimizeExistingNews().catch(console.error);
