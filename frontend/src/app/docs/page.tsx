'use client';

import { useState } from 'react';
import { ingestDocuments, Doc } from '../../lib/api';

export default function DocsPage() {
  const [documents, setDocuments] = useState<Doc[]>([
    { id: 'refund-policy', title: 'Refund Policy', content: '' },
  ]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleDocChange = (index: number, field: keyof Doc, value: string) => {
    const updated = [...documents];
    updated[index] = { ...updated[index], [field]: value };
    setDocuments(updated);
  };

  const addDocument = () => {
    setDocuments([
      ...documents,
      { id: `doc-${documents.length + 1}`, title: '', content: '' },
    ]);
  };

  const removeDocument = (index: number) => {
    if (documents.length <= 1) return;
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const res = await ingestDocuments({ documents });
      setStatus({
        type: 'success',
        message: `Successfully ingested ${res.ingestedDocuments} document(s) (${res.ingestedChunks} chunk(s)).`,
      });
    } catch (err: any) {
      setStatus({
        type: 'error',
        message: err.message || 'Failed to ingest documents.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Document Management
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Add or update documents in the vector database to power the Q&A engine.
        </p>
      </div>

      <form onSubmit={handleSubmit} id="ingest-form">
        {documents.map((doc, idx) => (
          <div key={idx} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <span className="badge badge-blue">Document #{idx + 1}</span>
              {documents.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeDocument(idx)}
                  style={{ background: 'none', border: 'none', color: 'var(--error-color)', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Remove
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
              <div className="form-group">
                <label htmlFor={`doc-id-${idx}`}>Document ID</label>
                <input
                  id={`doc-id-${idx}`}
                  type="text"
                  placeholder="e.g. refund-policy"
                  value={doc.id}
                  onChange={(e) => handleDocChange(idx, 'id', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor={`doc-title-${idx}`}>Document Title</label>
                <input
                  id={`doc-title-${idx}`}
                  type="text"
                  placeholder="e.g. Refund Policy"
                  value={doc.title}
                  onChange={(e) => handleDocChange(idx, 'title', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor={`doc-content-${idx}`}>Document Content</label>
              <textarea
                id={`doc-content-${idx}`}
                placeholder="Paste or type document text here..."
                value={doc.content}
                onChange={(e) => handleDocChange(idx, 'content', e.target.value)}
                required
              />
            </div>
          </div>
        ))}

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={addDocument}
            className="btn"
            style={{ background: 'var(--card-bg)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}
            id="add-doc-btn"
          >
            + Add Another Document
          </button>

          <button type="submit" className="btn" disabled={loading} id="submit-ingest-btn">
            {loading ? 'Ingesting Chunks...' : 'Ingest Documents'}
          </button>
        </div>
      </form>

      {status && (
        <div className={`alert ${status.type === 'success' ? 'alert-success' : 'alert-error'}`} id="ingest-status-alert">
          {status.message}
        </div>
      )}
    </div>
  );
}
