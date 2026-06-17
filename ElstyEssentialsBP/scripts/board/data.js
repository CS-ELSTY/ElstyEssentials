// Elsty Essentials - Board Data Storage
// Simple database system using dynamic properties

export class ClanDB {
  constructor() {
    this.prefix = "clanDB_";
  }

  get(key) {
    try {
      const data = world.getDynamicProperty(this.prefix + key);
      if (!data) return null;
      return JSON.parse(String(data));
    } catch (error) {
      console.warn(`[ClanDB] Error getting ${key}:`, error);
      return null;
    }
  }

  set(key, value) {
    try {
      world.setDynamicProperty(this.prefix + key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`[ClanDB] Error setting ${key}:`, error);
      return false;
    }
  }
}

export class ScoreboardDB {
  constructor() {
    this.prefix = "scoreboardDB_";
  }

  get(key) {
    try {
      const data = world.getDynamicProperty(this.prefix + key);
      if (!data) return null;
      return JSON.parse(String(data));
    } catch (error) {
      console.warn(`[ScoreboardDB] Error getting ${key}:`, error);
      return null;
    }
  }

  set(key, value) {
    try {
      world.setDynamicProperty(this.prefix + key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`[ScoreboardDB] Error setting ${key}:`, error);
      return false;
    }
  }
}

export const clanDB = new ClanDB();
export const scoreboardDB = new ScoreboardDB();