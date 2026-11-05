import React, { useEffect, useState, useRef } from "react";
import adminApi from "../utils/adminApi";
import styles from "./AdminManageUsers.module.css";
import adminStyles from "./AdminHome.module.css";
import ConfirmModal from "./components/ConfirmModal";
import LoadingSpinner from "./components/LoadingSpinner";
import { FaTrash } from "react-icons/fa";
import { stripCountryCodeForDisplay } from "../utils/phoneDisplay";

function AdminManageUsers() {
  const [users, setUsers] = useState([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [statusFilter, setStatusFilter] = useState('');
  const [totalUsers, setTotalUsers] = useState(0);
  const [stats, setStats] = useState({});
  const [toasts, setToasts] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmPayload, setConfirmPayload] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [bulkAction, setBulkAction] = useState('');
  const [actionLoading, setActionLoading] = useState({});
  const [editingUser, setEditingUser] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const mountedRef = useRef(true);

  // Debounced search and sort
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 500);
    return () => clearTimeout(timer);
  }, [search, sortBy, sortOrder, statusFilter]);

  useEffect(() => {
    mountedRef.current = true;
    fetchUsers();
    return () => { mountedRef.current = false; };
  }, []);

  const addToast = (message, type = 'info', timeout = 3000) => {
    const id = Date.now().toString();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), timeout);
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search,
        sortBy,
        sortOrder,
        ...(statusFilter && { status: statusFilter })
      });
      
      const [usersRes, countRes, statsRes] = await Promise.all([
        adminApi.get(`/api/users?${params}`),
        adminApi.get(`/api/users/count`),
        adminApi.get(`/api/users/stats`)
      ]);
      
      console.log('Users API Response:', usersRes.data);
      console.log('Count API Response:', countRes.data);
      console.log('Stats API Response:', statsRes.data);
      
      if (mountedRef.current) {
        const users = usersRes.data.success ? usersRes.data.data : usersRes.data;
        setUsers(Array.isArray(users) ? users : []);
        setTotalUsers(countRes.data.success ? countRes.data.data.count : countRes.data.count || 0);
        setStats(statsRes.data.success ? statsRes.data.data : statsRes.data || {});
      }
    } catch (err) {
      console.error('Fetch users error:', err);
      addToast("Failed to fetch users", 'error');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  // Remove the filtered array since we're using server-side filtering
  // const filtered = users.filter(u => (
  //   !search || (u.email || "").toLowerCase().includes(search.toLowerCase())
  // ));

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!email) return addToast('Email is required');
    try {
      setInviteLoading(true);
      await adminApi.post(`/api/users/request-otp`, { email });
      addToast('OTP sent to user');
      setEmail('');
      fetchUsers(); // Refresh users list
    } catch (err) {
      console.error(err);
      addToast('Failed to add user');
    } finally {
      setInviteLoading(false);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const newIds = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      setSelectAll(newIds.length === users.length && users.length > 0);
      return newIds;
    });
  };

  const toggleSelectAll = () => {
    if (!selectAll) {
      setSelectedIds(users.map(u => u._id));
      setSelectAll(true);
    } else {
      setSelectedIds([]);
      setSelectAll(false);
    }
  };

  const requestDeleteSingle = (id) => {
    setConfirmPayload({ type: 'single', id });
    setConfirmOpen(true);
  };

  const requestDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    setConfirmPayload({ type: 'selected' });
    setConfirmOpen(true);
  };

  const deleteSelectedDirect = async () => {
    if (selectedIds.length === 0) return;
    setConfirmLoading(true);
    try {
      // Use server-side bulk delete endpoint for efficiency
      await adminApi.delete(`/api/users/bulk`, { data: { ids: selectedIds } });
      addToast(`${selectedIds.length} user(s) deleted`);
      setUsers((prev) => prev.filter(u => !selectedIds.includes(u._id)));
      setSelectedIds([]);
      setSelectAll(false);
    } catch (err) {
      console.error(err);
      addToast('Delete failed');
    } finally {
      setConfirmLoading(false);
    }
  };

  const updateUserStatus = async (userId, status) => {
    try {
      setActionLoading(prev => ({ ...prev, [userId]: true }));
      await adminApi.patch(`/api/users/${userId}/status`, { status });
      
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, status } : u));
      addToast(`User ${status}`, 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to update user status', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const updateUserRole = async (userId, role) => {
    try {
      setActionLoading(prev => ({ ...prev, [userId]: true }));
      await adminApi.patch(`/api/users/${userId}/role`, { role });
      
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, role } : u));
      addToast(`User role updated to ${role}`, 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to update user role', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const openEditModal = async (user) => {
    setEditingUser(user);
    setEditModalOpen(true);
    setProfileLoading(true);
    
    try {
      const res = await adminApi.get(`/api/profiles/user/${user._id}`);
      
      if (res.data.success && res.data.data) {
        setProfileData(res.data.data);
      } else {
        setProfileData({
          name: '',
          mobile: '',
          address: '',
          profileType: 'personal',
          userId: user._id
        });
      }
    } catch (err) {
      console.error(err);
      if (err.response?.status === 404) {
        setProfileData({
          name: '',
          mobile: '',
          address: '',
          profileType: 'personal',
          userId: user._id
        });
        addToast('No profile found. You can create one.', 'info');
      } else {
        addToast('Failed to load profile data', 'error');
        setProfileData(null);
      }
    } finally {
      setProfileLoading(false);
    }
  };

  const closeEditModal = () => {
    setEditingUser(null);
    setEditModalOpen(false);
    setProfileData(null);
  };

  const updateProfile = async (updatedData) => {
    try {
      if (profileData._id) {
        await adminApi.put(`/api/profiles/user/${editingUser._id}`, updatedData, {
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        await adminApi.post(`/api/profiles`, {
          ...updatedData,
          userId: editingUser._id
        }, {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      await adminApi.patch(`/api/users/${editingUser._id}/profile-completed`, { profileCompleted: true });
      setUsers(prev => prev.map(u => u._id === editingUser._id ? { ...u, profileCompleted: true } : u));
      
      addToast('Profile updated successfully', 'success');
      closeEditModal();
    } catch (err) {
      console.error(err);
      addToast('Failed to update profile', 'error');
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedIds.length === 0) return;
    
    try {
      setConfirmLoading(true);
      if (bulkAction.startsWith('status-')) {
        const status = bulkAction.replace('status-', '');
        await adminApi.patch(`/api/users/bulk/status`, { ids: selectedIds, status });
        setUsers(prev => prev.map(u => selectedIds.includes(u._id) ? { ...u, status } : u));
        addToast(`${selectedIds.length} users ${status}`, 'success');
      } else if (bulkAction === 'delete') {
        // Use server-side bulk delete endpoint
        await adminApi.delete(`/api/users/bulk`, { data: { ids: selectedIds } });
        setUsers(prev => prev.filter(u => !selectedIds.includes(u._id)));
        addToast(`${selectedIds.length} user(s) deleted`, 'success');
      }
      
      setSelectedIds([]);
      setSelectAll(false);
      setBulkAction('');
    } catch (err) {
      console.error(err);
      addToast('Bulk action failed', 'error');
    } finally {
      setConfirmLoading(false);
    }
  };

  const performConfirmAction = async () => {
    if (!confirmPayload) return;
    setConfirmLoading(true);
    try {
      if (confirmPayload.type === 'single') {
        await adminApi.delete(`/api/users/${confirmPayload.id}`);
        addToast('User deleted');
        setUsers((prev) => prev.filter(u => u._id !== confirmPayload.id));
      } else if (confirmPayload.type === 'selected') {
        // Use backend bulk delete endpoint
        await adminApi.delete(`/api/users/bulk`, { data: { ids: selectedIds } });
        addToast(`${selectedIds.length} user(s) deleted`);
        setUsers((prev) => prev.filter(u => !selectedIds.includes(u._id)));
        setSelectedIds([]);
        setSelectAll(false);
      }
    } catch (err) {
      console.error(err);
      addToast('Delete failed');
    } finally {
      setConfirmLoading(false);
      setConfirmOpen(false);
      setConfirmPayload(null);
    }
  };

  return (
    <div className={adminStyles.container}>
      {loading ? (
        <LoadingSpinner text="Loading users..." />
      ) : (
        <>
      <div className={adminStyles.header}>
        <h1>User Management</h1>
      </div>

      <div className={styles.controlsCard} style={{ marginTop: 60 }}>
        <div className={styles.controlsCardInner}>
          <div className={styles.leftGroup}>
            <div className={styles.selectPill} onClick={toggleSelectAll} role="button" tabIndex={0}>
              <input type="checkbox" checked={selectAll} readOnly />
              <div className={styles.selectPillLabel}>{selectedIds.length ? `${selectedIds.length} selected` : 'Select all'}</div>
            </div>

            <form onSubmit={handleAddUser} className={styles.controlsForm} onClick={(e) => e.stopPropagation()}>
              <input id="add-user-email" className={styles.smallInput} type="email" placeholder="Invite user by email" value={email} onChange={e => setEmail(e.target.value)} />
              <button className={styles.smallBtn} type="submit" disabled={inviteLoading}>
                {inviteLoading ? <span className={styles.spinner} /> : 'Invite'}
              </button>
            </form>
          </div>

          <div className={styles.rightGroup}>
            <div className={styles.statsText}>{stats.totalUsers || totalUsers} users ({stats.activeUsers || 0} active)</div>
            {selectedIds.length > 0 && (
              <>
                <select value={bulkAction} onChange={(e) => setBulkAction(e.target.value)} className={styles.bulkSelect}>
                  <option value="">Bulk Actions</option>
                  <option value="status-active">Activate</option>
                  <option value="status-suspended">Suspend</option>
                  <option value="status-banned">Ban</option>
                  <option value="delete">Delete</option>
                </select>
                <button className={styles.bulkBtn} onClick={handleBulkAction} disabled={!bulkAction}>Apply</button>
              </>
            )}
            <button 
              className={styles.exportBtn} 
              onClick={() => {
                if (!users.length) return;
                const csvData = users.map(user => ({
                  Email: user.email,
                  Status: user.status || 'active',
                  'Profile Status': user.profileCompleted ? 'Completed' : 'Pending',
                  'Email Verified': user.emailVerified ? 'Yes' : 'No',
                  'Last Login': user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never',
                  'Joined Date': new Date(user.createdAt).toLocaleDateString()
                }));
                
                const csvContent = [
                  Object.keys(csvData[0]).join(','),
                  ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
                ].join('\n');
                
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              disabled={!users.length}
            >
              📥 Export
            </button>
            <button className={styles.btnDanger} onClick={requestDeleteSelected} disabled={selectedIds.length === 0}><FaTrash /> Delete</button>
          </div>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th></th>
              <th>User Info</th>
              <th>Profile</th>
              <th>Status</th>
              <th>Role</th>
              <th>Activity</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className={styles.emptyState}>
                  <span className={styles.spinner} />
                  <span style={{ marginLeft: 8 }}>Loading users...</span>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="7" className={styles.emptyState}>
                  No users found
                </td>
              </tr>
            ) : users.map(u => (
              <tr key={u._id}>
                <td><input type="checkbox" checked={selectedIds.includes(u._id)} onChange={() => toggleSelect(u._id)} /></td>
                <td>
                  <div className={styles.userInfo}>
                    <div className={styles.emailCell}>
                      <strong>{u.email}</strong>
                      <div className={styles.userMeta}>
                        {u.emailVerified ? (
                          <span className={styles.verified}>✓ Verified</span>
                        ) : (
                          <span className={styles.unverified}>⚠ Unverified</span>
                        )}
                        <span className={styles.userId}>ID: {u._id.slice(-6)}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <div className={styles.profileInfo}>
                    {u.profileCompleted ? (
                      <span className={styles.profileCompleted}>✓ Complete</span>
                    ) : (
                      <span className={styles.profilePending}>⏳ Pending</span>
                    )}
                  </div>
                </td>
                <td>
                  <select 
                    value={u.status || 'active'} 
                    onChange={(e) => updateUserStatus(u._id, e.target.value)}
                    className={`${styles.statusSelect} ${styles[u.status || 'active']}`}
                    disabled={actionLoading[u._id]}
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="banned">Banned</option>
                  </select>
                </td>
                <td>
                  <select 
                    value={u.role || 'user'} 
                    onChange={(e) => updateUserRole(u._id, e.target.value)}
                    className={`${styles.roleSelect} ${styles[u.role || 'user']}`}
                    disabled={actionLoading[u._id]}
                  >
                    <option value="user">User</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td>
                  <div className={styles.activityInfo}>
                    <div className={styles.loginInfo}>
                      <strong>Last Login:</strong>
                      <span>{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : 'Never'}</span>
                    </div>
                    <div className={styles.joinInfo}>
                      <strong>Joined:</strong>
                      <span>{new Date(u.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className={styles.loginCount}>
                      <strong>Logins:</strong>
                      <span>{u.loginCount || 0}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div className={styles.actionButtons}>
                    <button 
                      className={styles.editBtn} 
                      onClick={() => openEditModal(u)}
                      disabled={actionLoading[u._id]}
                      title="Edit Profile"
                    >
                      📝 Edit
                    </button>
                    <button 
                      className={styles.dangerBtnOutline} 
                      onClick={() => requestDeleteSingle(u._id)}
                      disabled={actionLoading[u._id]}
                      title="Delete User"
                    >
                      {actionLoading[u._id] ? '⏳' : '🗑️'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* toasts */}
      <div className={styles.toastContainer} aria-live="polite">
        {toasts.map(t => <div key={t.id} className={`${styles.toast} ${styles[t.type] || ''}`}>{t.message}</div>)}
      </div>

      <ConfirmModal
        open={confirmOpen}
        title={confirmPayload?.type === 'selected' ? 'Delete selected users' : 'Delete user'}
        message={confirmPayload?.type === 'selected' ? `Delete ${selectedIds.length} selected users?` : 'Delete this user?'}
        onConfirm={performConfirmAction}
        onCancel={() => { setConfirmOpen(false); setConfirmPayload(null); }}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        loading={confirmLoading}
      />

      {/* Edit Profile Modal */}
      {editModalOpen && editingUser && (
        <div className={styles.modalOverlay} onClick={closeEditModal}>
          <div className={styles.editModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Edit User Profile</h3>
              <div className={styles.userBadge}>
                <span className={styles.userEmail}>{editingUser.email}</span>
                <span className={`${styles.statusBadge} ${styles[editingUser.status || 'active']}`}>
                  {editingUser.status || 'active'}
                </span>
              </div>
              <button className={styles.closeBtn} onClick={closeEditModal}>×</button>
            </div>
            <div className={styles.modalBody}>
              {profileLoading ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <span className={styles.spinner} />
                  <p>Loading profile...</p>
                </div>
              ) : profileData ? (
                <div className={styles.profileForm}>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Full Name:</label>
                      <input 
                        type="text" 
                        value={profileData.name || ''} 
                        onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                        className={styles.formInput}
                        placeholder="Enter full name"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Mobile:</label>
                      <input 
                        type="text" 
                        value={stripCountryCodeForDisplay(profileData.mobile) || ''} 
                        onChange={(e) => setProfileData({...profileData, mobile: e.target.value})}
                        className={styles.formInput}
                        placeholder="Enter mobile number"
                      />
                    </div>
                  </div>
                  
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Profile Type:</label>
                      <select 
                        value={profileData.profileType || 'personal'} 
                        onChange={(e) => setProfileData({...profileData, profileType: e.target.value})}
                        className={styles.formSelect}
                      >
                        <option value="personal">Personal</option>
                        <option value="professional">Professional</option>
                        <option value="business">Business</option>
                        <option value="social">Social</option>
                        <option value="political">Political</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label>Gender:</label>
                      <select 
                        value={profileData.gender || ''} 
                        onChange={(e) => setProfileData({...profileData, gender: e.target.value})}
                        className={styles.formSelect}
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>City:</label>
                      <input 
                        type="text" 
                        value={profileData.city || ''} 
                        onChange={(e) => setProfileData({...profileData, city: e.target.value})}
                        className={styles.formInput}
                        placeholder="Enter city"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>State:</label>
                      <input 
                        type="text" 
                        value={profileData.state || ''} 
                        onChange={(e) => setProfileData({...profileData, state: e.target.value})}
                        className={styles.formInput}
                        placeholder="Enter state"
                      />
                    </div>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>Address:</label>
                    <textarea 
                      value={profileData.address || ''} 
                      onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                      className={styles.formTextarea}
                      placeholder="Enter full address"
                      rows={3}
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>Religion:</label>
                    <input 
                      type="text" 
                      value={profileData.religion || ''} 
                      onChange={(e) => setProfileData({...profileData, religion: e.target.value})}
                      className={styles.formInput}
                      placeholder="Enter religion (optional)"
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>Birth Date:</label>
                    <input 
                      type="date" 
                      value={profileData.birthDate ? new Date(profileData.birthDate).toISOString().split('T')[0] : ''} 
                      onChange={(e) => setProfileData({...profileData, birthDate: e.target.value})}
                      className={styles.formInput}
                    />
                  </div>
                  
                  <div className={styles.visibilitySection}>
                    <h4>Profile Visibility Settings</h4>
                    <div className={styles.checkboxGroup}>
                      <label className={styles.checkboxLabel}>
                        <input 
                          type="checkbox" 
                          checked={profileData.visibleName !== false} 
                          onChange={(e) => setProfileData({...profileData, visibleName: e.target.checked})}
                        />
                        Show Name
                      </label>
                      <label className={styles.checkboxLabel}>
                        <input 
                          type="checkbox" 
                          checked={profileData.showMobile !== false} 
                          onChange={(e) => setProfileData({...profileData, showMobile: e.target.checked})}
                        />
                        Show Mobile
                      </label>
                      <label className={styles.checkboxLabel}>
                        <input 
                          type="checkbox" 
                          checked={profileData.showProfileImage !== false} 
                          onChange={(e) => setProfileData({...profileData, showProfileImage: e.target.checked})}
                        />
                        Show Profile Image
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                <p>Unable to load profile data.</p>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnCancel} onClick={closeEditModal}>Cancel</button>
              {profileData && (
                <button 
                  className={styles.btnSave} 
                  onClick={() => updateProfile(profileData)}
                >
                  Save Changes
                </button>
              )}
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}

export default AdminManageUsers;
