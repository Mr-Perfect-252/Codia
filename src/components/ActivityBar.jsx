import React from 'react';
import { Files, Search, GitBranch, Package, Globe } from 'lucide-react';

const ActivityBar = ({ activeTab, onTabSelect }) => {
  const tabs = [
    { id: 'explorer', icon: <Files size={24} />, title: 'Explorer' },
    { id: 'search', icon: <Search size={24} />, title: 'Search' },
    { id: 'git', icon: <GitBranch size={24} />, title: 'Source Control' },
    { id: 'npm', icon: <span style={{ fontSize: '18px', fontWeight: 'bold', fontFamily: 'monospace' }}>npm</span>, title: 'NPM Manager' },
    { id: 'browser', icon: <Globe size={24} />, title: 'In-App Browser' },
    { id: 'preview', icon: <span style={{ fontSize: '24px' }}>👁️</span>, title: 'Live Preview' },
    { id: 'packages', icon: <Package size={24} />, title: 'System Tools' }
  ];

  return (
    <div style={{
      width: '48px',
      height: '100%',
      backgroundColor: '#181818',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: '10px'
    }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabSelect(tab.id)}
          title={tab.title}
          style={{
            width: '100%',
            aspectRatio: '1',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'transparent',
            border: 'none',
            borderLeft: activeTab === tab.id ? '2px solid #58a6ff' : '2px solid transparent',
            color: activeTab === tab.id ? '#ffffff' : '#858585',
            cursor: 'pointer',
            marginBottom: '10px'
          }}
          onMouseEnter={(e) => {
            if (activeTab !== tab.id) e.currentTarget.style.color = '#cccccc';
          }}
          onMouseLeave={(e) => {
            if (activeTab !== tab.id) e.currentTarget.style.color = '#858585';
          }}
        >
          {tab.icon}
        </button>
      ))}
    </div>
  );
};

export default ActivityBar;
