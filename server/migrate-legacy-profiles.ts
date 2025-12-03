import type { IStorage } from "./storage";
import type { User } from "@shared/schema";

/**
 * Migration to populate missing fields for legacy user profiles
 * This fixes blank profile pages caused by users created before optional fields were added
 */
export async function migrateLegacyProfiles(storage: IStorage): Promise<void> {
  try {
    const allUsers = await storage.getAllUsers();
    let updatedCount = 0;

    for (const user of allUsers) {
      // Check if user has any missing or undefined required optional fields
      const needsUpdate =
        !user.bio ||
        !user.location ||
        !user.favouriteMethod ||
        !user.favouriteSpecies ||
        !user.youtubeUrl ||
        !user.facebookUrl ||
        !user.twitterUrl ||
        !user.instagramUrl ||
        !user.tiktokUrl;

      if (needsUpdate) {
        // Populate missing fields with empty strings to ensure consistent data
        const updates: Partial<User> = {
          bio: user.bio || "",
          location: user.location || "",
          favouriteMethod: user.favouriteMethod || "",
          favouriteSpecies: user.favouriteSpecies || "",
          youtubeUrl: user.youtubeUrl || "",
          facebookUrl: user.facebookUrl || "",
          twitterUrl: user.twitterUrl || "",
          instagramUrl: user.instagramUrl || "",
          tiktokUrl: user.tiktokUrl || "",
        };

        await storage.updateUser(user.id, updates);
        updatedCount++;
      }
    }

    if (updatedCount > 0) {
      console.log(`✅ Migration: Updated ${updatedCount} legacy user profiles with missing fields`);
    } else {
      console.log("✅ Migration: All user profiles are up to date");
    }
  } catch (error) {
    console.error("❌ Migration error:", error);
    // Don't throw - allow server to start even if migration fails
    // This ensures the app stays operational while we fix the issue
  }
}
