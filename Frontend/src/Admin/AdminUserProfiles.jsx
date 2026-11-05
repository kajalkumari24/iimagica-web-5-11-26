import React, { useState, useEffect, useMemo, useRef } from 'react';
import adminApi from "../utils/adminApi";
import { BASE_URL } from "../url";
import styles from './UserManagement.module.css';
import modalStyles from './AdminProfileModal.module.css';
import adminStyles from './AdminHome.module.css';
import SkeletonLoader from './components/SkeletonLoader';
import { FaUserCircle, FaSearch, FaEye, FaTrash, FaEdit, FaTimes } from 'react-icons/fa';
import { normalizeProfile, getProfileType } from "../utils/normalize";
import socket from "../socket";
import { stripCountryCodeForDisplay } from "../utils/phoneDisplay";

const PAGE_SIZE = 3;

const AdminUserProfiles = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [modalType, setModalType] = useState('');
  const [editData, setEditData] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const loadMoreTriggerRef = useRef(null);

  const fetchProfiles = async (pageNum = 1, append = false) => {
    try {
      if (append) setLoadingMore(true);
      else setLoading(true);
      const params = new URLSearchParams({
        page: pageNum,
        limit: PAGE_SIZE,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
        ...(typeFilter && { type: typeFilter }),
      });
      const response = await adminApi.get(`/api/admins/profiles?${params}`);
      const newProfiles = response.data?.data?.profiles || response.data.profiles || [];
      if (append) setProfiles((prev) => [...prev, ...newProfiles]);
      else setProfiles(newProfiles);
      setHasMore(Boolean(response.data?.data?.hasMore ?? response.data?.hasMore ?? (newProfiles.length === PAGE_SIZE)));
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching profiles:', error.response?.data || error.message);
      if (!append) setProfiles([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProfiles(1, false);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, typeFilter]);

  // Real-time updates via Socket.io
  useEffect(() => {
    const handleSocketUpdate = () => {
      fetchProfiles(1, false);
    };

    socket.on('profileUpdated', handleSocketUpdate);
    socket.on('userUpdated', handleSocketUpdate);
    socket.on('profileTypeUpdated', handleSocketUpdate);

    // 🟢 Listen for Real-Time Presence
    const handleUserOnline = (userId) => {
      setOnlineUsers(prev => new Set(prev).add(String(userId)));
    };
    const handleUserOffline = (userId) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        next.delete(String(userId));
        return next;
      });
    };
    const handleOnlineUsersList = (usersList) => {
      setOnlineUsers(new Set(usersList.map(String)));
    };

    socket.on('user_online', handleUserOnline);
    socket.on('user_offline', handleUserOffline);
    socket.on('online_users_list', handleOnlineUsersList);
    
    // Request current online users when admin page loads
    socket.emit('get_online_users');

    return () => {
      socket.off('profileUpdated', handleSocketUpdate);
      socket.off('userUpdated', handleSocketUpdate);
      socket.off('profileTypeUpdated', handleSocketUpdate);
      socket.off('user_online', handleUserOnline);
      socket.off('user_offline', handleUserOffline);
      socket.off('online_users_list', handleOnlineUsersList);
    };
  }, [searchTerm, statusFilter, typeFilter]); // Re-bind with current filters

  useEffect(() => {
    const anyModalOpen = showModal || showDeleteModal;
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    if (anyModalOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [showModal, showDeleteModal]);

  // Close modals on ESC key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowModal(false);
        setShowDeleteModal(false);
        setDeleteItem(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const normalizedProfiles = useMemo(() => profiles.map(normalizeProfile), [profiles]);

  const profileDataIssues = useMemo(() => {
    const missingType = normalizedProfiles.filter(p => !getProfileType(p)).length;
    const missingEmail = normalizedProfiles.filter(p => !(p.email || p.userId?.email)).length;
    const missingName = normalizedProfiles.filter(p => !p.name).length;
    return { missingType, missingEmail, missingName };
  }, [normalizedProfiles]);

  const hasProfileIssues =
    profileDataIssues.missingType > 0 ||
    profileDataIssues.missingEmail > 0 ||
    profileDataIssues.missingName > 0;

  const handleView = (item) => {
    try {
      setModalData(item);
      setModalType('profile');
      setShowModal(true);
    } catch (error) {
      console.error('Error opening view modal:', error);
      alert('Error opening profile view');
    }
  };

  const handleEdit = (item) => {
    try {
      // console.log('Original item:', item);
      
      // Get the current profile type data
      const currentProfileType = getProfileType(item);
      const profileTypeData = item[currentProfileType] || {};
      // console.log('Current profile type:', currentProfileType);
      // console.log('Profile type data:', profileTypeData);
      
      const flattenedData = {
        ...item,
        profileType: currentProfileType,
        // Flatten profile-specific data from the current profile type
        ...profileTypeData,
        // Extract social links from the current profile type object
        social_instagram: profileTypeData.social_instagram || '',
        social_facebook: profileTypeData.social_facebook || '',
        social_linkedin: profileTypeData.social_linkedin || '',
        social_twitter: profileTypeData.social_twitter || '',
        social_snapchat: profileTypeData.social_snapchat || '',
        social_youtube: profileTypeData.social_youtube || '',
        social_telegram: profileTypeData.social_telegram || '',
        social_discord: profileTypeData.social_discord || '',
        // Handle categories properly for professional profiles
        categories: Array.isArray(profileTypeData.categories) ? profileTypeData.categories.join(', ') : (profileTypeData.categories || ''),
        // Ensure all profile type specific fields are flattened with proper priority
        partyname: profileTypeData.partyname || '',
        organization: profileTypeData.organization || '',
        positionname: profileTypeData.positionname || '',
        website: profileTypeData.website || '',
        // Address should come from profile type data first, then general
        address: profileTypeData.address || item.address || '',
        brandName: profileTypeData.brandName || ''
      };
      
      // console.log('Flattened data:', flattenedData);
      
      setModalData(item);
      setEditData(flattenedData);
      setModalType('edit-profile');
      setShowModal(true);
    } catch (error) {
      console.error('Error opening edit modal:', error);
      alert('Error opening profile editor');
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');
      
      const profileType = editData.profileType || getProfileType(modalData);
      const updateData = {
        // Basic fields
        name: editData.name,
        email: editData.email,
        mobile: stripCountryCodeForDisplay(editData.mobile),
        gender: editData.gender,
        birthDate: editData.birthDate,
        religion: editData.religion,
        city: editData.city,
        state: editData.state,
        address: editData.address,
        profileType: profileType,
        
        // Profile-specific nested data
        [profileType]: {
          ...(modalData[profileType] || {}),
          // Update with edited values
          ...(profileType === 'business' && {
            businessName: editData.businessName,
            businessTagline: editData.businessTagline,
            designation: editData.designation,
            website: editData.website,
            address: editData.address,
            social_instagram: editData.social_instagram,
            social_facebook: editData.social_facebook,
            social_linkedin: editData.social_linkedin,
            social_twitter: editData.social_twitter,
            social_snapchat: editData.social_snapchat,
            social_youtube: editData.social_youtube,
            social_telegram: editData.social_telegram,
            social_discord: editData.social_discord
          }),
          ...(profileType === 'professional' && {
            categories: editData.categories ? editData.categories.split(',').map(c => c.trim()) : [],
            designation: editData.designation,
            website: editData.website,
            address: editData.address,
            social_instagram: editData.social_instagram,
            social_facebook: editData.social_facebook,
            social_linkedin: editData.social_linkedin,
            social_twitter: editData.social_twitter,
            social_snapchat: editData.social_snapchat,
            social_youtube: editData.social_youtube,
            social_telegram: editData.social_telegram,
            social_discord: editData.social_discord
          }),
          ...(profileType === 'personal' && {
            bio: editData.bio,
            website: editData.website,
            address: editData.address,
            social_instagram: editData.social_instagram,
            social_facebook: editData.social_facebook,
            social_linkedin: editData.social_linkedin,
            social_twitter: editData.social_twitter,
            social_snapchat: editData.social_snapchat,
            social_youtube: editData.social_youtube,
            social_telegram: editData.social_telegram,
            social_discord: editData.social_discord
          }),
          ...(profileType === 'political' && {
            partyname: editData.partyname,
            positionname: editData.positionname,
            address: editData.address,
            social_instagram: editData.social_instagram,
            social_facebook: editData.social_facebook,
            social_linkedin: editData.social_linkedin,
            social_twitter: editData.social_twitter,
            social_snapchat: editData.social_snapchat,
            social_youtube: editData.social_youtube,
            social_telegram: editData.social_telegram,
            social_discord: editData.social_discord
          }),
          ...(profileType === 'social' && {
            organization: editData.organization,
            positionname: editData.positionname,
            website: editData.website,
            address: editData.address,
            social_instagram: editData.social_instagram,
            social_facebook: editData.social_facebook,
            social_linkedin: editData.social_linkedin,
            social_twitter: editData.social_twitter,
            social_snapchat: editData.social_snapchat,
            social_youtube: editData.social_youtube,
            social_telegram: editData.social_telegram,
            social_discord: editData.social_discord
          }),
          ...(profileType === 'brand' && {
            brandName: editData.brandName,
            website: editData.website,
            address: editData.address,
            social_instagram: editData.social_instagram,
            social_facebook: editData.social_facebook,
            social_linkedin: editData.social_linkedin,
            social_twitter: editData.social_twitter,
            social_snapchat: editData.social_snapchat,
            social_youtube: editData.social_youtube,
            social_telegram: editData.social_telegram,
            social_discord: editData.social_discord
          })
        }
      };
      
      await adminApi.put(`/api/admins/profiles/${modalData._id}`, updateData);
      await fetchProfiles(1, false);
      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(''), 3000);
      closeModal();
    } catch (error) {
      console.error('Error saving profile:', error);
      setError('Failed to save profile');
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setEditData(prev => ({...prev, [field]: value}));
  };

  const handleDelete = async (item) => {
    setDeleteItem(item);
    setShowDeleteModal(true);
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      setSelectAll(next.length === profiles.length && profiles.length > 0);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!selectAll) {
      setSelectedIds(profiles.map(p => p._id));
      setSelectAll(true);
    } else {
      setSelectedIds([]);
      setSelectAll(false);
    }
  };

  const deleteSelected = async () => {
    if (!selectedIds.length) return alert('No profiles selected');
    if (!confirm(`Delete ${selectedIds.length} selected profiles? This cannot be undone.`)) return;
    try {
      setLoading(true);
      // Prefer server-side bulk delete endpoint for admins
      try {
        await adminApi.delete(`/api/admins/profiles/bulk`, { data: { ids: selectedIds } });
      } catch (err) {
        // Fallback to per-item deletes if bulk endpoint not available
        await Promise.all(selectedIds.map(id => adminApi.delete(`/api/admins/profiles/${id}`)));
      }
      await fetchProfiles(1, false);
      setSelectedIds([]);
      setSelectAll(false);
    } catch (err) {
      console.error('Error deleting selected profiles:', err);
      alert('Failed to delete selected profiles');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);
      await adminApi.delete(`/api/admins/profiles/${deleteItem._id}`);
      await fetchProfiles(1, false);
      setShowDeleteModal(false);
      setDeleteItem(null);
    } catch (error) {
      console.error('Error deleting profile:', error);
      alert('Failed to delete profile');
    } finally {
      setLoading(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeleteItem(null);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const isUserOnline = (profile) => {
    // 🟢 1. Real-time Check (Fastest & Most Accurate)
    const uId = String(profile.userId?._id || profile.userId || '');
    if (uId && onlineUsers.has(uId)) return true;

    // 🟡 2. Fallback Check (Check if they were active in the last 5 mins)
    // Check multiple possible timestamp fields
    const timestamps = [
      profile.userId?.lastActiveAt
    ];
    
    const latestTimestamp = timestamps
      .filter(Boolean)
      .map(ts => new Date(ts))
      .sort((a, b) => b.getTime() - a.getTime())[0]; // Get most recent safely
    
    if (!latestTimestamp) return false;
    
    const now = new Date();
    const timeDiff = now - latestTimestamp;
    // Consider user active if their last activity was within the last 5 minutes
    return timeDiff < 5 * 60 * 1000;
  };

  const loadMoreProfiles = () => {
    if (loading || loadingMore || !hasMore) return;
    fetchProfiles(page + 1, true);
  };

  useEffect(() => {
    const node = loadMoreTriggerRef.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first?.isIntersecting) return;
        if (!loading && !loadingMore && hasMore) loadMoreProfiles();
      },
      { root: null, rootMargin: "300px 0px", threshold: 0.01 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [loading, loadingMore, hasMore, page, searchTerm, statusFilter, typeFilter]);

  if (loading && profiles.length === 0) return <SkeletonLoader />;

  return (
    <div className={styles.container}>
      {error && <div className={styles.errorMessage}>{error}</div>}
      {success && <div className={styles.successMessage}>{success}</div>}
      
      <div className={`${adminStyles.dashboardHeader} ${styles.headerTop}`}>
        <div>
          <div className={adminStyles.activeTitle} style={{ fontSize: "1.75rem", fontWeight: 700 }}>
            User Profiles Management
          </div>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.filtersRow}>
            <div className={styles.searchContainer}>
              <FaSearch className={styles.searchIcon} />
              <input
                className={styles.searchInput}
                placeholder="Search profiles..."
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
              <option value="inactive">Inactive</option>
            </select>
            <select 
              className={styles.filterSelect}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="business">Business</option>
              <option value="professional">Professional</option>
              <option value="personal">Personal</option>
              <option value="political">Political</option>
              <option value="social">Social</option>
              <option value="brand">Brand</option>
            </select>
            <button
              className={styles.deleteSelectedBtn}
              onClick={deleteSelected}
              disabled={selectedIds.length === 0}
              title="Delete selected profiles"
            >
              <FaTrash /> Delete Selected
            </button>
          </div>
        </div>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.tabContent}>
          <div className={styles.tableContainer}>
            {hasProfileIssues && (
              <div className={styles.warningMessage}>
                Some profile records are incomplete.
                {profileDataIssues.missingType ? ` Missing profile type: ${profileDataIssues.missingType}.` : ""}
                {profileDataIssues.missingEmail ? ` Missing email: ${profileDataIssues.missingEmail}.` : ""}
                {profileDataIssues.missingName ? ` Missing name: ${profileDataIssues.missingName}.` : ""}
              </div>
            )}
            <table className={styles.modernTable}>
              <thead>
                <tr>
                  <th style={{width: 40}}>
                    <input type="checkbox" checked={selectAll} onChange={toggleSelectAll} />
                  </th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {normalizedProfiles.map(profile => (
                  <tr key={profile._id} className={styles.profileRow}>
                    <td>
                      <input type="checkbox" checked={selectedIds.includes(profile._id)} onChange={() => toggleSelect(profile._id)} />
                    </td>
                    <td>
                      <div className={styles.profileCell}>
                        <div className={styles.profileImageContainer}>
                          {profile.file ? (
                            <img 
                              src={profile.file.startsWith('http') ? profile.file : `${BASE_URL}${profile.file}`} 
                              alt="Profile" 
                              className={styles.profileImage}
                            />
                          ) : (
                            <div className={styles.profileInitial}>
                              {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                          )}
                          <div className={`${styles.onlineIndicator} ${isUserOnline(profile) ? styles.online : styles.offline}`}></div>
                        </div>
                        <div className={styles.profileDetails}>
                          <div className={styles.profileName}>{profile.name || 'Unnamed User'}</div>
                          <div className={styles.profileMeta}>
                            <span className={styles.profileId}>ID: {profile._id.slice(-6)}</span>
                            <span className={styles.profileMobile}>{stripCountryCodeForDisplay(profile.mobile) || 'No mobile'}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.contactCell}>
                        <div className={styles.emailAddress}>{profile.email || profile.userId?.email || 'No email'}</div>
                        <div className={styles.joinedDate}>
                          <span className={styles.dateIcon}>📅</span>
                          Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.typeCell}>
                        <span className={`${styles.typeBadge} ${styles[getProfileType(profile)]}`}>
                          <span className={styles.typeIcon}>
                            {getProfileType(profile) === 'business' && '🏢'}
                            {getProfileType(profile) === 'professional' && '💼'}
                            {getProfileType(profile) === 'personal' && '👤'}
                            {getProfileType(profile) === 'political' && '🏛️'}
                            {getProfileType(profile) === 'social' && '🤝'}
                            {getProfileType(profile) === 'brand' && '🏷️'}
                          </span>
                          {getProfileType(profile) || 'unknown'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.locationCell}>
                        <div className={styles.cityName}>
                          <span className={styles.locationIcon}>📍</span>
                          {profile.city || 'Unknown'}
                        </div>
                        <div className={styles.countryState}>{profile.state ? profile.state : 'Location not set'}</div>
                      </div>
                    </td>
                    <td>
                      <div className={styles.statusCell}>
                        <span className={`${styles.statusIndicator} ${isUserOnline(profile) ? styles.statusActive : styles.statusInactive}`}>
                          <span className={styles.statusPulse}></span>
                          <span className={styles.statusText}>{isUserOnline(profile) ? 'Active' : 'Inactive'}</span>
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.actionsCell}>
                        <button className={`${styles.actionButton} ${styles.viewAction}`} onClick={() => handleView(profile)} title="View Profile">
                          <FaEye />
                          <span>View</span>
                        </button>
                        <button className={`${styles.actionButton} ${styles.editAction}`} onClick={() => handleEdit(profile)} title="Edit Profile">
                          <FaEdit />
                          <span>Edit</span>
                        </button>
                        <button className={`${styles.actionButton} ${styles.deleteAction}`} onClick={() => handleDelete(profile)} title="Delete Profile">
                          <FaTrash />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {loadingMore && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '12px 0', color: '#64748b' }}>
                      Loading next {PAGE_SIZE} profiles...
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {hasMore && <div ref={loadMoreTriggerRef} style={{ height: 1 }} />}
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className={styles.modalOverlay} onClick={cancelDelete}>
          <div className={styles.deleteModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.deleteHeader}>
              <h3>Delete Profile</h3>
            </div>
            <div className={styles.deleteContent}>
              <p>Are you sure you want to delete <strong>{deleteItem?.name}</strong>'s profile?</p>
              <p style={{color: '#dc2626', fontSize: '14px'}}>This action cannot be undone.</p>
            </div>
            <div className={styles.deleteActions}>
              <button className={styles.deleteCancelBtn} onClick={cancelDelete}>
                Cancel
              </button>
              <button className={styles.deleteConfirmBtn} onClick={confirmDelete} disabled={loading}>
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                {modalData.file && (
                  <img 
                    src={modalData.file.startsWith('http') ? modalData.file : `${BASE_URL}${modalData.file}`} 
                    alt="Profile" 
                    style={{width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover'}}
                  />
                )}
                <div>
                  <h3 style={{margin: 0, fontSize: '16px'}}>{modalType.includes('edit') ? 'Edit Profile' : 'Profile Details'}</h3>
                  <p style={{margin: '2px 0 0 0', color: '#666', fontSize: '12px'}}>{modalData.name} - {getProfileType(modalData) || 'unknown'}</p>
                </div>
              </div>
              <button className={styles.closeBtn} onClick={(e) => { e.stopPropagation(); closeModal(); }}>
                <FaTimes />
              </button>
            </div>
            <div className={`${styles.modalContent} ${modalStyles.improvedModal}`}>
              {modalData && (
                <>
                  {modalType.includes('edit') ? (
                    <div className={styles.editFormContainer}>
                      <div className={styles.formSections}>
                        {/* Basic Information Section */}
                        <div className={styles.formSection}>
                          <h4 className={styles.sectionTitle}>👤 Basic Information</h4>
                          <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                              <label>Full Name</label>
                              <input 
                                type="text" 
                                value={editData.name || ''} 
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                placeholder="Enter full name"
                                className={styles.formInput}
                              />
                            </div>
                            <div className={styles.formGroup}>
                              <label>Email Address</label>
                              <input 
                                type="email" 
                                value={editData.email || ''} 
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                placeholder="Enter email address"
                                className={styles.formInput}
                              />
                            </div>
                            <div className={styles.formGroup}>
                              <label>Mobile Number</label>
                              <input 
                                type="text" 
                                value={stripCountryCodeForDisplay(editData.mobile) || ''} 
                                onChange={(e) => handleInputChange('mobile', e.target.value)}
                                placeholder="Enter mobile number"
                                className={styles.formInput}
                              />
                            </div>
                            <div className={styles.formGroup}>
                              <label>Gender</label>
                              <select 
                                value={editData.gender || ''} 
                                onChange={(e) => handleInputChange('gender', e.target.value)}
                                className={styles.formSelect}
                              >
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                                <option value="Prefer not to say">Prefer not to say</option>
                              </select>
                            </div>
                            <div className={styles.formGroup}>
                              <label>Birth Date</label>
                              <input 
                                type="date" 
                                value={editData.birthDate ? editData.birthDate.split('T')[0] : ''} 
                                onChange={(e) => handleInputChange('birthDate', e.target.value)}
                                className={styles.formInput}
                              />
                            </div>
                            <div className={styles.formGroup}>
                              <label>Religion</label>
                              <select 
                                value={editData.religion || ''} 
                                onChange={(e) => handleInputChange('religion', e.target.value)}
                                className={styles.formSelect}
                              >
                                <option value="">Select Religion</option>
                                <option value="Hinduism">Hinduism</option>
                                <option value="Islam">Islam</option>
                                <option value="Christianity">Christianity</option>
                                <option value="Sikhism">Sikhism</option>
                                <option value="Buddhism">Buddhism</option>
                                <option value="Jainism">Jainism</option>
                                <option value="Judaism">Judaism</option>
                                <option value="Zoroastrianism">Zoroastrianism</option>
                                <option value="Other">Other</option>
                                <option value="Prefer not to say">Prefer not to say</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Location Section */}
                        <div className={styles.formSection}>
                          <h4 className={styles.sectionTitle}>📍 Location Details</h4>
                          <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                              <label>City</label>
                              <input 
                                type="text" 
                                value={editData.city || ''} 
                                onChange={(e) => handleInputChange('city', e.target.value)}
                                placeholder="Enter city"
                                className={styles.formInput}
                              />
                            </div>
                            <div className={styles.formGroup}>
                              <label>State</label>
                              <input 
                                type="text" 
                                value={editData.state || ''} 
                                onChange={(e) => handleInputChange('state', e.target.value)}
                                placeholder="Enter state"
                                className={styles.formInput}
                              />
                            </div>
                          </div>
                          <div className={styles.formGroup}>
                            <label>Full Address</label>
                            <textarea 
                              value={editData.address || ''} 
                              onChange={(e) => handleInputChange('address', e.target.value)}
                              rows="3"
                              placeholder="Enter complete address"
                              className={styles.formTextarea}
                            />
                          </div>
                        </div>

                        {/* Profile Type Specific Section */}
                        {editData.profileType && (
                          <div className={styles.formSection}>
                            <h4 className={styles.sectionTitle}>{editData.profileType.charAt(0).toUpperCase() + editData.profileType.slice(1)} Information</h4>
                            
                            {editData.profileType === 'business' && (
                              <>
                                <div className={styles.formRow}>
                                  <div className={styles.formGroup}>
                                    <label>Business Name</label>
                                    <input 
                                      type="text" 
                                      value={editData.businessName || ''} 
                                      onChange={(e) => handleInputChange('businessName', e.target.value)}
                                      placeholder="Enter business name"
                                    />
                                  </div>
                                  <div className={styles.formGroup}>
                                    <label>Designation</label>
                                    <input 
                                      type="text" 
                                      value={editData.designation || ''} 
                                      onChange={(e) => handleInputChange('designation', e.target.value)}
                                      placeholder="Enter designation"
                                    />
                                  </div>
                                </div>
                                <div className={styles.formRow}>
                                  <div className={styles.formGroup}>
                                    <label>Business Tagline</label>
                                    <input 
                                      type="text" 
                                      value={editData.businessTagline || ''} 
                                      onChange={(e) => handleInputChange('businessTagline', e.target.value)}
                                      placeholder="Enter business tagline"
                                    />
                                  </div>
                                  <div className={styles.formGroup}>
                                    <label>Website</label>
                                    <input 
                                      type="url" 
                                      value={editData.website || ''} 
                                      onChange={(e) => handleInputChange('website', e.target.value)}
                                      placeholder="https://example.com"
                                    />
                                  </div>
                                </div>
                                <div className={styles.formRow}>
                                  <div className={styles.formGroup}>
                                    <label>Address</label>
                                    <input 
                                      type="text" 
                                      value={editData.address || ''} 
                                      onChange={(e) => handleInputChange('address', e.target.value)}
                                      placeholder="Business address"
                                    />
                                  </div>
                                </div>
                              </>
                            )}
                            
                            {editData.profileType === 'professional' && (
                              <>
                                <div className={styles.formRow}>
                                  <div className={styles.formGroup}>
                                    <label>Categories</label>
                                    <input 
                                      type="text" 
                                      value={Array.isArray(editData.categories) ? editData.categories.join(', ') : (editData.categories || '')} 
                                      onChange={(e) => handleInputChange('categories', e.target.value)}
                                      placeholder="Technology, Finance, etc."
                                    />
                                  </div>
                                  <div className={styles.formGroup}>
                                    <label>Designation</label>
                                    <input 
                                      type="text" 
                                      value={editData.designation || ''} 
                                      onChange={(e) => handleInputChange('designation', e.target.value)}
                                      placeholder="Enter designation"
                                    />
                                  </div>
                                </div>
                                <div className={styles.formRow}>
                                  <div className={styles.formGroup}>
                                    <label>Website</label>
                                    <input 
                                      type="url" 
                                      value={editData.website || ''} 
                                      onChange={(e) => handleInputChange('website', e.target.value)}
                                      placeholder="https://example.com"
                                    />
                                  </div>
                                </div>
                              </>
                            )}
                            
                            {editData.profileType === 'personal' && (
                              <>
                                <div className={styles.formGroup}>
                                  <label>Bio</label>
                                  <textarea 
                                    value={editData.bio || ''} 
                                    onChange={(e) => handleInputChange('bio', e.target.value)}
                                    rows="3"
                                    placeholder="Tell us about yourself"
                                  />
                                </div>
                                <div className={styles.formRow}>
                                  <div className={styles.formGroup}>
                                    <label>Website</label>
                                    <input 
                                      type="url" 
                                      value={editData.website || ''} 
                                      onChange={(e) => handleInputChange('website', e.target.value)}
                                      placeholder="https://example.com"
                                    />
                                  </div>
                                </div>
                              </>
                            )}
                            
                            {editData.profileType === 'political' && (
                              <>
                                <div className={styles.formRow}>
                                  <div className={styles.formGroup}>
                                    <label>Party Name</label>
                                    <input 
                                      type="text" 
                                      value={editData.partyname || ''} 
                                      onChange={(e) => handleInputChange('partyname', e.target.value)}
                                      placeholder="Enter party name"
                                    />
                                  </div>
                                  <div className={styles.formGroup}>
                                    <label>Position</label>
                                    <input 
                                      type="text" 
                                      value={editData.positionname || ''} 
                                      onChange={(e) => handleInputChange('positionname', e.target.value)}
                                      placeholder="Enter position"
                                    />
                                  </div>
                                </div>
                                <div className={styles.formRow}>
                                  <div className={styles.formGroup}>
                                    <label>Address</label>
                                    <input 
                                      type="text" 
                                      value={editData.address || ''} 
                                      onChange={(e) => handleInputChange('address', e.target.value)}
                                      placeholder="Office address"
                                    />
                                  </div>
                                </div>
                              </>
                            )}
                            
                            {editData.profileType === 'social' && (
                              <>
                                <div className={styles.formRow}>
                                  <div className={styles.formGroup}>
                                    <label>Organization Name</label>
                                    <input 
                                      type="text" 
                                      value={editData.organization || ''} 
                                      onChange={(e) => handleInputChange('organization', e.target.value)}
                                      placeholder="Enter organization name"
                                    />
                                  </div>
                                  <div className={styles.formGroup}>
                                    <label>Position Name</label>
                                    <input 
                                      type="text" 
                                      value={editData.positionname || ''} 
                                      onChange={(e) => handleInputChange('positionname', e.target.value)}
                                      placeholder="Enter position"
                                    />
                                  </div>
                                </div>
                                <div className={styles.formRow}>
                                  <div className={styles.formGroup}>
                                    <label>Website</label>
                                    <input 
                                      type="url" 
                                      value={editData.website || ''} 
                                      onChange={(e) => handleInputChange('website', e.target.value)}
                                      placeholder="https://example.com"
                                    />
                                  </div>
                                </div>
                              </>
                            )}
                            
                            {editData.profileType === 'brand' && (
                              <>
                                <div className={styles.formRow}>
                                  <div className={styles.formGroup}>
                                    <label>Brand Name</label>
                                    <input 
                                      type="text" 
                                      value={editData.brandName || ''} 
                                      onChange={(e) => handleInputChange('brandName', e.target.value)}
                                      placeholder="Enter brand name"
                                    />
                                  </div>
                                  <div className={styles.formGroup}>
                                    <label>Website</label>
                                    <input 
                                      type="url" 
                                      value={editData.website || ''} 
                                      onChange={(e) => handleInputChange('website', e.target.value)}
                                      placeholder="https://example.com"
                                    />
                                  </div>
                                </div>
                                <div className={styles.formRow}>
                                  <div className={styles.formGroup}>
                                    <label>Address</label>
                                    <input 
                                      type="text" 
                                      value={editData.address || ''} 
                                      onChange={(e) => handleInputChange('address', e.target.value)}
                                      placeholder="Brand address"
                                    />
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        )}

                        {/* Social Links Section */}
                        <div className={styles.formSection}>
                          <h4 className={styles.sectionTitle}>🔗 Social Media Links</h4>
                          
                          <div className={styles.formGroup}>
                            <label>📷 Instagram</label>
                            <input 
                              type="text" 
                              value={editData.social_instagram || ''} 
                              onChange={(e) => handleInputChange('social_instagram', e.target.value)}
                              placeholder="@username or profile link"
                              className={styles.formInput}
                            />
                          </div>
                          
                          <div className={styles.formGroup}>
                            <label>📘 Facebook</label>
                            <input 
                              type="text" 
                              value={editData.social_facebook || ''} 
                              onChange={(e) => handleInputChange('social_facebook', e.target.value)}
                              placeholder="Facebook profile link"
                              className={styles.formInput}
                            />
                          </div>
                          
                          <div className={styles.formGroup}>
                            <label>💼 LinkedIn</label>
                            <input 
                              type="text" 
                              value={editData.social_linkedin || ''} 
                              onChange={(e) => handleInputChange('social_linkedin', e.target.value)}
                              placeholder="LinkedIn profile link"
                              className={styles.formInput}
                            />
                          </div>
                          
                          <div className={styles.formGroup}>
                            <label>🐦 Twitter</label>
                            <input 
                              type="text" 
                              value={editData.social_twitter || ''} 
                              onChange={(e) => handleInputChange('social_twitter', e.target.value)}
                              placeholder="@username or profile link"
                              className={styles.formInput}
                            />
                          </div>
                          
                          <div className={styles.formGroup}>
                            <label>👻 Snapchat</label>
                            <input 
                              type="text" 
                              value={editData.social_snapchat || ''} 
                              onChange={(e) => handleInputChange('social_snapchat', e.target.value)}
                              placeholder="Snapchat username"
                              className={styles.formInput}
                            />
                          </div>
                          
                          <div className={styles.formGroup}>
                            <label>▶️ YouTube</label>
                            <input 
                              type="text" 
                              value={editData.social_youtube || ''} 
                              onChange={(e) => handleInputChange('social_youtube', e.target.value)}
                              placeholder="YouTube channel link"
                              className={styles.formInput}
                            />
                          </div>
                          
                          <div className={styles.formGroup}>
                            <label>✈️ Telegram</label>
                            <input 
                              type="text" 
                              value={editData.social_telegram || ''} 
                              onChange={(e) => handleInputChange('social_telegram', e.target.value)}
                              placeholder="Telegram username"
                              className={styles.formInput}
                            />
                          </div>
                          
                          <div className={styles.formGroup}>
                            <label>👾 Discord</label>
                            <input 
                              type="text" 
                              value={editData.social_discord || ''} 
                              onChange={(e) => handleInputChange('social_discord', e.target.value)}
                              placeholder="Discord username / link"
                              className={styles.formInput}
                            />
                          </div>
                        </div>


                      </div>
                      
                      <div className={styles.modalActions}>
                        <button 
                          className={`${styles.saveBtn} ${loading ? styles.loadingBtn : ''}`} 
                          onClick={handleSave}
                          disabled={loading}
                          style={{padding: '8px 16px', fontSize: '13px'}}
                        >
                          {loading ? 'Saving...' : '💾 Save'}
                        </button>
                        <button className={styles.cancelBtn} onClick={closeModal} style={{padding: '8px 16px', fontSize: '13px'}}>
                          ❌ Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.viewData}>
                      <div className={styles.dataGrid}>
                        <div><strong>📧 Email:</strong> <span>{modalData.email || modalData.userId?.email || 'Not provided'}</span></div>
                        <div><strong>👤 Role:</strong> <span>{modalData.role || 'user'}</span></div>
                        <div><strong>📱 Mobile:</strong> <span>{stripCountryCodeForDisplay(modalData.mobile) || 'Not provided'}</span></div>
                        <div><strong>🚦 Status:</strong> <span className={`${styles.status} ${isUserOnline(modalData) ? styles.active : styles.inactive}`}>{isUserOnline(modalData) ? 'Active' : 'Inactive'}</span></div>
                        <div><strong>✅ Profile Completed:</strong> <span>{modalData.profileCompleted ? 'Yes' : 'No'}</span></div>
                        <div><strong>📧 Email Verified:</strong> <span>{modalData.emailVerified ? 'Yes' : 'No'}</span></div>
                        <div><strong>🔢 Login Count:</strong> <span>{modalData.loginCount || 0}</span></div>
                        <div><strong>🕐 Last Login:</strong> <span>{modalData.lastLogin ? new Date(modalData.lastLogin).toLocaleString() : 'Never'}</span></div>
                        <div><strong>📅 Joined:</strong> <span>{new Date(modalData.createdAt).toLocaleString()}</span></div>
                        {modalData.name && <div><strong>👤 Name:</strong> <span>{modalData.name}</span></div>}
                        {modalData.gender && <div><strong>⚧ Gender:</strong> <span>{modalData.gender}</span></div>}
                        {getProfileType(modalData) === 'brand' && modalData.brand?.brandName && <div><strong>🏷️ Brand Name:</strong> <span>{modalData.brand.brandName}</span></div>}
                        {modalData.city && <div><strong>🏙️ City:</strong> <span>{modalData.city}</span></div>}
                        {modalData.state && <div><strong>🗺️ State:</strong> <span>{modalData.state}</span></div>}
                        {getProfileType(modalData) && (
                          <div>
                            <strong>📋 Profile Type:</strong>{' '}
                            <span className={`${styles.profileType} ${styles[getProfileType(modalData)]}`}>
                              {getProfileType(modalData)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserProfiles;
