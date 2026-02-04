
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
    const db = client.db();
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
      if (fileName.startsWith('/')) {
        const parts = fileName.split('/');
        fileName = parts[parts.length - 1];
      }

      const filePath = path.join(UPLOADS_DIR, fileName);
      
      if (!fs.existsSync(filePath)) {
        console.log(`File not found for article ${article._id}: ${filePath}`);
        continue;
      }

      if (fileName.endsWith('-content.webp')) {
        console.log(`Article ${article._id} already optimized.`);
        continue;
      }

      try {
        const ext = path.extname(fileName);
        const nameWithoutExt = path.basename(fileName, ext);
        const optimizedName = `${nameWithoutExt}-content.webp`;
        const optimizedPath = path.join(UPLOADS_DIR, optimizedName);

        console.log(`Optimizing ${fileName} -> ${optimizedName}`);
        
        await sharp(filePath)
          .resize(1200, null, { fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 75, effort: 6 })
          .toFile(optimizedPath);

        const newUrl = `/attached-assets/uploads/news/${optimizedName}`;
        await newsCollection.updateOne(
          { _id: article._id },
          { $set: { image: newUrl } }
        );
        
        console.log(`Updated article ${article._id} with optimized image.`);
      } catch (err) {
        console.error(`Failed to optimize image for article ${article._id}:`, err);
      }
    }
  } finally {
    await client.close();
  }
}

optimizeExistingNews().catch(console.error);
