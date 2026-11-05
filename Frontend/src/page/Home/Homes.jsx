import React, { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AutoSizer, List, WindowScroller } from "react-virtualized";
import axios from "axios";
import { BASE_URL } from "../../url";
import socket from "../../socket";

import Header from "../Header/Header";
import BottomNavbar from "../../components/BottomNavbar";
import WeekCalendar from "./WeekCalendar";
import ThisWeekEvents from "./ThisWeek";
import Sliders from "./Slider";
import Calendar from "../../Calendar";
import { FaSearch, FaTimes, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import ReviewPopup from "../../components/ReviewPopup";

const FESTIVAL_FALLBACK_IMAGE = "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='220' viewBox='0 0 320 220'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' y1='0' x2='1' y2='1'%3E%3Cstop offset='0%25' stop-color='%23141b34'/%3E%3Cstop offset='100%25' stop-color='%23273257'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='320' height='220' fill='url(%23g)'/%3E%3Ctext x='160' y='102' fill='%23ffffff' font-size='22' text-anchor='middle' font-family='Arial,sans-serif'%3EFestival Image%3C/text%3E%3Ctext x='160' y='132' fill='%23cfd8ff' font-size='14' text-anchor='middle' font-family='Arial,sans-serif'%3ENot available%3C/text%3E%3C/svg%3E";

const getVirtualRowHeight = () => {
  if (typeof window === "undefined") return 300;
  if (window.innerWidth >= 1024) return 304;
  if (window.innerWidth >= 768) return 284;
  if (window.innerWidth >= 640) return 254;
  return 214;
};

const getLinkedCategory = (festival) => String(festival?.linkedCategory || "").trim();

const normalizeCategoryName = (cat) => {
  if (typeof cat === "string") return cat.trim();
  if (cat && typeof cat === "object") return String(cat.name || "").trim();
  return "";
};

const uniqueCategoryNames = (list = []) => {
  const seen = new Set();
  const out = [];
  for (const item of list) {
    const name = normalizeCategoryName(item);
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
};

const normalizeFestivalImageUrl = (value) => {
  if (!value) return "";
  const raw = String(value).trim();
  if (!raw) return "";
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  return `${BASE_URL}${raw.startsWith("/") ? "" : "/"}${raw}`;
};

const getFirstFestivalImageUrl = (festival) => {
  if (!festival?.images?.length) return "";
  const first = festival.images[0];
  if (typeof first === "string") return normalizeFestivalImageUrl(first);
  if (first && typeof first === "object") return normalizeFestivalImageUrl(first.url || first.secure_url);
  return "";
};

const mergeFestivalsPreferImage = (list = []) => {
  const map = new Map();
  for (const fest of list) {
    const name = String(fest?.festivalName || "").trim().toLowerCase();
    const day = fest?.festivalDate ? new Date(fest.festivalDate).toISOString().slice(0, 10) : "";
    const key = `${name}|${day}`;
    if (!name || !day) continue;
    const current = map.get(key);
    const festHasImage = Boolean(getFirstFestivalImageUrl(fest));
    const currentHasImage = Boolean(getFirstFestivalImageUrl(current));
    if (!current || (!currentHasImage && festHasImage)) {
      map.set(key, fest);
    }
  }
  return Array.from(map.values());
};

const getUpcomingFestivalNameSet = (festivalList = []) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const names = new Set();
  for (const fest of festivalList) {
    const name = String(fest?.festivalName || "").trim().toLowerCase();
    const rawDate = fest?.festivalDate;
    if (!name || !rawDate) continue;
    const date = new Date(rawDate);
    date.setHours(0, 0, 0, 0);
    if (date >= start && date <= end) names.add(name);
  }
  return names;
};

const filterFestivalCategoriesByUpcoming = (categoryNames = [], upcomingFestivalNames = null) => {
  const unique = uniqueCategoryNames(categoryNames);
  if (upcomingFestivalNames === null) return unique;
  return unique.filter((name) =>
    upcomingFestivalNames.has(String(name).trim().toLowerCase())
  );
};

const areNameListsEqual = (a = [], b = []) => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (String(a[i]).trim().toLowerCase() !== String(b[i]).trim().toLowerCase()) return false;
  }
  return true;
};

