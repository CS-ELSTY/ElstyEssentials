import { world } from "@minecraft/server";

// Database class to replace missing dependency
export class Database {
  constructor(name) {
    this.name = name;
    this.data = new Map();
    this.loadFromWorld();
  }

  loadFromWorld() {
    try {
      const savedData = world.getDynamicProperty(`db_${this.name}`);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        this.data = new Map(Object.entries(parsed));
      }
    } catch (e) {
      this.data = new Map();
    }
  }

  saveToWorld() {
    try {
      const obj = Object.fromEntries(this.data);
      world.setDynamicProperty(`db_${this.name}`, JSON.stringify(obj));
    } catch (e) {
      console.warn(`Failed to save database ${this.name}:`, e);
    }
  }

  get(key, defaultValue = null) {
    return this.data.get(key) ?? defaultValue;
  }

  set(key, value) {
    this.data.set(key, value);
    this.saveToWorld();
    return value;
  }

  has(key) {
    return this.data.has(key);
  }

  delete(key) {
    const result = this.data.delete(key);
    this.saveToWorld();
    return result;
  }

  clear() {
    this.data.clear();
    this.saveToWorld();
  }

  keys() {
    return Array.from(this.data.keys());
  }

  values() {
    return Array.from(this.data.values());
  }

  entries() {
    return Array.from(this.data.entries());
  }

  size() {
    return this.data.size;
  }

  static getDatabase(name) {
    // In a real implementation, this would return existing instances
    // For now, return null to let the calling code create a new one
    return null;
  }
}