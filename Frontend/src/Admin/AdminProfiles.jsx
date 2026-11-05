
import React, { useEffect, useState } from "react";
import adminApi from "../utils/adminApi";
import styles from "./AdminProfiles.module.css";
import adminStyles from "./AdminHome.module.css";
import ConfirmModal from "./components/ConfirmModal";
import { BASE_URL } from "../url";
import { stripCountryCodeForDisplay } from "../utils/phoneDisplay";

function AdminProfiles() {
  const [profiles, setProfiles] = useState([]);
  const [filterType, setFilterType] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [newProfile, setNewProfile] = useState({
    name: "",
    email: "",
    mobile: "",
    profiletype: "",
    partyname: "",
    positionname: "",
    designation: "",
    businessName: "",
    instatext: "",
    social_twitter: "",
    social_facebook: "",
    social_linkedin: "",
  });
  const [file, setFile] = useState(null);
  const [search, setSearch] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [previewSrc, setPreviewSrc] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = React.useRef(null);
  const [viewProfile, setViewProfile] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  // ✅ Fetch profiles
  const fetchProfiles = async () => {
    try {
      const url = filterType
        ? `/api/profiles/type/${filterType}`
        : `/api/profiles`;

      const res = await adminApi.get(url);
      setProfiles(res.data || []);
    } catch (error) {
      console.error("Error fetching profiles:", error);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, [filterType]);

  // ✅ Create or Update
  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.entries(newProfile).forEach(([key, value]) => {
        formData.append(key, value);
      });
      if (file) formData.append("file", file);

      if (editingId) {
        await adminApi.put(`/api/profiles/${editingId}`, formData);
        alert("✅ Profile updated successfully!");
        setEditingId(null);
      } else {
        await adminApi.post(`/api/profiles`, formData);
        alert("✅ Profile created successfully!");
      }

      fetchProfiles();
      setNewProfile({
        name: "",
        email: "",
        mobile: "",
        profiletype: "",
        partyname: "",
        address: "", // ✅ add this
        positionname: "",
        designation: "",
        businessName: "",
          businessTagline: "",
        instatext: "",
        social_twitter: "",
        social_facebook: "",
        social_linkedin: "",
      });
      setFile(null);
      // close modal when done
      setShowAddModal(false);
    } catch (error) {
      console.error(error);
      alert("❌ Error saving profile");
    }
  };

  // ✅ Delete (with confirm modal)
  const requestDelete = (id) => {
    setConfirmTarget(id);
    setConfirmOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await adminApi.delete(`/api/profiles/${id}`);
      fetchProfiles();
    } catch (error) {
      console.error(error);
      alert("❌ Error deleting profile");
    } finally {
      setConfirmOpen(false);
      setConfirmTarget(null);
    }
  };

  // ✅ Edit
  const handleEdit = (profile) => {
    setNewProfile({
      name: profile.name,
      email: profile.email,
      mobile: stripCountryCodeForDisplay(profile.mobile),
      profiletype: profile.profiletype,
      partyname: profile.partyname || "",
      positionname: profile.positionname,
      designation: profile.designation,
      businessName: profile.businessName,
      instatext: profile.instatext,
      social_twitter: profile.social_twitter,
      social_facebook: profile.social_facebook,
      social_linkedin: profile.social_linkedin,
    });
    setEditingId(profile._id);
    // open edit modal
    setShowAddModal(true);
  };

  // preview selected file for modal
  React.useEffect(() => {
    if (!file) { setPreviewSrc(null); return; }
    const url = URL.createObjectURL(file);
    setPreviewSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const dt = e.dataTransfer;
    if (!dt || !dt.files) return;
    const incoming = Array.from(dt.files).filter(f => f.type.startsWith('image/'));
    if (!incoming.length) return;
    setFile(incoming[0]);
  };

  const handleDragOver = (e) => { e.preventDefault(); setDragActive(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setDragActive(false); };

  const filtered = profiles.filter(p => {
    if (!search || !search.trim()) return true;
    const q = search.trim().toLowerCase();
    return (p.name||'').toLowerCase().includes(q) || (p.email||'').toLowerCase().includes(q) || (p.profiletype||'').toLowerCase().includes(q) || (p.businessName||'').toLowerCase().includes(q);
  });

  // Close action menu on Escape key
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setOpenMenuId(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Close action menu when clicking outside (or outside the three-dot button)
  React.useEffect(() => {
    const onDocClick = (e) => {
      if (!openMenuId) return;
      const target = e.target;
      // if click happened inside the menu or on the action button, keep it open
      if (target.closest(`.${styles.actionMenu}`) || target.closest(`.${styles.actionBtn}`)) return;
      setOpenMenuId(null);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [openMenuId]);

  React.useEffect(() => {
    if (showAddModal || viewProfile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [showAddModal, viewProfile]);

  const isFormValid = (newProfile.name || '').toString().trim().length > 0 && (newProfile.email || '').toString().trim().length > 0;

  return (
    <div className={styles.container}>
      <div className={`${adminStyles.dashboardHeader} ${styles.headerTop}`}>
        <div>
          <div className={adminStyles.activeTitle}>Profiles</div>
          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Manage public profiles</div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <input className={adminStyles.searchInput} placeholder="Search name, email or business" value={search} onChange={(e) => setSearch(e.target.value)} />
          <div style={{ fontSize: 13, color: '#475569', background: '#fff', padding: '6px 10px', borderRadius: 8, boxShadow: '0 6px 18px rgba(2,6,23,0.06)' }}>{filtered.length} profiles</div>
        </div>
      </div>

      <div className={styles.containerInner} style={{ marginTop: 60 }}>
      {/* Subheader: single filter + Add button */}
      <div className={styles.subHeader}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <label style={{ color: '#475569', fontWeight:600 }}>Filter</label>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={styles.smallSelect}>
            <option value="">All Profiles</option>
            <option value="political">Political</option>
            <option value="business">Business</option>
            <option value="professional">Professional</option>
            <option value="social">Social</option>
            <option value="personal">Personal</option>
          </select>
        </div>

        <div>
          <button className={styles.uploadActionBtn} onClick={() => { setShowAddModal(true); setEditingId(null); setNewProfile({ name:'', email:'', mobile:'', profiletype:'', partyname:'', positionname:'', designation:'', businessName:'', businessTagline:'', address:'', instatext:'', social_twitter:'', social_facebook:'', social_linkedin:'' }); setFile(null); }}>Add Profile</button>
        </div>
      </div>

      {/* ✅ Profiles Table */}
      <div className={styles.tableContainer}>
        <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{width:80}}>Image</th>
              <th>Name</th>
              <th>Email</th>
              <th>Type</th>
              <th>Business</th>
              <th style={{width:80}}>Action</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((p) => (
              <tr key={p._id}>
                <td>
                  {p.file ? (
                    <img
                      src={p.file.startsWith("http") ? p.file : `${BASE_URL}${p.file}`}
                      alt={p.name}
                      width="60"
                      style={{ borderRadius: "8px", cursor: 'pointer' }}
                      onClick={() => setViewProfile(p)}
                    />
                  ) : (
                    "No Image"
                  )}
                </td>

                <td>{p.name}</td>
                <td>{p.email}</td>
                <td>{p.profiletype || "-"}</td>
                <td>{p.businessName || "-"}</td>
                <td>
                  <div className={styles.actionCell}>
                    <button
                      className={styles.actionBtn}
                      onClick={(e) => {
                        // compute fixed position for menu to avoid changing table layout
                        e.stopPropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        const menuWidth = 180; // estimated menu width
                        const itemCount = 3;
                        const itemHeight = 40; // estimate per menu item
                        const menuHeight = itemCount * itemHeight + 8;

                        // preferred left: align menu right edge with button right edge
                        let left = Math.round(rect.right - menuWidth);
                        if (left < 8) left = Math.round(rect.left);
                        // clamp to viewport
                        const maxLeft = Math.max(8, window.innerWidth - menuWidth - 8);
                        if (left > maxLeft) left = maxLeft;

                        // preferred top: below the button
                        let top = Math.round(rect.bottom + 6);
                        // if not enough space below, flip above the button
                        if (top + menuHeight > window.innerHeight - 8) {
                          top = Math.round(rect.top - menuHeight - 6);
                          if (top < 8) top = 8; // clamp to top
                        }

                        setMenuPos({ top, left });
                        setOpenMenuId(openMenuId === p._id ? null : p._id);
                      }}
                      aria-haspopup="true"
                      aria-expanded={openMenuId === p._id}
                    >
                      ⋯
                    </button>
                    {openMenuId === p._id && (
                      <div className={styles.actionMenu} role="menu" style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, minWidth: 160 }}>
                        <button className={styles.menuItem} onClick={() => { setOpenMenuId(null); handleEdit(p); }}>Edit</button>
                        <button className={styles.menuItem} onClick={() => { setOpenMenuId(null); requestDelete(p._id); }}>Delete</button>
                        <button className={styles.menuItem} onClick={() => { setOpenMenuId(null); setViewProfile(p); }}>View</button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
      </div>

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => { setShowAddModal(false); setFile(null); }}>
          <div className={styles.modalDialog} role="dialog" onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => { setShowAddModal(false); setFile(null); }}>✕</button>
            <div className={styles.modalBody}>
              <div className={styles.modalLeft} onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}>
                <div className={`${styles.dropzone} ${dragActive ? styles.dragActive : ''}`} onClick={() => fileInputRef.current && fileInputRef.current.click()}>
                  {previewSrc ? (
                    <img src={previewSrc} alt="preview" className={styles.previewImage} />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      <div className={styles.avatarIcon}>👤</div>
                      <div className={styles.dropzoneText}>Click or drag an image here</div>
                      <div className={styles.dropzoneHint}>PNG, JPG • 1MB max</div>
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" style={{ display: 'none' }} accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
                </div>
                {/* Social links placed under the dropzone for quick entry */}
                <div className={styles.leftSocials}>
                  <div className={styles.leftSocialField}>
                    <label className={styles.leftLabel}>Instagram</label>
                    <input className={styles.leftInput} value={newProfile.instatext || ''} onChange={(e) => setNewProfile({ ...newProfile, instatext: e.target.value })} placeholder="https://instagram.com/..." />
                  </div>
                  <div className={styles.leftSocialField}>
                    <label className={styles.leftLabel}>Twitter</label>
                    <input className={styles.leftInput} value={newProfile.social_twitter || ''} onChange={(e) => setNewProfile({ ...newProfile, social_twitter: e.target.value })} placeholder="https://twitter.com/..." />
                  </div>
                  <div className={styles.leftSocialField}>
                    <label className={styles.leftLabel}>Facebook</label>
                    <input className={styles.leftInput} value={newProfile.social_facebook || ''} onChange={(e) => setNewProfile({ ...newProfile, social_facebook: e.target.value })} placeholder="https://facebook.com/..." />
                  </div>
                  <div className={styles.leftSocialField}>
                    <label className={styles.leftLabel}>LinkedIn</label>
                    <input className={styles.leftInput} value={newProfile.social_linkedin || ''} onChange={(e) => setNewProfile({ ...newProfile, social_linkedin: e.target.value })} placeholder="https://linkedin.com/..." />
                  </div>
                </div>
              </div>
              <form className={styles.modalRight} onSubmit={handleCreateOrUpdate}>
                <div className={styles.modalHeader}><h3>{editingId ? 'Edit Profile' : 'Add Profile'}</h3></div>

                <div className={styles.formGrid}>
                  <div className={styles.field}>
                    <label>Name <span className={styles.reqStar}>*</span></label>
                    <input value={newProfile.name} onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })} placeholder="Full name" />
                  </div>
                  <div className={styles.field}>
                    <label>Email <span className={styles.reqStar}>*</span></label>
                    <input value={newProfile.email} onChange={(e) => setNewProfile({ ...newProfile, email: e.target.value })} placeholder="email@example.com" />
                  </div>

                  <div className={styles.field}>
                    <label>Mobile</label>
                    <input value={newProfile.mobile} onChange={(e) => setNewProfile({ ...newProfile, mobile: e.target.value })} placeholder="Mobile" />
                  </div>
                  <div className={styles.field}>
                    <label>Profile Type</label>
                    <select value={newProfile.profiletype} onChange={(e) => setNewProfile({ ...newProfile, profiletype: e.target.value, partyname: '' })}>
                      <option value="">Select type</option>
                      <option value="political">Political</option>
                      <option value="business">Business</option>
                      <option value="professional">Professional</option>
                      <option value="social">Social</option>
                      <option value="personal">Personal</option>
                    </select>
                  </div>

                  {newProfile.profiletype === 'political' && (
                    <div className={styles.field}>
                      <label>Party</label>
                      <select value={newProfile.partyname} onChange={(e) => setNewProfile({ ...newProfile, partyname: e.target.value })}>
                        <option value="">-- Select Party --</option>
                        <option value="BJP">BJP</option>
                        <option value="Congress">Congress</option>
                        <option value="AAP">AAP</option>
                        <option value="BSP">BSP</option>
                        <option value="CPI">CPI</option>
                        <option value="NCP">NCP</option>
                        <option value="NPP">NPP</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  )}

                  <div className={styles.field}>
                    <label>Position</label>
                    <input value={newProfile.positionname || ''} onChange={(e) => setNewProfile({ ...newProfile, positionname: e.target.value })} placeholder="Position/Title" />
                  </div>
                  <div className={styles.field}>
                    <label>Designation</label>
                    <input value={newProfile.designation || ''} onChange={(e) => setNewProfile({ ...newProfile, designation: e.target.value })} placeholder="Designation" />
                  </div>

                  <div className={styles.field}>
                    <label>Business Name</label>
                    <input value={newProfile.businessName || ''} onChange={(e) => setNewProfile({ ...newProfile, businessName: e.target.value })} placeholder="Business/Organization" />
                  </div>
                  <div className={styles.field}>
                    <label>Business Tagline</label>
                    <input value={newProfile.businessTagline || ''} onChange={(e) => setNewProfile({ ...newProfile, businessTagline: e.target.value })} placeholder="Short tagline" />
                  </div>

                  <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
                    <label>Address</label>
                    <input value={newProfile.address || ''} onChange={(e) => setNewProfile({ ...newProfile, address: e.target.value })} placeholder="Address" />
                  </div>

                  {/* social inputs moved to left panel */}
                </div>

                <div className={styles.modalActions}>
                  <button type="submit" className={styles.uploadActionBtn} disabled={!isFormValid} title={!isFormValid ? 'Please enter name and email' : ''}>{editingId ? 'Update Profile' : 'Add Profile'}</button>
                  <button type="button" className={styles.dangerBtnOutline} onClick={() => { setShowAddModal(false); setFile(null); }}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewProfile && (
        <div className={styles.modalOverlay} onClick={() => setViewProfile(null)}>
          <div className={styles.viewDialog} role="dialog" onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setViewProfile(null)}>✕</button>
            <div className={styles.viewContent}>
              {viewProfile.file ? (
                <img className={styles.viewImage} src={viewProfile.file.startsWith('http') ? viewProfile.file : `${BASE_URL}${viewProfile.file}`} alt={viewProfile.name} />
              ) : (
                <div className={styles.viewImage} />
              )}
              <div className={styles.viewDetails}>
                <h3 style={{ margin: 0 }}>{viewProfile.name}</h3>
                <div className={styles.viewList}>
                  <div className={styles.viewItem}><div className={styles.viewLabel}>Email</div><div className={styles.viewValue}>{viewProfile.email || '-'}</div></div>
                  <div className={styles.viewItem}><div className={styles.viewLabel}>Mobile</div><div className={styles.viewValue}>{stripCountryCodeForDisplay(viewProfile.mobile) || '-'}</div></div>
                  <div className={styles.viewItem}><div className={styles.viewLabel}>Type</div><div className={styles.viewValue}>{viewProfile.profiletype || '-'}</div></div>
                  <div className={styles.viewItem}><div className={styles.viewLabel}>Party</div><div className={styles.viewValue}>{viewProfile.partyname || '-'}</div></div>
                  <div className={styles.viewItem}><div className={styles.viewLabel}>Position</div><div className={styles.viewValue}>{viewProfile.positionname || '-'}</div></div>
                  <div className={styles.viewItem}><div className={styles.viewLabel}>Designation</div><div className={styles.viewValue}>{viewProfile.designation || '-'}</div></div>
                  <div className={styles.viewItem}><div className={styles.viewLabel}>Business</div><div className={styles.viewValue}>{viewProfile.businessName || '-'}</div></div>
                  <div className={styles.viewItem}><div className={styles.viewLabel}>Tagline</div><div className={styles.viewValue}>{viewProfile.businessTagline || '-'}</div></div>
                  <div className={styles.viewItem}><div className={styles.viewLabel}>Address</div><div className={styles.viewValue} style={{ fontWeight: 400 }}>{viewProfile.address || '-'}</div></div>

                  <div className={styles.viewItem}><div className={styles.viewLabel}>Instagram</div><div className={styles.viewValue}>{viewProfile.instatext ? (<a className={styles.viewLink} href={viewProfile.instatext} target="_blank" rel="noreferrer">{viewProfile.instatext}</a>) : '-'}</div></div>
                  <div className={styles.viewItem}><div className={styles.viewLabel}>Twitter</div><div className={styles.viewValue}>{viewProfile.social_twitter ? (<a className={styles.viewLink} href={viewProfile.social_twitter} target="_blank" rel="noreferrer">{viewProfile.social_twitter}</a>) : '-'}</div></div>
                  <div className={styles.viewItem}><div className={styles.viewLabel}>Facebook</div><div className={styles.viewValue}>{viewProfile.social_facebook ? (<a className={styles.viewLink} href={viewProfile.social_facebook} target="_blank" rel="noreferrer">{viewProfile.social_facebook}</a>) : '-'}</div></div>
                  <div className={styles.viewItem}><div className={styles.viewLabel}>LinkedIn</div><div className={styles.viewValue}>{viewProfile.social_linkedin ? (<a className={styles.viewLink} href={viewProfile.social_linkedin} target="_blank" rel="noreferrer">{viewProfile.social_linkedin}</a>) : '-'}</div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmOpen}
        title="Delete profile"
        message="Are you sure you want to delete this profile? This can't be undone."
        onConfirm={() => handleDelete(confirmTarget)}
        onCancel={() => { setConfirmOpen(false); setConfirmTarget(null); }}
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />
    </div>
  );
}

export default AdminProfiles;