const getNonUpcomingFestivalCategories = (allFestival = [], upcomingFestival = []) =>
  uniqueCategoryNames(allFestival).filter(
    (name) => !upcomingFestival.some((f) => f.toLowerCase() === name.toLowerCase())
  );

const buildMainCategoryOrder = ({
  allFestival = [],
  upcomingFestival = [],
  primary = [],
  custom = [],
}) => {
  const nonUpcomingFestival = getNonUpcomingFestivalCategories(allFestival, upcomingFestival);
  return uniqueCategoryNames([...upcomingFestival, ...primary, ...nonUpcomingFestival, ...custom]);
};

const getCache = () => {
  try {
    const c = sessionStorage.getItem("homeCategoriesCache");
    return c ? JSON.parse(c) : null;
  } catch (e) { return null; }
};

const Home = () => {
  const cache = useMemo(() => getCache(), []);
  const mergedCache = useMemo(() => {
    if (cache) {
      return buildMainCategoryOrder({
        allFestival: cache.allFestivalCategories || cache.festivalCategories || [],
        upcomingFestival: cache.festivalCategories || [],
        primary: cache.primaryCategories || [],
        custom: cache.otherCategories || []
      });
    }
    return [];
  }, [cache]);

  const [festivals, setFestivals] = useState([]);
  const [categories, setCategories] = useState(mergedCache);
  const [festivalCategories, setFestivalCategories] = useState(cache?.festivalCategories || []);
  const [allFestivalCategories, setAllFestivalCategories] = useState(cache?.allFestivalCategories || cache?.festivalCategories || []);
  const [primaryCategories, setPrimaryCategories] = useState(cache?.primaryCategories || []);
  const [otherCategories, setOtherCategories] = useState(cache?.otherCategories || []);
  const [filteredCategories, setFilteredCategories] = useState(mergedCache);

  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);

  const [initialLoading, setInitialLoading] = useState(!cache);

  const [showCalendar, setShowCalendar] = useState(false);

  const [showHeaderSearch, setShowHeaderSearch] = useState(false);
  const [userProfileType, setUserProfileType] = useState(null);
  const [slidesReloadKey, setSlidesReloadKey] = useState(0);

  const [currentPage, setCurrentPage] = useState(() => {
    const savedPage = sessionStorage.getItem("homeCurrentPage");
    return savedPage ? Number(savedPage) : 1;
  });
  const [pageChanging, setPageChanging] = useState(false);
  const categoriesPerPage = 10;
  const displayedCategories = useMemo(() => {
    return filteredCategories.slice((currentPage - 1) * categoriesPerPage, currentPage * categoriesPerPage);
  }, [filteredCategories, currentPage]);
  const totalPages = useMemo(() => {
    return Math.ceil(filteredCategories.length / categoriesPerPage);
  }, [filteredCategories]);

  useEffect(() => {
    setCurrentPage(1);
    sessionStorage.setItem("homeCurrentPage", "1");
  }, [searchQuery]);

  const handlePageChange = (pageNumber) => {
    setPageChanging(true);
    setCurrentPage(pageNumber);
    sessionStorage.setItem("homeCurrentPage", String(pageNumber));
    sessionStorage.setItem("homeScrollY", "0");
    window.scrollTo(0, 0);
    setTimeout(() => {
      setPageChanging(false);
    }, 500);
  };

  // Mappings
  const [festivalLinkedCategoryMap, setFestivalLinkedCategoryMap] = useState(cache?.festivalLinkedCategoryMap || {});
  const [festivalEventIdMap, setFestivalEventIdMap] = useState(cache?.festivalEventIdMap || {});
  const [upcomingFestivalNames, setUpcomingFestivalNames] = useState(null);
  const [festivalCategoryNames, setFestivalCategoryNames] = useState([]);

  const navigate = useNavigate();
  const location = useLocation();
  const [showReviewPopup, setShowReviewPopup] = useState(
    () => location.state?.showReviewPopup === true
  );
  const searchTimeoutRef = useRef(null);
  const suggestionsRef = useRef(null);
  const scrollTickingRef = useRef(false);
  const isRestoringScroll = useRef(true);

  const [isRestoringUI, setIsRestoringUI] = useState(() => !!sessionStorage.getItem("homeScrollY"));
  const hasFetchedRef = useRef(false);

  React.useLayoutEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    const savedY = Number(sessionStorage.getItem("homeScrollY"));
    if (savedY > 0) {
      window.scrollTo(0, savedY);
    } else {
      window.scrollTo(0, 0);
    }
  }, []);

  useEffect(() => {
    if (initialLoading) return;
    const savedY = Number(sessionStorage.getItem("homeScrollY"));
    if (savedY > 0) {
      let attempts = 0;
      const interval = setInterval(() => {
        window.scrollTo(0, savedY);
        attempts++;
        if (window.scrollY >= savedY - 10 || attempts >= 15) {
          clearInterval(interval);
          isRestoringScroll.current = false;
          setIsRestoringUI(false);
        }
      }, 50);
      return () => clearInterval(interval);
    } else {
      isRestoringScroll.current = false;
      setIsRestoringUI(false);
    }
  }, [initialLoading]);

  // Fetch Data — runs only once, skips if cache already loaded
  useEffect(() => {
    if (hasFetchedRef.current) return;
    if (cache) {
      // Cache exists (back navigation) — just fetch festivals in background, no blocking loader
      hasFetchedRef.current = true;
      let mounted = true;
      (async () => {
        try {
          const r = await axios.get(`${BASE_URL}/api/festivals/combined`);
          const allFests = Array.isArray(r.data) ? r.data : [];
          const finalFests = mergeFestivalsPreferImage(allFests);
          const upcomingNames = getUpcomingFestivalNameSet(finalFests);
          if (mounted) {
            setFestivals(finalFests);
            setUpcomingFestivalNames(upcomingNames);
          }
        } catch (err) {
          console.error('Failed to load festivals', err);
        }
      })();
      return () => { mounted = false; };
    }

    hasFetchedRef.current = true;
    let mounted = true;

    (async () => {
      setInitialLoading(true);
      try {
        // Single parallel fetch for everything
        let userType = null;
        try {
          const profileRes = await axios.get(`${BASE_URL}/api/profiles/me`, { withCredentials: true });
          const profile = profileRes.data?.profile || profileRes.data;
          if (profile) {
            userType = String(profile.profiletype || profile.profileType || "").toLowerCase();
            if (mounted) setUserProfileType(userType);
          }
        } catch (e) { }

        // One call to categories, one to festivals — no duplicate
        const [categoriesRes, festivalsRes] = await Promise.all([
          axios.get(`${BASE_URL}/api/categories/public`),
          axios.get(`${BASE_URL}/api/festivals/combined`),
        ]);

        if (!mounted) return;

        // Process festivals
        const allFests = Array.isArray(festivalsRes.data) ? festivalsRes.data : [];
        const finalFests = mergeFestivalsPreferImage(allFests);
        const upcomingNames = getUpcomingFestivalNameSet(finalFests);
        const festivalNames = allFests.map(f => String(f.festivalName || "").toLowerCase().trim()).filter(Boolean);
        setFestivals(finalFests);
        setUpcomingFestivalNames(upcomingNames);
        setFestivalCategoryNames(festivalNames);

        // Process categories
        const categoriesData = Array.isArray(categoriesRes.data) ? categoriesRes.data : [];
        const filteredCategoriesData = categoriesData.filter(cat => {
          if (!cat.profileTypes || cat.profileTypes.length === 0) return true;
          if (!userType) return true;
          return cat.profileTypes.includes(userType);
        });

        const festivalCatsRaw = uniqueCategoryNames(filteredCategoriesData.filter(cat => cat.type === 'festival').map(cat => cat.name));
        const linkedMap = filteredCategoriesData.filter(cat => cat.type === "festival").reduce((acc, cat) => {
          const eventName = String(cat?.name || "").trim().toLowerCase();
          const linked = String(cat?.linkedCategory || cat?.name || "").trim();
          if (eventName && linked) acc[eventName] = linked;
          return acc;
        }, {});
        const eventIdMap = filteredCategoriesData.filter(cat => cat.type === "festival").reduce((acc, cat) => {
          const eventName = String(cat?.name || "").trim().toLowerCase();
          if (eventName && cat?._id) acc[eventName] = cat._id;
          return acc;
        }, {});
        const upcomingFestivalCats = filterFestivalCategoriesByUpcoming(festivalCatsRaw, upcomingNames);
        const primaryCats = uniqueCategoryNames(filteredCategoriesData.filter(cat => cat.type === 'primary' || cat.isPrimary).map(cat => cat.name));
        const otherCats = uniqueCategoryNames(filteredCategoriesData.filter(cat => cat.type !== 'festival' && cat.type !== 'primary' && !cat.isPrimary).map(cat => cat.name));
        const merged = buildMainCategoryOrder({
          allFestival: festivalCatsRaw,
          upcomingFestival: upcomingFestivalCats,
          primary: primaryCats,
          custom: otherCats,
        });

        if (mounted) {
          setFestivalCategories(upcomingFestivalCats);
          setAllFestivalCategories(festivalCatsRaw);
          setPrimaryCategories(primaryCats);
          setOtherCategories(otherCats);
          setFestivalLinkedCategoryMap(linkedMap);
          setFestivalEventIdMap(eventIdMap);
          setCategories(merged);
          setFilteredCategories(merged);
        }

        sessionStorage.setItem("homeCategoriesCache", JSON.stringify({
          festivalCategories: upcomingFestivalCats,
          allFestivalCategories: festivalCatsRaw,
          festivalLinkedCategoryMap: linkedMap,
          festivalEventIdMap: eventIdMap,
          primaryCategories: primaryCats,
          otherCategories: otherCats,
        }));
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        if (mounted) setInitialLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const syncSearchQuery = (event) => {
      setSearchQuery(String(event.detail || "").trim());
    };

    window.addEventListener("imagica-category-search", syncSearchQuery);
    return () => window.removeEventListener("imagica-category-search", syncSearchQuery);
  }, []);

  // Search Debounce
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (searchQuery.trim() === "") {
      setFilteredCategories(
        buildMainCategoryOrder({
          allFestival: allFestivalCategories,
          upcomingFestival: festivalCategories,
          primary: primaryCategories,
          custom: otherCategories,
        })
      );
      setSuggestions([]);
      setShowSuggestions(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(() => {
      const query = searchQuery.toLowerCase();
      const allCats = [...allFestivalCategories, ...primaryCategories, ...otherCategories];

      const startsWithMatches = allCats.filter(cat => cat.toLowerCase().startsWith(query));
      const includesMatches = allCats.filter(cat =>
        cat.toLowerCase().includes(query) && !cat.toLowerCase().startsWith(query)
      );

      const matches = uniqueCategoryNames([...startsWithMatches, ...includesMatches]);
      setFilteredCategories(matches);
      setSuggestions(matches.slice(0, 5));
      setShowSuggestions(matches.length > 0);
      setIsSearching(false);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, festivalCategories, allFestivalCategories, primaryCategories, otherCategories]);

  // Update categories when festivals change (only when no cache — fresh load)
  useEffect(() => {
    if (upcomingFestivalNames === null || cache) return;
    const upcomingFest = filterFestivalCategoriesByUpcoming(allFestivalCategories, upcomingFestivalNames);
    if (!areNameListsEqual(upcomingFest, festivalCategories)) {
      setFestivalCategories(upcomingFest);
    }
    const mergedAll = buildMainCategoryOrder({
      allFestival: allFestivalCategories,
      upcomingFestival: upcomingFest,
      primary: primaryCategories,
      custom: otherCategories,
    });
    setCategories(mergedAll);
    if (searchQuery.trim() === "") {
      setFilteredCategories(mergedAll);
    }
  }, [upcomingFestivalNames]);

  // Real-time socket updates
  useEffect(() => {
    const handleCategoryUpdate = async () => {
      try {
        sessionStorage.removeItem('homeCategoriesCache');
        const categoriesRes = await axios.get(`${BASE_URL}/api/categories/public`);
        const categoriesData = Array.isArray(categoriesRes.data) ? categoriesRes.data : [];

        const filteredCategoriesData = categoriesData.filter(cat => {
          if (!cat.profileTypes || cat.profileTypes.length === 0) return true;
          if (!userProfileType) return true;
          return cat.profileTypes.includes(userProfileType);
        });

        const festivalCatsRaw = uniqueCategoryNames(filteredCategoriesData.filter(c => c.type === 'festival').map(c => c.name));
        const linkedMap = filteredCategoriesData.filter(c => c.type === 'festival').reduce((acc, c) => {
          const k = String(c?.name || '').trim().toLowerCase();
          if (k) acc[k] = String(c?.linkedCategory || c?.name || '').trim();
          return acc;
        }, {});
        const eventIdMap = filteredCategoriesData.filter(c => c.type === 'festival').reduce((acc, c) => {
          const k = String(c?.name || '').trim().toLowerCase();
          if (k && c?._id) acc[k] = c._id;
          return acc;
        }, {});
        const primaryCats = uniqueCategoryNames(filteredCategoriesData.filter(c => c.type === 'primary' || c.isPrimary).map(c => c.name));
        const otherCats = uniqueCategoryNames(filteredCategoriesData.filter(c => c.type !== 'festival' && c.type !== 'primary' && !c.isPrimary).map(c => c.name));
        const upcomingFest = filterFestivalCategoriesByUpcoming(festivalCatsRaw, upcomingFestivalNames);
        const merged = buildMainCategoryOrder({ allFestival: festivalCatsRaw, upcomingFestival: upcomingFest, primary: primaryCats, custom: otherCats });

        setFestivalCategories(upcomingFest);
        setAllFestivalCategories(festivalCatsRaw);
        setPrimaryCategories(primaryCats);
        setOtherCategories(otherCats);
        setFestivalLinkedCategoryMap(linkedMap);
        setFestivalEventIdMap(eventIdMap);
        setCategories(merged);
        setFilteredCategories(merged);
      } catch (err) { console.error('socket categoryUpdated refresh error', err); }
    };

    const handleFestivalUpdate = async () => {
      try {
        const r = await axios.get(`${BASE_URL}/api/festivals/combined`);
        const allFests = Array.isArray(r.data) ? r.data : [];
        const merged = mergeFestivalsPreferImage(allFests);
        const upcomingNames = getUpcomingFestivalNameSet(merged);
        setFestivals(merged);
        setUpcomingFestivalNames(upcomingNames);
      } catch (err) { console.error('socket festivalUpdated refresh error', err); }
    };

    const handleHomeSlideUpdate = () => {
      setSlidesReloadKey(prev => prev + 1);
    };

    socket.on('categoryUpdated', handleCategoryUpdate);
    socket.on('festivalUpdated', handleFestivalUpdate);
    socket.on('homeSlideUpdated', handleHomeSlideUpdate);

    return () => {
      socket.off('categoryUpdated', handleCategoryUpdate);
      socket.off('festivalUpdated', handleFestivalUpdate);
      socket.off('homeSlideUpdated', handleHomeSlideUpdate);
    };
  }, [upcomingFestivalNames, userProfileType]);

  useEffect(() => {
    const handleScroll = () => {
      const heroBottom = 400; // approximate hero height
      const scrollPosition = window.scrollY + 100;
      setShowHeaderSearch(scrollPosition > heroBottom);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const clearSearch = () => {
    setSearchQuery("");
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
  };

  const handleSearchKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => prev < suggestions.length - 1 ? prev + 1 : prev);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
      e.preventDefault();
      handleSuggestionClick(suggestions[selectedSuggestionIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const onScroll = () => {
      if (!isMounted || isRestoringScroll.current) return;
      if (scrollTickingRef.current) return;
      scrollTickingRef.current = true;
      window.requestAnimationFrame(() => {
        if (isMounted) {
          sessionStorage.setItem("homeScrollY", String(window.scrollY || 0));
        }
        scrollTickingRef.current = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      isMounted = false;
      window.removeEventListener("scroll", onScroll);
    };
  }, []);


  if (initialLoading || pageChanging) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-[#F10D64] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading amazing templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-slate-50 relative overflow-hidden pb-20 transition-opacity duration-200 ease-in-out"
      style={{ opacity: isRestoringUI ? 0 : 1 }}
    >
      <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} showHeaderSearch={showHeaderSearch} />

      <div className="max-w-7xl mx-auto px-4 pt-28">
        <h1
          className="text-5xl md:text-6xl pb-2 font-bold text-center bg-gradient-to-r from-[#F10D64] via-[#F54A4A] to-[#F57030] bg-clip-text text-transparent tracking-tighter mb-12"
        >
          Discover Amazing Templates
        </h1>

        <WeekCalendar festivals={festivals} onFullCalendarClick={() => setShowCalendar(true)} />

        <ThisWeekEvents
          key={slidesReloadKey}
          festivals={festivals}
          onEventClick={(festival) => {
            const category = festival.linkedCategory || festival.festivalName;
            if (category) {
              navigate(`/category/${encodeURIComponent(category)}`);
            }
          }}
        />

        {/* ==================== SLIDERS SECTION ==================== */}
        <div className="mt-8">
          {displayedCategories.length > 0 ? (
            <WindowScroller>
              {({ height, isScrolling, onChildScroll, scrollTop }) => (
                <AutoSizer disableHeight>
                  {({ width }) => (
                    <List
                      autoHeight
                      height={height}
                      isScrolling={isScrolling}
                      onScroll={onChildScroll}
                      rowCount={displayedCategories.length}
                      rowHeight={getVirtualRowHeight()}
                      style={{ overflow: 'visible' }}
                      containerStyle={{ overflow: 'visible' }}
                      rowRenderer={({ index, key, style }) => {
                        const category = displayedCategories[index];
                        return (
                          <div key={key} style={{ ...style, paddingBottom: '40px' }}>
                            <Sliders
                              category={category}
                              queryCategory={festivalLinkedCategoryMap[String(category).toLowerCase()] || category}
                              calendarEventId={festivalEventIdMap[String(category).toLowerCase()]}
                              title={category.toUpperCase()}
                              festivals={festivals}
                              isScrolling={isScrolling}
                            />
                          </div>
                        );
                      }}
                      scrollTop={scrollTop}
                      width={width}
                      overscanRowCount={5}
                      overscanIndicesGetter={({ cellCount, overscanCellsCount, startIndex, stopIndex }) => ({
                        overscanStartIndex: Math.max(0, startIndex - overscanCellsCount),
                        overscanStopIndex: Math.min(cellCount - 1, stopIndex + overscanCellsCount),
                      })}
                    />
                  )}
                </AutoSizer>
              )}
            </WindowScroller>
          ) : (
            <div className="text-center py-20">
              <p className="text-xl text-slate-500">
                {searchQuery ? `No categories found for "${searchQuery}"` : "No categories found from API"}
              </p>
              <p className="text-sm text-slate-400 mt-2">
                {searchQuery ? "Try a different category keyword" : "Check API response or console"}
              </p>
            </div>
          )}
        </div>

        {/* ==================== PAGINATION SECTION ==================== */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-3 mt-12 mb-16 select-none">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-4 py-2 text-sm font-semibold transition-all duration-200 inline-flex items-center gap-2 transform active:scale-95 ${currentPage === 1
                  ? "text-slate-300 cursor-not-allowed opacity-50"
                  : "text-slate-900 hover:text-slate-600 cursor-pointer"
                }`}
            >
              <FaChevronLeft className="text-xs" />
              <span>Previous</span>
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => handlePageChange(p)}
                className={`w-12 h-12 rounded-2xl text-base font-bold transition-all duration-300 transform active:scale-95 flex items-center justify-center cursor-pointer ${currentPage === p
                    ? "bg-transparent bg-gradient-to-r from-[#F10D64] to-[#F10D64] bg-clip-text text-transparent border-none shadow-none scale-110 font-bold text-[#F10D64]"
                    : "bg-transparent text-slate-900 border-none shadow-none hover:text-[#F10D64] hover:scale-105"
                  }`}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 text-sm font-semibold transition-all duration-200 inline-flex items-center gap-2 transform active:scale-95 ${currentPage === totalPages
                  ? "text-slate-300 cursor-not-allowed opacity-50"
                  : "text-slate-900 hover:text-slate-600 cursor-pointer"
                }`}
            >
              <span>Next</span>
              <FaChevronRight className="text-xs" />
            </button>
          </div>
        )}

      </div>

      {showCalendar && <Calendar onClose={() => setShowCalendar(false)} />}

      {showReviewPopup && <ReviewPopup onClose={() => setShowReviewPopup(false)} />}

      <BottomNavbar isAuthenticated={true} />
    </div>
  );
};

export default Home;
