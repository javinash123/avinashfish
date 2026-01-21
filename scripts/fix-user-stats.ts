import { MongoDBStorage } from "../server/mongodb-storage";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
const projectRoot = process.cwd();
const envPath = path.join(projectRoot, '.env');
dotenv.config({ path: envPath, override: true });

async function fixUserStats() {
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI not found");
    return;
  }

  const storage = new MongoDBStorage(process.env.MONGODB_URI);
  await storage.connect();

  try {
    const users = await storage.getAllUsers();
    console.log(`Processing stats for ${users.length} users...`);

    for (const user of users) {
      const entries = await storage.getUserLeaderboardEntries(user.id);
      
      const wins = entries.filter(e => e.position === 1).length;
      
      const weights = entries
        .map(e => parseFloat(e.weight))
        .filter(w => !isNaN(w) && w > 0);
        
      const bestCatch = weights.length > 0 ? Math.max(...weights) : 0;
      const averageCatch = weights.length > 0 
        ? weights.reduce((a, b) => a + b, 0) / weights.length 
        : 0;

      console.log(`User ${user.username}: Wins=${wins}, Best=${bestCatch.toFixed(2)}, Avg=${averageCatch.toFixed(2)}`);
    }

    console.log("✅ Stats calculation verification completed.");
  } catch (error) {
    console.error("Error fixing stats:", error);
  } finally {
    await storage.disconnect();
  }
}

fixUserStats();
