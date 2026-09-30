'use client';

import { useState } from 'react';
import { askQuestion, AskResponse } from '../../lib/api';

export default function AskPage() {
  const [question, setQuestion] = useState('');
  const [topK, setTopK] = useState(3);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await askQuestion({ question, topK });
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to get answer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Ask a Question
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Query your knowledge base with natural language RAG powered by OpenAI and Pinecone.
        </p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} id="ask-form">
          <div className="form-group">
            <label htmlFor="question-input">Your Question</label>
            <input
              id="question-input"
              type="text"
              placeholder="e.g. Can I get a refund within 30 days?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label htmlFor="topk-select" style={{ margin: 0 }}>Top Context Chunks (topK):</label>
              <select
                id="topk-select"
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
                style={{
                  padding: '0.375rem 0.75rem',
                  backgroundColor: '#0f172a',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  borderRadius: '0.375rem',
                }}
              >
                <option value={1}>1</option>
                <option value={3}>3</option>
                <option value={5}>5</option>
              </select>
            </div>

            <button type="submit" className="btn" disabled={loading} id="submit-ask-btn">
              {loading ? 'Searching & Generating...' : 'Ask Question'}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="alert alert-error" id="ask-error-alert">
          {error}
        </div>
      )}

      {result && (
        <div className="card" id="ask-result-card">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--primary-color)' }}>
            Answer
          </h2>
          <p style={{ lineHeight: 1.6, fontSize: '1rem', color: 'var(--text-main)', whiteSpace: 'pre-wrap' }} id="answer-text">
            {result.answer}
          </p>

          <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Sources Cited ({result.sources.length}):
            </span>
            {result.sources.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>No source documents cited.</p>
            ) : (
              <div className="sources-list" id="sources-list">
                {result.sources.map((src, i) => (
                  <div key={i} className="source-item" id={`source-item-${i}`}>
                    📌 {src.title} <span style={{ opacity: 0.6 }}>({src.docId})</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
