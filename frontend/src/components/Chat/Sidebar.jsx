import React from 'react';

const getInitial = (name = '?') => name.trim().charAt(0).toUpperCase();

const Sidebar = ({ friends, groups, selectedFriend, selectedGroup, onSelectFriend, onSelectGroup }) => (
  <aside className="workspace-sidebar">
    <div>
      <div className="workspace-title">Acme Workspace</div>
      <div className="workspace-subtitle">Team collaboration</div>
    </div>

    <section className="sidebar-section">
      <h2 className="sidebar-section-title">CHANNELS</h2>
      <div className="sidebar-list">
        {groups.length > 0 ? groups.map((group) => (
          <button
            key={group.id}
            type="button"
            className={`sidebar-item ${selectedGroup?.id === group.id ? 'active' : ''}`}
            onClick={() => onSelectGroup(group)}
          >
            <span aria-hidden="true">#</span>
            <span>{group.name}</span>
          </button>
        )) : (
          <div className="sidebar-item" style={{ cursor: 'default' }}># general</div>
        )}
      </div>
    </section>

    <section className="sidebar-section">
      <h2 className="sidebar-section-title">DIRECT MESSAGES</h2>
      <div className="sidebar-list">
        {friends.length > 0 ? friends.map((friend) => (
          <button
            key={friend.id}
            type="button"
            className={`sidebar-item ${selectedFriend?.id === friend.id ? 'active' : ''}`}
            onClick={() => onSelectFriend(friend)}
          >
            <span className="avatar sm" style={{ background: '#5878b8' }} aria-hidden="true">
              {getInitial(friend.username)}
            </span>
            <span>{friend.username}</span>
            <span className="presence" aria-label="online" />
          </button>
        )) : (
          <div className="sidebar-item" style={{ cursor: 'default' }}>No direct messages yet</div>
        )}
      </div>
    </section>

    <div className="sidebar-footer">
      <button type="button" className="sidebar-action">Help &amp; settings</button>
    </div>
  </aside>
);

export default Sidebar;
