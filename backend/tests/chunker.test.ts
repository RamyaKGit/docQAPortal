import { describe, it, expect } from 'vitest';
import { chunkText } from '../src/lib/chunker.js';

describe('chunkText', () => {
  it('returns empty array for empty or whitespace input', () => {
    expect(chunkText('')).toEqual([]);
    expect(chunkText('   ')).toEqual([]);
  });

  it('returns a single chunk if text is smaller than chunkSize', () => {
    const text = 'Short document content.';
    const chunks = chunkText(text, 500, 50);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toBe('Short document content.');
  });

  it('correctly chunks text by fixed size and overlap', () => {
    // 100 char text
    const text = '1234567890'.repeat(10);
    // chunkSize 30, overlap 10 -> step = 20
    const chunks = chunkText(text, 30, 10);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].length).toBeLessThanOrEqual(30);
    // Check overlap: end of chunk 0 overlaps with start of chunk 1
    const overlapStr = chunks[0].slice(-10);
    expect(chunks[1].startsWith(overlapStr)).toBe(true);
  });
});
