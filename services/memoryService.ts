export interface UserMemoryItem {
  id: string;
  key: string;
  value: string;
  category: 'preference' | 'contact' | 'device' | 'habit' | 'custom';
  confidence: number;
  updatedAt: number;
}

export class MemoryService {
  private memoryItems: Map<string, UserMemoryItem> = new Map();

  constructor() {
    this.loadMemory();
  }

  private loadMemory() {
    try {
      const saved = localStorage.getItem('zoya_user_memory');
      if (saved) {
        const parsed: UserMemoryItem[] = JSON.parse(saved);
        parsed.forEach((item) => this.memoryItems.set(item.key, item));
      } else {
        // Default initialized memory for Muktadir
        this.setMemory('user_name', 'Abdul Muktadir', 'preference');
        this.setMemory('preferred_language', 'Bengali & English bilingual', 'preference');
        this.setMemory('favorite_tea', 'Dhanmondi Chai Corner Special', 'habit');
        this.setMemory('primary_device', 'Google Pixel 9 Pro (Android 15)', 'device');
        this.setMemory('assistant_name', 'Zoya (জয়া)', 'preference');
      }
    } catch (e) {
      this.setMemory('user_name', 'Abdul Muktadir', 'preference');
    }
  }

  private saveMemory() {
    try {
      const array = Array.from(this.memoryItems.values());
      localStorage.setItem('zoya_user_memory', JSON.stringify(array));
    } catch (e) {}
  }

  public getMemory(key: string): string | undefined {
    return this.memoryItems.get(key)?.value;
  }

  public getAllMemories(): UserMemoryItem[] {
    return Array.from(this.memoryItems.values());
  }

  public setMemory(key: string, value: string, category: UserMemoryItem['category'] = 'custom') {
    const item: UserMemoryItem = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      key,
      value,
      category,
      confidence: 1.0,
      updatedAt: Date.now(),
    };
    this.memoryItems.set(key, item);
    this.saveMemory();
  }

  public deleteMemory(key: string) {
    this.memoryItems.delete(key);
    this.saveMemory();
  }

  public clearAllMemories() {
    this.memoryItems.clear();
    this.saveMemory();
  }

  public getContextSummary(): string {
    const items = Array.from(this.memoryItems.values());
    if (items.length === 0) return '';
    return items.map((m) => `${m.key}: ${m.value}`).join(' | ');
  }
}

export const memoryService = new MemoryService();
