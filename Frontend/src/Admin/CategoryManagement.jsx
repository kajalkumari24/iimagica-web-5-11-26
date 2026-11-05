import React, { useState, useEffect } from 'react';
import adminApi from "../utils/adminApi";
import styles from './CategoryManagement.module.css';
import './clean-ui.css';
import { 
  FaStar, 
  FaCalendarAlt, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaCheck, 
  FaTimes, 
  FaCrown, 
  FaGift,
  FaGripVertical,
  FaSave
} from 'react-icons/fa';
import ConfirmModal from './components/ConfirmModal';

const PROFILE_TYPES = [
  { id: 'business', label: 'Business' },
  { id: 'professional', label: 'Professional' },
  { id: 'personal', label: 'Personal' },
  { id: 'political', label: 'Political' },
  { id: 'social', label: 'Social' },
  { id: 'brand', label: 'Brand' }
];

// Simple drag and drop implementation
const DragDropProvider = ({ children, onReorder }) => {
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);

  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, item) => {
    e.preventDefault();
    setDragOverItem(item);
  };

  const handleDrop = (e, dropItem) => {
    e.preventDefault();
    if (draggedItem && draggedItem._id !== dropItem._id) {
      onReorder(draggedItem, dropItem);
    }
    setDraggedItem(null);
    setDragOverItem(null);
  };

  return (
    <div>
      {children({ handleDragStart, handleDragOver, handleDrop, draggedItem, dragOverItem })}
    </div>
  );
};

