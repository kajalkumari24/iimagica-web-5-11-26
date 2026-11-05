import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import adminApi from "../utils/adminApi";
import styles from './UserManagement.module.css';
import adminStyles from './AdminHome.module.css';
import SkeletonLoader from './components/SkeletonLoader';
import { FaUsers, FaSearch, FaEye, FaTrash, FaEdit, FaTimes, FaIdCard } from 'react-icons/fa';
import { normalizeUser } from "../utils/normalize";
import socket from "../socket";

const PAGE_SIZE = 3;

const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [modalType, setModalType] = useState('');
  const [editData, setEditData] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [verifiedFilter, setVerifiedFilter] = useState('');
  const [subscriptionFilter, setSubscriptionFilter] = useState('');
  const loadMoreTriggerRef = useRef(null);

  const fetchUsers = async (pageNum = 1, append = false) => {
    try {
      if (append) setLoadingMore(true);
      else setLoading(true);
      const params = new URLSearchParams({
        page: pageNum,
        limit: PAGE_SIZE,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
        ...(roleFilter && { role: roleFilter }),
        ...(verifiedFilter && { verified: verifiedFilter }),
        ...(subscriptionFilter && { subscriptionStatus: subscriptionFilter }),
      });
      const response = await adminApi.get(`/api/admins/users?${params}`);
      const newUsers = response.data?.data?.users || response.data.users || [];
      if (append) setUsers((prev) => [...prev, ...newUsers]);
      else setUsers(newUsers);
      setHasMore(Boolean(response.data?.data?.hasMore ?? response.data?.hasMore ?? (newUsers.length === PAGE_SIZE)));
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching users:', error.response?.data || error.message);
      if (!append) setUsers([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(1, false);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, roleFilter, verifiedFilter, subscriptionFilter]);

  // 🟢 Real-time updates via Socket.io
  useEffect(() => {
    const handleSocketUpdate = () => {
      fetchUsers(1, false);
    };
    socket.on('userUpdated', handleSocketUpdate);
    socket.on('profileUpdated', handleSocketUpdate);
    return () => {
      socket.off('userUpdated', handleSocketUpdate);
      socket.off('profileUpdated', handleSocketUpdate);
    };
  }, [searchTerm, statusFilter, roleFilter, verifiedFilter, subscriptionFilter]);

  // Close modal on ESC key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const normalizedUsers = useMemo(() => users.map(normalizeUser), [users]);

  const dataIssues = useMemo(() => {
    const missingEmail = normalizedUsers.filter(u => !u.email).length;
    const missingRole = normalizedUsers.filter(u => !u.role).length;
    const missingStatus = normalizedUsers.filter(u => !u.status).length;
    return { missingEmail, missingRole, missingStatus };
  }, [normalizedUsers]);

  const hasDataIssues = dataIssues.missingEmail > 0 || dataIssues.missingRole > 0 || dataIssues.missingStatus > 0;
  const hasSelection = selectedIds.length > 0;

  const handleView = (item) => {
    setModalData(item);
    setModalType('user');
    setShowModal(true);
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      setSelectAll(next.length === users.length && users.length > 0);
      return next;
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

  const handleEdit = (item) => {
    setModalData(item);
    setEditData({...item});
    setModalType('edit-user');
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');
      await adminApi.put(`/api/admins/users/${modalData._id}`, editData);
      await fetchUsers(1, false);
      setShowModal(false);
      setSuccess('User updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error saving user:', error);
      setError('Failed to save user');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setEditData(prev => ({...prev, [field]: value}));
  };

  const handleDelete = async (item) => {
    if (confirm('Delete this user? This action cannot be undone.')) {
      try {
        setLoading(true);
        await adminApi.delete(`/api/admins/users/${item._id}`);
        await fetchUsers(1, false);
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user');
      } finally {
        setLoading(false);
      }
    }
  };

  const loadMoreUsers = () => {
    if (loading || loadingMore || !hasMore) return;
    fetchUsers(page + 1, true);
  };

  useEffect(() => {
    const node = loadMoreTriggerRef.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) return;
        if (!loading && !loadingMore && hasMore) loadMoreUsers();
      },
      { root: null, rootMargin: "300px 0px", threshold: 0.01 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [loading, loadingMore, hasMore, page, searchTerm, statusFilter, roleFilter, verifiedFilter, subscriptionFilter]);

  if (loading && users.length === 0) return <SkeletonLoader />;

  return (
    <div className={styles.container}>
      <div className={`${adminStyles.dashboardHeader} ${styles.headerTop}`}>
        <div>
          <div className={adminStyles.activeTitle} style={{ fontSize: "1.75rem", fontWeight: 700 }}>
            Users Management
          </div>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.filtersRow}>
            <div className={styles.searchContainer}>
              <FaSearch className={styles.searchIcon} />
              <input
                className={styles.searchInput}
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className={styles.filterSelect}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
            </select>
            <select 
              className={styles.filterSelect}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
            </select>
            <select 
              className={styles.filterSelect}
              value={verifiedFilter}
              onChange={(e) => setVerifiedFilter(e.target.value)}
            >
              <option value="">All Verified</option>
              <option value="true">Verified</option>
              <option value="false">Not Verified</option>
            </select>
            <select 
              className={styles.filterSelect}
              value={subscriptionFilter}
              onChange={(e) => setSubscriptionFilter(e.target.value)}
            >
              <option value="">All Subscriptions</option>
              <option value="active">Active / Paid</option>
              <option value="trial">Free Trial</option>
              <option value="expired">Expired / Free</option>
            </select>
            {hasSelection && (
              <button
                className={styles.deleteSelectedBtn}
                onClick={async () => {
                  if (!confirm(`Delete ${selectedIds.length} selected users? This cannot be undone.`)) return;
                  try {
                    setLoading(true);
                    await Promise.all(selectedIds.map(id => adminApi.delete(`/api/admins/users/${id}`)));
                    await fetchUsers(1, false);
                    setSelectedIds([]);
                    setSelectAll(false);
                  } catch (err) {
                    console.error('Error deleting selected users:', err);
                    alert('Failed to delete selected users');
                  } finally {
                    setLoading(false);
                  }
                }}
                title={`Delete ${selectedIds.length} selected user(s)`}
                disabled={loading}
              >
                <FaTrash /> Delete Selected
              </button>
            )}
          </div>
        </div>
      </div>

      <div className={styles.mainContent}>
        {error && <div className={styles.errorMessage}>{error}</div>}
        {success && <div className={styles.successMessage}>{success}</div>}
        {hasDataIssues && (
          <div className={styles.warningMessage}>
            Some user records are missing required fields.
            {dataIssues.missingEmail ? ` Missing email: ${dataIssues.missingEmail}.` : ""}
            {dataIssues.missingRole ? ` Missing role: ${dataIssues.missingRole}.` : ""}
            {dataIssues.missingStatus ? ` Missing status: ${dataIssues.missingStatus}.` : ""}
          </div>
        )}
        
        <div className={styles.tabContent}>
          <div className={styles.tableContainer}>
            <table className={styles.modernTable}>
              <thead>
                <tr>
                  <th style={{width: 40}}>
                    <input type="checkbox" checked={selectAll} onChange={toggleSelectAll} />
                  </th>
                  <th>User</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Activity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {normalizedUsers.map(user => (
                  <tr key={user._id} className={styles.tableRow}>
                    <td>
                      <input type="checkbox" checked={selectedIds.includes(user._id)} onChange={() => toggleSelect(user._id)} />
                    </td>
                    <td>
                      <div className={styles.userCell}>
                        <div className={styles.userAvatar}>
                          {(user.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className={styles.userInfo}>
                          <div className={styles.userName}>{user.email || 'No email'}</div>
                          <div className={styles.userEmail}>ID: {user._id.slice(-8)}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.contactInfo}>
                        <div className={styles.phone}>Email Verified: {user.emailVerified ? 'Yes' : 'No'}</div>
                        <div className={styles.joinDate}>Joined {new Date(user.createdAt).toLocaleDateString()}</div>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${user.status === 'active' ? styles.statusActive : styles.statusInactive}`}>
                        <span className={styles.statusDot}></span>
                        {user.status}
                      </span>
                    </td>
                    <td>
                      <div className={styles.activityInfo}>
                        <div className={styles.role}>{user.role}</div>
                        <div className={styles.lastLogin}>
                          {user.lastLoginAt ? `Last: ${new Date(user.lastLoginAt).toLocaleDateString()}` : 'Never logged in'}
                        </div>
                        <div className={styles.loginCount}>Logins: {user.loginCount || 0}</div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button 
                          className={styles.actionBtn} 
                          style={{ color: '#ffb86b' }} 
                          onClick={() => navigate(`/admin/user-subscription/${user._id}`)} 
                          title="Subscription Details"
                        >
                          <FaIdCard />
                        </button>
                        <button className={`${styles.actionBtn} ${styles.viewBtn}`} onClick={() => handleView(user)} title="View Details">
                          <FaEye />
                        </button>
                        <button className={`${styles.actionBtn} ${styles.editBtn}`} onClick={() => handleEdit(user)} title="Edit User">
                          <FaEdit />
                        </button>
                        <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(user)} title="Delete User">
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {loadingMore && (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '12px 0', color: '#64748b' }}>
                      Loading next {PAGE_SIZE} users...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {hasMore && <div ref={loadMoreTriggerRef} style={{ height: 1 }} />}
          </div>
        </div>
      </div>

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{modalType.includes('edit') ? 'Edit User' : 'View User'}</h3>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className={styles.modalContent}>
              {modalData && (
                <div>
                  {modalType.includes('edit') ? (
                    <div className={styles.editForm}>
                      <div className={styles.formGroup}>
                        <label>Email:</label>
                        <input 
                          type="email" 
                          value={editData.email || ''} 
                          onChange={(e) => handleInputChange('email', e.target.value)}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Status:</label>
                        <select 
                          value={editData.status || 'active'} 
                          onChange={(e) => handleInputChange('status', e.target.value)}
                        >
                          <option value="active">Active</option>
                          <option value="suspended">Suspended</option>
                          <option value="banned">Banned</option>
                        </select>
                      </div>
                      <div className={styles.formGroup}>
                        <label>
                          <input 
                            type="checkbox" 
                            checked={editData.emailVerified || false} 
                            onChange={(e) => handleInputChange('emailVerified', e.target.checked)}
                          />
                          Email Verified
                        </label>
                      </div>
                      <div className={styles.modalActions}>
                        <button className={styles.saveBtn} onClick={handleSave}>Save</button>
                        <button className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.viewData}>
                      <div className={styles.dataGrid}>
                        <div><strong>Email:</strong> {modalData.email}</div>
                        <div><strong>Role:</strong> {modalData.role}</div>
                        <div><strong>Status:</strong> {modalData.status}</div>
                        <div><strong>Profile Completed:</strong> {modalData.profileCompleted ? 'Yes' : 'No'}</div>
                        <div><strong>Email Verified:</strong> {modalData.emailVerified ? 'Yes' : 'No'}</div>
                        <div><strong>Login Count:</strong> {modalData.loginCount || 0}</div>
                        <div><strong>Last Login:</strong> {modalData.lastLoginAt ? new Date(modalData.lastLoginAt).toLocaleString() : 'Never'}</div>
                        <div><strong>Joined:</strong> {new Date(modalData.createdAt).toLocaleString()}</div>
                        <div><strong>User ID:</strong> {modalData._id}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
