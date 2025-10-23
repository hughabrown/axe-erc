/**
 * Content Store Tests
 *
 * Focused tests for ContentStore interface and InMemoryContentStore implementation.
 */

import { InMemoryContentStore } from '../content-store';

describe('InMemoryContentStore', () => {
  let store: InMemoryContentStore;

  beforeEach(() => {
    store = new InMemoryContentStore();
  });

  test('should store and retrieve content', () => {
    const url = 'https://example.com/article';
    const content = 'This is the full content of the article';

    store.store(url, content);
    const retrieved = store.retrieve(url);

    expect(retrieved).toBe(content);
  });

  test('should return null for missing URLs', () => {
    const retrieved = store.retrieve('https://missing.com');
    expect(retrieved).toBeNull();
  });

  test('should retrieve multiple URLs with retrieveBatch', () => {
    const urls = [
      'https://example.com/1',
      'https://example.com/2',
      'https://example.com/3'
    ];

    urls.forEach((url, index) => {
      store.store(url, `Content ${index + 1}`);
    });

    const batch = store.retrieveBatch(urls);

    expect(batch.size).toBe(3);
    expect(batch.get(urls[0])).toBe('Content 1');
    expect(batch.get(urls[1])).toBe('Content 2');
    expect(batch.get(urls[2])).toBe('Content 3');
  });

  test('should handle missing URLs in retrieveBatch gracefully', () => {
    store.store('https://example.com/1', 'Content 1');

    const batch = store.retrieveBatch([
      'https://example.com/1',
      'https://missing.com/2'
    ]);

    expect(batch.size).toBe(1);
    expect(batch.get('https://example.com/1')).toBe('Content 1');
    expect(batch.has('https://missing.com/2')).toBe(false);
  });

  test('should return correct has() status', () => {
    const url = 'https://example.com/article';

    expect(store.has(url)).toBe(false);

    store.store(url, 'Content');

    expect(store.has(url)).toBe(true);
  });

  test('should return accurate stats', () => {
    store.store('https://example.com/1', 'Short');
    store.store('https://example.com/2', 'Medium content');

    const stats = store.getStats();

    expect(stats.totalSources).toBe(2);
    expect(stats.totalChars).toBe('Short'.length + 'Medium content'.length);
  });

  test('should clear all content', () => {
    store.store('https://example.com/1', 'Content 1');
    store.store('https://example.com/2', 'Content 2');

    expect(store.getStats().totalSources).toBe(2);

    store.clear();

    expect(store.getStats().totalSources).toBe(0);
    expect(store.getStats().totalChars).toBe(0);
    expect(store.has('https://example.com/1')).toBe(false);
  });
});