function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [festivals, setFestivals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [inlineEditing, setInlineEditing] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategory, setNewCategory] = useState({
    name: '',
    type: 'custom',
    isPrimary: false,
    festivalDate: '',
    order: 0,
    profileTypes: []
  });
  const [toasts, setToasts] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ open: false, category: null });
  const [editModal, setEditModal] = useState({ open: false, category: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [categoriesRes, festivalsRes] = await Promise.all([
        adminApi.get(`/api/categories/detailed`),
        adminApi.get(`/api/festivals`)
      ]);
      setCategories(categoriesRes.data || []);
      setFestivals(festivalsRes.data || []);
    } catch (err) {
      console.error('API Error:', err);
      if (err.response?.status === 401) {
        addToast('Admin authentication required', 'error');
      } else {
        addToast('Failed to load data', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const addToast = (message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  const handleEdit = (category) => {
    setEditModal({ open: true, category });
    setEditForm({
      name: category.name || '',
      type: category.type || 'custom',
      isPrimary: category.isPrimary || false,
      order: category.order || 0,
      festivalDate: category.festivalDate ? 
        new Date(category.festivalDate).toISOString().split('T')[0] : '',
      profileTypes: category.profileTypes || []
    });
  };

  const saveEdit = async () => {
    try {
      await adminApi.put(`/api/categories/${editModal.category._id}`, editForm);
      addToast('Category updated successfully', 'success');
      setEditModal({ open: false, category: null });
      fetchData();
    } catch (err) {
      addToast('Failed to update category', 'error');
    }
  };

  const handleDelete = async (category) => {
    setConfirmModal({ open: true, category });
  };

  const confirmDelete = async () => {
    try {
      await adminApi.delete(`/api/categories/${confirmModal.category._id}`);
      addToast('Category deleted successfully', 'success');
      setConfirmModal({ open: false, category: null });
      fetchData();
    } catch (err) {
      addToast('Failed to delete category', 'error');
    }
  };

  const handleAddCategory = async () => {
    try {
      await adminApi.post(`/api/categories`, newCategory);
      addToast('Category created successfully', 'success');
      setShowAddModal(false);
      setNewCategory({ 
        name: '', 
        type: 'custom', 
        isPrimary: false, 
        festivalDate: '',
        order: 0,
        profileTypes: []
      });
      fetchData();
    } catch (err) {
      addToast('Failed to create category', 'error');
    }
  };

  const togglePrimary = async (id, currentStatus) => {
    try {
      await adminApi.patch(`/api/categories/${id}/primary`, { 
        isPrimary: !currentStatus 
      });
      
      // Update local state without page reload
      setCategories(prev => prev.map(cat => 
        cat._id === id ? { ...cat, isPrimary: !currentStatus } : cat
      ));
      
      addToast(
        `Category ${!currentStatus ? 'marked as primary' : 'removed from primary'}`, 
        'success'
      );
    } catch (err) {
      addToast('Failed to update primary status', 'error');
    }
  };

  const updateOrder = async (id, newOrder) => {
    try {
      await adminApi.put(`/api/categories/${id}`, { 
        order: newOrder 
      });
      
      // Update local state
      setCategories(prev => prev.map(cat => 
        cat._id === id ? { ...cat, order: newOrder } : cat
      ));
      
      addToast('Order updated successfully', 'success');
    } catch (err) {
      addToast('Failed to update order', 'error');
    }
  };

  const startInlineEdit = (categoryId, field, currentValue) => {
    setInlineEditing({ [categoryId]: { field, value: currentValue } });
  };

  const saveInlineEdit = async (categoryId) => {
    const editData = inlineEditing[categoryId];
    if (!editData) return;

    try {
      await adminApi.put(`/api/categories/${categoryId}`, {
        [editData.field]: editData.field === 'order' ? parseInt(editData.value) : editData.value
      });
      
      // Update local state
      setCategories(prev => prev.map(cat => 
        cat._id === categoryId ? { ...cat, [editData.field]: editData.field === 'order' ? parseInt(editData.value) : editData.value } : cat
      ));
      
      setInlineEditing({});
      addToast('Updated successfully', 'success');
    } catch (err) {
      addToast('Failed to update', 'error');
    }
  };

  const reorderCategories = async (draggedCategory, dropCategory) => {
    try {
      // Create new order based on drop position
      const sortedPrimary = [...primaryCategories].sort((a, b) => (a.order || 0) - (b.order || 0));
      const dragIndex = sortedPrimary.findIndex(cat => cat._id === draggedCategory._id);
      const dropIndex = sortedPrimary.findIndex(cat => cat._id === dropCategory._id);
      
      // Remove dragged item and insert at new position
      const newOrder = [...sortedPrimary];
      const [removed] = newOrder.splice(dragIndex, 1);
      newOrder.splice(dropIndex, 0, removed);
      
      // Update orders
      const updates = newOrder.map((cat, index) => ({
        id: cat._id,
        order: index
      }));
      
      await adminApi.patch(`/api/categories/reorder`, {
        categories: updates
      });
      
      // Update local state
      setCategories(prev => prev.map(cat => {
        const update = updates.find(u => u.id === cat._id);
        return update ? { ...cat, order: update.order } : cat;
      }));
      
      addToast('Categories reordered successfully', 'success');
    } catch (err) {
      addToast('Failed to reorder categories', 'error');
    }
  };

  const cancelInlineEdit = () => {
    setInlineEditing({});
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const anyModalOpen = showAddModal || editModal.open || confirmModal.open;
    const previousOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    if (anyModalOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [showAddModal, editModal.open, confirmModal.open]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showAddModal) setShowAddModal(false);
        if (editModal.open) setEditModal({ open: false, category: null });
        if (confirmModal.open) setConfirmModal({ open: false, category: null });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAddModal, editModal.open, confirmModal.open]);

  const primaryCategories = categories.filter(c => c.isPrimary);
  const festivalCategories = categories.filter(c => c.type === 'festival');
  const customCategories = categories.filter(c => !c.isPrimary && c.type !== 'festival');

  // Filter and sort categories
  const filteredCategories = React.useMemo(() => {
    let filtered = categories;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(cat => 
        cat.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      if (typeFilter === 'primary') {
        filtered = filtered.filter(cat => cat.isPrimary);
      } else if (typeFilter === 'festival') {
        filtered = filtered.filter(cat => cat.type === 'festival');
      } else if (typeFilter === 'custom') {
        filtered = filtered.filter(cat => cat.type === 'custom' && !cat.isPrimary);
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'type') {
        if (a.isPrimary !== b.isPrimary) return b.isPrimary - a.isPrimary;
        return a.type.localeCompare(b.type);
      } else if (sortBy === 'created') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      return 0;
    });

    return filtered;
  }, [categories, searchTerm, typeFilter, sortBy]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} admin-clean-ui`}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Category Management</h1>
        </div>
        <button className={styles.addBtn} onClick={() => setShowAddModal(true)}>
          <FaPlus /> Add Category
        </button>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{background: '#3b82f6'}}>
            <FaStar />
          </div>
          <div>
            <div className={styles.statNumber}>{categories.length}</div>
            <div className={styles.statLabel}>Total Categories</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{background: '#f59e0b'}}>
            <FaCrown />
          </div>
          <div>
            <div className={styles.statNumber}>{primaryCategories.length}</div>
            <div className={styles.statLabel}>Primary Categories</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{background: '#ec4899'}}>
            <FaGift />
          </div>
          <div>
            <div className={styles.statNumber}>{festivalCategories.length}</div>
            <div className={styles.statLabel}>Festival Categories</div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className={styles.filtersCard}>
        <div className={styles.searchSection}>
          <input
            type="text"
            placeholder="Search categories..."
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className={styles.filterSection}>
          <select
            className={styles.filterSelect}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="primary">Primary Only</option>
            <option value="festival">Festival Only</option>
            <option value="custom">Custom Only</option>
          </select>
          <select
            className={styles.filterSelect}
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="name">Sort by Name</option>
            <option value="type">Sort by Type</option>
            <option value="created">Sort by Created</option>
          </select>
        </div>
      </div>

      {/* Categories Grid */}
      <div className={styles.categoriesGrid}>
        {filteredCategories.length === 0 ? (
          <div className={styles.emptyResults}>
            <p>No categories found matching your search criteria.</p>
          </div>
        ) : (
          <>
            {/* Primary Categories */}
            {(typeFilter === 'all' || typeFilter === 'primary') && (
              <div className={styles.categorySection}>
                <div className={styles.sectionHeader}>
                  <FaCrown className={styles.sectionIcon} />
                  <h3>Primary Categories</h3>
                  <span className={styles.sectionCount}>{filteredCategories.filter(c => c.isPrimary).length}</span>
                </div>
                <DragDropProvider onReorder={reorderCategories}>
                  {({ handleDragStart, handleDragOver, handleDrop, draggedItem, dragOverItem }) => (
                    <div className={styles.categoryCards}>
                      {filteredCategories
                        .filter(c => c.isPrimary)
                        .sort((a, b) => (a.order || 0) - (b.order || 0))
                        .map(category => {
                          const isEditing = inlineEditing[category._id];
                          const isDragging = draggedItem?._id === category._id;
                          const isDragOver = dragOverItem?._id === category._id;
                          return (
                            <div
                              key={category._id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, category)}
                              onDragOver={(e) => handleDragOver(e, category)}
                              onDrop={(e) => handleDrop(e, category)}
                              className={`${styles.draggableCard} ${isDragging ? styles.dragging : ''} ${isDragOver ? styles.dragOver : ''}`}
                            >
                              <div className={styles.dragHandle}>
                                <FaGripVertical />
                              </div>
                              <CategoryCard 
                                category={category} 
                                isEditing={isEditing}
                                togglePrimary={togglePrimary} 
                                handleEdit={handleEdit} 
                                handleDelete={handleDelete}
                                startInlineEdit={startInlineEdit} 
                                saveInlineEdit={saveInlineEdit} 
                                cancelInlineEdit={cancelInlineEdit} 
                                setInlineEditing={setInlineEditing} 
                              />
                            </div>
                          );
                        })
                      }
                    </div>
                  )}
                </DragDropProvider>
              </div>
            )}

            {/* Festival Categories */}
            {(typeFilter === 'all' || typeFilter === 'festival') && (
              <div className={styles.categorySection}>
                <div className={styles.sectionHeader}>
                  <FaGift className={styles.sectionIcon} />
                  <h3>Festival Categories</h3>
                  <span className={styles.sectionCount}>{filteredCategories.filter(c => c.type === 'festival').length}</span>
                </div>
                <div className={styles.categoryCards}>
                  {filteredCategories.filter(c => c.type === 'festival').map(category => {
                    const isEditing = inlineEditing[category._id];
                    return (
                      <CategoryCard key={category._id} category={category} isEditing={isEditing}
                        togglePrimary={togglePrimary} handleEdit={handleEdit} handleDelete={handleDelete}
                        startInlineEdit={startInlineEdit} saveInlineEdit={saveInlineEdit} 
                        cancelInlineEdit={cancelInlineEdit} setInlineEditing={setInlineEditing} />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Custom Categories */}
            {(typeFilter === 'all' || typeFilter === 'custom') && (
              <div className={styles.categorySection}>
                <div className={styles.sectionHeader}>
                  <FaStar className={styles.sectionIcon} />
                  <h3>Custom Categories</h3>
                  <span className={styles.sectionCount}>{filteredCategories.filter(c => !c.isPrimary && c.type !== 'festival').length}</span>
                </div>
                <div className={styles.categoryCards}>
                  {filteredCategories.filter(c => !c.isPrimary && c.type !== 'festival').map(category => {
                    const isEditing = inlineEditing[category._id];
                    return (
                      <CategoryCard key={category._id} category={category} isEditing={isEditing}
                        togglePrimary={togglePrimary} handleEdit={handleEdit} handleDelete={handleDelete}
                        startInlineEdit={startInlineEdit} saveInlineEdit={saveInlineEdit} 
                        cancelInlineEdit={cancelInlineEdit} setInlineEditing={setInlineEditing} />
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Create New Category</h3>
              <button className={styles.closeModalBtn} onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <div className={styles.modalBody}>
            <div className={styles.categoryTypeSelector}>
              <div 
                className={`${styles.typeCard} ${newCategory.type === 'custom' ? styles.active : ''}`}
                onClick={() => setNewCategory(prev => ({ ...prev, type: 'custom', isPrimary: false }))}
              >
                <FaStar className={styles.typeIcon} />
                <div className={styles.typeTitle}>Custom Category</div>
                <div className={styles.typeDesc}>General purpose category</div>
              </div>
              
              <div 
                className={`${styles.typeCard} ${newCategory.type === 'festival' ? styles.active : ''}`}
                onClick={() => setNewCategory(prev => ({ ...prev, type: 'festival', isPrimary: false }))}
              >
                <FaGift className={styles.typeIcon} />
                <div className={styles.typeTitle}>Festival Category</div>
                <div className={styles.typeDesc}>Special occasion category</div>
              </div>
            </div>

            <div className={styles.formSection}>
              <label className={styles.formLabel}>Category Name *</label>
              <input 
                type="text" 
                className={styles.formInput}
                value={newCategory.name}
                onChange={e => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter category name (e.g., Good Morning, Diwali)"
                autoFocus
              />
            </div>

            <div className={styles.formSection}>
              <label className={styles.formLabel}>Display Order (for Primary categories)</label>
              <input 
                type="number" 
                className={styles.formInput}
                value={newCategory.order || 0}
                onChange={e => setNewCategory(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                placeholder="0"
                min="0"
              />
              <small className={styles.formHint}>Lower numbers appear first (0 = highest priority)</small>
            </div>

            {newCategory.type === 'festival' && (
              <div className={styles.formSection}>
                <label className={styles.formLabel}>Festival Date</label>
                <input 
                  type="date" 
                  className={styles.formInput}
                  value={newCategory.festivalDate}
                  onChange={e => setNewCategory(prev => ({ ...prev, festivalDate: e.target.value }))}
                />
              </div>
            )}

            <div className={styles.formSection}>
              <label className={styles.formLabel}>Target Profile Types (Optional)</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px', marginTop: '8px' }}>
                {PROFILE_TYPES.map(pt => (
                  <label key={pt.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={newCategory.profileTypes.includes(pt.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewCategory(prev => ({ ...prev, profileTypes: [...prev.profileTypes, pt.id] }));
                        } else {
                          setNewCategory(prev => ({ ...prev, profileTypes: prev.profileTypes.filter(t => t !== pt.id) }));
                        }
                      }}
                    />
                    {pt.label}
                  </label>
                ))}
              </div>
              <small className={styles.formHint}>Select which profile types can see this category. Leave empty for all.</small>
            </div>

            <div className={styles.primaryToggle}>
              <div className={styles.toggleContainer}>
                <input 
                  type="checkbox" 
                  id="primaryToggle"
                  className={styles.toggleInput}
                  checked={newCategory.isPrimary}
                  onChange={e => setNewCategory(prev => ({ ...prev, isPrimary: e.target.checked }))}
                />
                <label htmlFor="primaryToggle" className={styles.toggleLabel}>
                  <FaCrown className={styles.toggleIcon} />
                  <div>
                    <div className={styles.toggleTitle}>Mark as Primary Category</div>
                    <div className={styles.toggleDesc}>Primary categories appear first in lists</div>
                  </div>
                </label>
              </div>
            </div>
            </div>

            <div className={styles.modalFooter}>
              <button 
                className={styles.cancelBtn} 
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
              <button 
                className={styles.createBtn}
                onClick={handleAddCategory}
                disabled={!newCategory.name.trim()}
              >
                <FaPlus /> Create Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editModal.open && (
        <div className={styles.modalOverlay} onClick={() => setEditModal({ open: false, category: null })}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Edit Category</h3>
              <button className={styles.closeModalBtn} onClick={() => setEditModal({ open: false, category: null })}>×</button>
            </div>
            <div className={styles.modalBody}>
            <div className={styles.formSection}>
              <label className={styles.formLabel}>Category Name *</label>
              <input 
                type="text" 
                className={styles.formInput}
                value={editForm.name}
                onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter category name"
              />
            </div>

            <div className={styles.formSection}>
              <label className={styles.formLabel}>Display Order</label>
              <input 
                type="number" 
                className={styles.formInput}
                value={editForm.order || 0}
                onChange={e => setEditForm(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                placeholder="0"
                min="0"
              />
              <small className={styles.formHint}>Lower numbers appear first (0 = highest priority)</small>
            </div>

            <div className={styles.formSection}>
              <label className={styles.formLabel}>Type</label>
              <select 
                className={styles.formInput}
                value={editForm.type}
                onChange={e => setEditForm(prev => ({ ...prev, type: e.target.value }))}
              >
                <option value="custom">Custom</option>
                <option value="festival">Festival</option>
              </select>
            </div>

            {editForm.type === 'festival' && (
              <div className={styles.formSection}>
                <label className={styles.formLabel}>Festival Date</label>
                <input 
                  type="date" 
                  className={styles.formInput}
                  value={editForm.festivalDate}
                  onChange={e => setEditForm(prev => ({ ...prev, festivalDate: e.target.value }))}
                />
              </div>
            )}

            <div className={styles.formSection}>
              <label className={styles.formLabel}>Target Profile Types (Optional)</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px', marginTop: '8px' }}>
                {PROFILE_TYPES.map(pt => (
                  <label key={pt.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={editForm.profileTypes?.includes(pt.id) || false}
                      onChange={(e) => {
                        const currentTypes = editForm.profileTypes || [];
                        if (e.target.checked) {
                          setEditForm(prev => ({ ...prev, profileTypes: [...currentTypes, pt.id] }));
                        } else {
                          setEditForm(prev => ({ ...prev, profileTypes: currentTypes.filter(t => t !== pt.id) }));
                        }
                      }}
                    />
                    {pt.label}
                  </label>
                ))}
              </div>
              <small className={styles.formHint}>Select which profile types can see this category. Leave empty for all.</small>
            </div>

            <div className={styles.primaryToggle}>
              <div className={styles.toggleContainer}>
                <input 
                  type="checkbox" 
                  id="editPrimaryToggle"
                  className={styles.toggleInput}
                  checked={editForm.isPrimary}
                  onChange={e => setEditForm(prev => ({ ...prev, isPrimary: e.target.checked }))}
                />
                <label htmlFor="editPrimaryToggle" className={styles.toggleLabel}>
                  <FaCrown className={styles.toggleIcon} />
                  <div>
                    <div className={styles.toggleTitle}>Mark as Primary Category</div>
                    <div className={styles.toggleDesc}>Primary categories appear first in lists</div>
                  </div>
                </label>
              </div>
            </div>
            </div>

            <div className={styles.modalFooter}>
              <button 
                className={styles.cancelBtn} 
                onClick={() => setEditModal({ open: false, category: null })}
              >
                Cancel
              </button>
              <button 
                className={styles.createBtn}
                onClick={saveEdit}
                disabled={!editForm.name.trim()}
              >
                <FaCheck /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        open={confirmModal.open}
        title="Delete Category"
        message={`Are you sure you want to delete "${confirmModal.category?.name}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setConfirmModal({ open: false, category: null })}
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />

      {/* Toasts */}
      <div className={styles.toastContainer}>
        {toasts.map(toast => (
          <div key={toast.id} className={`${styles.toast} ${styles[toast.type]}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}

// Category Section Component
function CategorySection({ 
  title, 
  icon, 
  categories, 
  editingId, 
  editForm, 
  setEditForm, 
  onEdit, 
  onSave, 
  onDelete, 
  onTogglePrimary, 
  setEditingId, 
  emptyMessage, 
  emptyIcon 
}) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        {icon}
        <h2>{title}</h2>
        <span className={styles.badge}>{categories.length}</span>
      </div>
      <div className={styles.categoryList}>
        {categories.map(category => (
          <CategoryCard 
            key={category._id} 
            category={category} 
            editingId={editingId}
            editForm={editForm}
            setEditForm={setEditForm}
            onEdit={onEdit}
            onSave={onSave}
            onDelete={onDelete}
            onTogglePrimary={onTogglePrimary}
            setEditingId={setEditingId}
          />
        ))}
        {categories.length === 0 && (
          <div className={styles.emptyState}>
            {emptyIcon}
            <p>{emptyMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Category Card Component
function CategoryCard({ 
  category, 
  isEditing,
  togglePrimary,
  handleEdit,
  handleDelete,
  startInlineEdit,
  saveInlineEdit,
  cancelInlineEdit,
  setInlineEditing
}) {
  return (
    <div className={styles.categoryCard}>
      <div className={styles.categoryInfo}>
        <div className={styles.categoryNameRow}>
          <span className={styles.categoryName}>
            {category.name}
          </span>
          
          {category.isPrimary && (
            <div className={styles.orderContainer}>
              <span className={styles.orderBadge}>
                #{category.order || 0}
              </span>
            </div>
          )}
        </div>
        
        <div className={styles.categoryBadges}>
          {category.isPrimary && (
            <span className={styles.primaryBadge}>
              <FaCrown /> Primary
            </span>
          )}
          <span className={`${styles.typeBadge} ${styles[category.type]}`}>
            {category.type === 'festival' ? <FaGift /> : <FaStar />}
            {category.type}
          </span>
        </div>
        
        {category.festivalDate && (
          <div className={styles.festivalDate}>
            <FaCalendarAlt /> {new Date(category.festivalDate).toLocaleDateString()}
          </div>
        )}
      </div>
      
      <div className={styles.categoryActions}>
        <button 
          className={`${styles.actionBtn} ${styles.primaryAction} ${category.isPrimary ? styles.active : ''}`}
          onClick={() => togglePrimary(category._id, category.isPrimary)}
          title={category.isPrimary ? 'Remove from primary' : 'Mark as primary'}
        >
          <FaStar />
        </button>
        <button className={styles.actionBtn} onClick={() => handleEdit(category)}>
          <FaEdit />
        </button>
        <button className={styles.actionBtn} onClick={() => handleDelete(category)}>
          <FaTrash />
        </button>
      </div>
    </div>
  );
}

export default CategoryManagement;
