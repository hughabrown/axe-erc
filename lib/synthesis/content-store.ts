/**
 * Content Store Interface
 *
 * Abstracts full content storage for future extensibility.
 * Enables dual storage: summaries for overview (Pass 1) and full content for deep dive (Pass 2).
 */

/**
 * Interface for content storage implementations.
 * Allows easy swap from in-memory to vector DB in future.
 */
export interface IContentStore {
  /**
   * Store full content for a source URL
   * @param url - Source URL as unique identifier
   * @param fullContent - Complete markdown content
   */
  store(url: string, fullContent: string): void;

  /**
   * Retrieve full content by URL
   * @param url - Source URL
   * @returns Full content or null if not found
   */
  retrieve(url: string): string | null;

  /**
   * Retrieve multiple sources by URLs in batch
   * @param urls - Array of source URLs
   * @returns Map of URL to full content (only includes found URLs)
   */
  retrieveBatch(urls: string[]): Map<string, string>;

  /**
   * Check if content exists for URL
   * @param url - Source URL
   * @returns True if content is stored
   */
  has(url: string): boolean;

  /**
   * Get storage statistics
   * @returns Statistics about stored content
   */
  getStats(): {
    totalSources: number;
    totalChars: number;
  };

  /**
   * Clear all stored content
   * Used after synthesis completes to free memory
   */
  clear(): void;
}

/**
 * In-Memory Content Store Implementation
 *
 * MVP implementation using Map for fast in-memory storage.
 * Sufficient for single-search processing where content is cleared after synthesis.
 */
export class InMemoryContentStore implements IContentStore {
  private contentMap: Map<string, string>;

  constructor() {
    this.contentMap = new Map<string, string>();
  }

  store(url: string, fullContent: string): void {
    this.contentMap.set(url, fullContent);
  }

  retrieve(url: string): string | null {
    return this.contentMap.get(url) || null;
  }

  retrieveBatch(urls: string[]): Map<string, string> {
    const results = new Map<string, string>();
    urls.forEach(url => {
      const content = this.retrieve(url);
      if (content) {
        results.set(url, content);
      }
    });
    return results;
  }

  has(url: string): boolean {
    return this.contentMap.has(url);
  }

  getStats(): { totalSources: number; totalChars: number } {
    let totalChars = 0;
    this.contentMap.forEach(content => {
      totalChars += content.length;
    });
    return {
      totalSources: this.contentMap.size,
      totalChars
    };
  }

  clear(): void {
    this.contentMap.clear();
  }
}
