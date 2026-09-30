import { describe, it, expect } from 'vitest';
import { buildPrompt } from '../src/lib/promptBuilder.js';

describe('buildPrompt', () => {
  it('contains the question and context chunks', () => {
    const question = 'What is the refund policy?';
    const chunks = [
      {
        docId: 'refund-policy',
        title: 'Refund Policy',
        chunkText: 'Full refund within 30 days.',
      },
    ];

    const prompt = buildPrompt(question, chunks);

    expect(prompt).toContain(question);
    expect(prompt).toContain('Refund Policy');
    expect(prompt).toContain('refund-policy');
    expect(prompt).toContain('Full refund within 30 days.');
    expect(prompt).toContain('ONLY the provided context');
  });

  it('handles empty chunks array gracefully', () => {
    const question = 'Can I return an item?';
    const prompt = buildPrompt(question, []);

    expect(prompt).toContain(question);
    expect(prompt).toContain('No relevant context found.');
  });
});
