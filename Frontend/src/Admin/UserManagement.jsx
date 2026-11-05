import React, { useState, useEffect } from 'react';
import adminApi from "../utils/adminApi";
import styles from './UserManagement.module.css';
import adminStyles from './AdminHome.module.css';
import SkeletonLoader from './components/SkeletonLoader';
import { FaUsers, FaUserCircle, FaSearch, FaEye, FaTrash, FaEdit, FaTimes } from 'react-icons/fa';

function UserManagement() {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(null);
  const [modalType, setModalType] = useState('');
  const [editData, setEditData] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Use existing working endpoints
      const usersRes = await adminApi.get(`/api/users/count`);
      const profilesRes = await adminApi.get(`/api/profiles/count`);
      
      // Mock data for now since endpoints return counts
      setUsers([
        { _id: '1', name: 'John Doe', email: 'john@example.com', phone: '123-456-7890', createdAt: new Date(), isActive: true, address: '123 Main St', city: 'New York', state: 'NY' },
        { _id: '2', name: 'Jane Smith', email: 'jane@example.com', phone: '098-765-4321', createdAt: new Date(), isActive: false, address: '456 Oak Ave', city: 'Los Angeles', state: 'CA' },
        { _id: '3', name: 'Bob Johnson', email: 'bob@example.com', phone: '555-123-4567', createdAt: new Date(), isActive: true, address: '789 Pine St', city: 'Chicago', state: 'IL' }
      ]);
      setProfiles([
        { _id: '1', name: 'John Doe', email: 'john@example.com', profiletype: 'business', city: 'New York', state: 'NY', mobile: '123-456-7890', fileUrl: null, businessName: 'Doe Corp', designation: 'CEO', website: 'doe.com' },
        { _id: '2', name: 'Jane Smith', email: 'jane@example.com', profiletype: 'personal', city: 'Los Angeles', state: 'CA', mobile: '098-765-4321', fileUrl: null, bio: 'Creative designer', birthDate: '1990-05-15' },
        { _id: '3', name: 'Bob Johnson', email: 'bob@example.com', profiletype: 'political', city: 'Chicago', state: 'IL', mobile: '555-123-4567', fileUrl: null, partyname: 'Democratic Party', positionname: 'Mayor' }
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      setUsers([]);
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProfiles = profiles.filter(profile => 
    profile.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleView = (item, type) => {
    setModalData(item);
    setModalType(type);
    setShowModal(true);
  };

  const handleEdit = (item, type) => {
    setModalData(item);
    setEditData({...item});
    setModalType(`edit-${type}`);
    setShowModal(true);
  };

  const handleSave = () => {
    // console.log('Saving:', editData);
    setShowModal(false);
  };

  const handleInputChange = (field, value) => {
    setEditData(prev => ({...prev, [field]: value}));
  };

  const handleDelete = (item, type) => {
    if (confirm(`Delete this ${type}?`)) {
      // console.log(`Deleting ${type}:`, item);
    }
  };

  if (loading) return <SkeletonLoader />;

  return (
    <div style={{
      padding: 0,
      background: '#f8fafc',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{
        background: '#fff',
        padding: '16px 24px',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: 600,
          color: '#1e293b',
          margin: 0
        }}>User Management</h1>
      </div>

      {/* Main Content */}
      <div className={adminStyles.statsGrid} style={{gridTemplateColumns: '1fr', padding: '24px'}}>
        {/* Tabs */}
        <div className={styles.tabContainer}>
          <button
            className={`${styles.tab} ${activeTab === 'users' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <FaUsers /> Users ({users.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'profiles' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('profiles')}
          >
            <FaUserCircle /> User Profiles ({profiles.length})
          </button>
        </div>

        {/* Content */}
        <div className={styles.tabContent}>
          {activeTab === 'users' ? (
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Joined</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user._id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.phone || 'N/A'}</td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td>
                        <span className={`${styles.status} ${user.isActive ? styles.active : styles.inactive}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <button className={styles.actionBtn} onClick={() => handleView(user, 'user')}><FaEye /></button>
                          <button className={styles.actionBtn} onClick={() => handleEdit(user, 'user')}><FaEdit /></button>
                          <button className={`${styles.actionBtn} ${styles.danger}`} onClick={() => handleDelete(user, 'user')}><FaTrash /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.profileGrid}>
              {filteredProfiles.map(profile => (
                <div key={profile._id} className={styles.profileCard}>
                  <div className={styles.profileHeader}>
                    <img 
                      src={profile.fileUrl || '/default-avatar.png'} 
                      alt={profile.name}
                      className={styles.avatar}
                    />
                    <div>
                      <h3>{profile.name}</h3>
                      <p>{profile.email}</p>
                      <span className={styles.profileType}>{profile.profiletype}</span>
                    </div>
                  </div>
                  <div className={styles.profileDetails}>
                    <p><strong>City:</strong> {profile.city || 'N/A'}</p>
                    <p><strong>State:</strong> {profile.state || 'N/A'}</p>
                    <p><strong>Mobile:</strong> {profile.mobile || 'N/A'}</p>
                  </div>
                  <div className={styles.profileActions}>
                    <button className={styles.actionBtn} onClick={() => handleView(profile, 'profile')}><FaEye /></button>
                    <button className={styles.actionBtn} onClick={() => handleEdit(profile, 'profile')}><FaEdit /></button>
                    <button className={`${styles.actionBtn} ${styles.danger}`} onClick={() => handleDelete(profile, 'profile')}><FaTrash /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>{modalType.includes('edit') ? 'Edit' : 'View'} {modalType.includes('user') ? 'User' : 'Profile'}</h3>
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
                        <label>Name:</label>
                        <input 
                          type="text" 
                          value={editData.name || ''} 
                          onChange={(e) => handleInputChange('name', e.target.value)}
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Email:</label>
                        <input 
                          type="email" 
                          value={editData.email || ''} 
                          onChange={(e) => handleInputChange('email', e.target.value)}
                        />
                      </div>
                      {editData.phone && (
                        <div className={styles.formGroup}>
                          <label>Phone:</label>
                          <input 
                            type="text" 
                            value={editData.phone || ''} 
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                          />
                        </div>
                      )}
                      {editData.profiletype && (
                        <div className={styles.formGroup}>
                          <label>Profile Type:</label>
                          <select 
                            value={editData.profiletype || ''} 
                            onChange={(e) => handleInputChange('profiletype', e.target.value)}
                          >
                            <option value="business">Business</option>
                            <option value="personal">Personal</option>
                            <option value="political">Political</option>
                          </select>
                        </div>
                      )}
                      {editData.city && (
                        <div className={styles.formGroup}>
                          <label>City:</label>
                          <input 
                            type="text" 
                            value={editData.city || ''} 
                            onChange={(e) => handleInputChange('city', e.target.value)}
                          />
                        </div>
                      )}
                      {editData.state && (
                        <div className={styles.formGroup}>
                          <label>State:</label>
                          <input 
                            type="text" 
                            value={editData.state || ''} 
                            onChange={(e) => handleInputChange('state', e.target.value)}
                          />
                        </div>
                      )}
                      <div className={styles.modalActions}>
                        <button className={styles.saveBtn} onClick={handleSave}>Save</button>
                        <button className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.viewData}>
                      <div className={styles.dataGrid}>
                        <div><strong>Name:</strong> {modalData.name}</div>
                        <div><strong>Email:</strong> {modalData.email}</div>
                        {modalData.phone && <div><strong>Phone:</strong> {modalData.phone}</div>}
                        {modalData.address && <div><strong>Address:</strong> {modalData.address}</div>}
                        {modalData.profiletype && <div><strong>Type:</strong> {modalData.profiletype}</div>}
                        {modalData.city && <div><strong>City:</strong> {modalData.city}</div>}
                        {modalData.state && <div><strong>State:</strong> {modalData.state}</div>}
                        {modalData.mobile && <div><strong>Mobile:</strong> {modalData.mobile}</div>}
                        {modalData.businessName && <div><strong>Business:</strong> {modalData.businessName}</div>}
                        {modalData.designation && <div><strong>Designation:</strong> {modalData.designation}</div>}
                        {modalData.website && <div><strong>Website:</strong> {modalData.website}</div>}
                        {modalData.bio && <div><strong>Bio:</strong> {modalData.bio}</div>}
                        {modalData.partyname && <div><strong>Party:</strong> {modalData.partyname}</div>}
                        {modalData.positionname && <div><strong>Position:</strong> {modalData.positionname}</div>}
                        {modalData.birthDate && <div><strong>Birth Date:</strong> {modalData.birthDate}</div>}
                        {modalData.isActive !== undefined && <div><strong>Status:</strong> {modalData.isActive ? 'Active' : 'Inactive'}</div>}
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
}

export default UserManagement;
