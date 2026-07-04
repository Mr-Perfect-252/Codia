import React, { useState } from 'react';
import { Search as SearchIcon } from 'lucide-react';

const SearchPanel = ({ onFileSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch (e) {
      console.error(e);
      setResults([]);
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: '10px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ textTransform: 'uppercase', fontSize: '11px', color: '#858585', marginBottom: '10px', letterSpacing: '0.05em' }}>
        Search
      </div>
      <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
        <input 
          type="text" 
          value={query} 
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search files..."
          style={{ 
            flex: 1, 
            background: '#1e1e1e', 
            border: '1px solid #333', 
            color: '#ccc', 
            padding: '5px', 
            borderRadius: '2px',
            fontSize: '13px'
          }}
        />
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading && <div style={{ fontSize: '12px', color: '#888' }}>Searching...</div>}
        {!loading && results.map((res, i) => (
          <div 
            key={i} 
            onClick={() => onFileSelect(res.file)}
            style={{ padding: '5px 0', cursor: 'pointer', borderBottom: '1px solid #222' }}
          >
            <div style={{ fontSize: '13px', color: '#ccc' }}>{res.file}</div>
            <div style={{ fontSize: '12px', color: '#888', whiteSpace: 'pre', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {res.lineContent.trim()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchPanel;
