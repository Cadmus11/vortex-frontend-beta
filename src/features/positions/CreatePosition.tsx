import React, { useState } from 'react';

export default function CreatePosition() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ positionName: name }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setMessage('Position created');
        setName('');
      } else {
        setMessage(data?.error ?? 'Failed to create position');
      }
    } catch (err) {
      setMessage('Error creating position');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <label>Position Name</label>
      <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Campaign Manager" />
      <button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Position'}</button>
      {message && <div className="text-sm text-zinc-300">{message}</div>}
    </form>
  );
}
