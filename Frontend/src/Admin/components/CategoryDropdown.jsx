import React, { useState, useRef, useEffect } from 'react';
import styles from '../ManageImages.module.css';

// Enhanced dropdown with festival support and category grouping
export default function CategoryDropdown({ 
  options = [], 
  categories = [], 
  festivals = [],
  value = '', 
  onChange, 
  placeholder = '-- Select Category --',
  showFestivals = true,
  showPrimary = true
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  const handleSelect = (val) => {
    onChange?.(val);
    setOpen(false);
  };

  // Group and organize categories
  const organizedCategories = React.useMemo(() => {
    // console.log('CategoryDropdown - Raw categories:', categories);
    const groups = {
      primary: [],
      festivals: [],
      custom: []
    };

    // Process categories array (can be objects or strings)
    const allCategories = [...(options || []), ...(categories || [])];
    const seen = new Set();
    
    for (const cat of allCategories) {
      let categoryName, categoryObj;
      
      if (typeof cat === 'string') {
        categoryName = cat.trim();
        categoryObj = { name: categoryName, type: 'custom', isPrimary: false };
      } else if (cat && cat.name) {
        categoryName = cat.name.trim();
        categoryObj = cat;
      } else {
        continue;
      }
      
      if (!categoryName || seen.has(categoryName.toLowerCase())) continue;
      seen.add(categoryName.toLowerCase());
      
      // Group by primary status and type
      if (categoryObj.isPrimary && showPrimary) {
        groups.primary.push(categoryName);
      } else if (categoryObj.type === 'festival' && showFestivals) {
        groups.festivals.push(categoryName);
      } else {
        groups.custom.push(categoryName);
      }
    }

    // Sort each group
    groups.primary.sort();
    groups.festivals.sort();
    groups.custom.sort();

    // console.log('CategoryDropdown - Organized groups:', groups);
    return groups;
  }, [options, categories, showFestivals, showPrimary]);

  // Filter by query
  const filteredGroups = React.useMemo(() => {
    if (!query.trim()) return organizedCategories;
    
    const q = query.toLowerCase();
    return {
      primary: organizedCategories.primary.filter(cat => cat.toLowerCase().includes(q)),
      festivals: organizedCategories.festivals.filter(cat => cat.toLowerCase().includes(q)),
      custom: organizedCategories.custom.filter(cat => cat.toLowerCase().includes(q))
    };
  }, [organizedCategories, query]);

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const hasResults = filteredGroups.primary.length + filteredGroups.festivals.length + filteredGroups.custom.length > 0;

  return (
    <div className={styles.dropdownRoot} ref={rootRef}>
      <div
        role="button"
        tabIndex={0}
        className={styles.dropdownTrigger}
        data-open={open}
        onClick={() => setOpen((s) => !s)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen((s) => !s);
          } else if (e.key === 'Escape') {
            setOpen(false);
          }
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{value || placeholder}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden style={{marginLeft:8}}>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {open && (
        <ul className={styles.dropdownMenu} role="listbox">
          <li style={{padding:8}}>
            <input
              className={styles.dropdownSearchInput}
              placeholder="Search categories..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') { setOpen(false); } }}
              autoFocus
            />
          </li>
          
          <li key="__none" className={styles.dropdownItem} onClick={() => handleSelect('')}>
            {placeholder}
          </li>

          {!hasResults ? (
            <li className={styles.dropdownItem} style={{opacity:0.7}}>No categories found</li>
          ) : (
            <>
              {/* Primary Categories */}
              {filteredGroups.primary.length > 0 && (
                <>
                  <li className={styles.dropdownHeader}>Primary Categories</li>
                  {filteredGroups.primary.map((cat, i) => (
                    <li key={`primary-${i}`} className={styles.dropdownItem} onClick={() => handleSelect(cat)} aria-selected={cat === value}>
                      <span className={styles.primaryBadge}>★</span> {cat}
                    </li>
                  ))}
                </>
              )}
              
              {/* Festival Categories */}
              {filteredGroups.festivals.length > 0 && (
                <>
                  <li className={styles.dropdownHeader}>Festival Categories</li>
                  {filteredGroups.festivals.map((cat, i) => (
                    <li key={`festival-${i}`} className={styles.dropdownItem} onClick={() => handleSelect(cat)} aria-selected={cat === value}>
                      <span className={styles.festivalBadge}>🎉</span> {cat}
                    </li>
                  ))}
                </>
              )}
              
              {/* Custom Categories */}
              {filteredGroups.custom.length > 0 && (
                <>
                  {(filteredGroups.primary.length > 0 || filteredGroups.festivals.length > 0) && (
                    <li className={styles.dropdownHeader}>Other Categories</li>
                  )}
                  {filteredGroups.custom.map((cat, i) => (
                    <li key={`custom-${i}`} className={styles.dropdownItem} onClick={() => handleSelect(cat)} aria-selected={cat === value}>
                      {cat}
                    </li>
                  ))}
                </>
              )}
            </>
          )}
        </ul>
      )}
    </div>
  );
}
