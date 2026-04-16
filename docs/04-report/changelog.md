# Changelog

All notable changes to AutotradeMobile project PDCA completions are documented here.

---

## [2026-03-24] - api-retry-prevention

### Added
- **Circuit Breaker** pattern in backEndApi.ts to prevent API cascading failures
  - 5 consecutive failures trigger 30-second cooldown
  - Authentication endpoints bypass circuit breaker to ensure token refresh reliability
  - Automatic recovery when requests succeed during cooldown

- **Focus-based polling control** in price.tsx for real-time stock data
  - Migrated from `useEffect` to `useFocusEffect` for proper lifecycle management
  - Automatic polling suspension after 3 consecutive failures
  - Polling resumes when user returns to the screen (failCount reset)

### Changed
- `app/(tabs)/stock/price.tsx`: useEffect (2) → useFocusEffect (1)
  - Removed background API calls when screen is not in focus
  - Added `failCountRef` state for tracking consecutive failures
  - Integrated scroll-to-center logic into unified useFocusEffect hook

- `contexts/backEndApi.ts`: Added circuit breaker variables and helper functions
  - Request interceptor: Checks cooldown status before allowing requests
  - Response interceptor: Resets counter on success, increments on network/5xx errors
  - Uses `axios.Cancel` to block requests during cooldown window

- `hooks/useRanking.ts`: Added try-finally blocks to all fetch functions
  - Ensures `setLoading(false)` executes even when API calls fail
  - Prevents UI stuck in loading state

### Fixed
- Eliminated repeated API calls from background useEffect when navigating away
- Fixed UI loading state hanging due to missing error handlers
- Prevented server overload during network outages via circuit breaker

### Technical Details
- Design Match Rate: 98% (27/28 requirements)
- Implementation: 3 files, ~60 LOC changed
- Breaking Changes: None (all API signatures unchanged)
- Test Coverage: 6 unit scenarios + 2 integration scenarios defined

---

## [2026-03-15] - marker-sync-fix

### Fixed
- Chart trade markers (buy/sell dots) now stay synchronized during all user interactions
  - Fixed vertical price-axis panning where markers remained fixed at initial Y-coordinate
  - Fixed pinch zoom interactions where marker positions didn't update
  - Implemented requestAnimationFrame-based sync for complete interaction coverage

### Changed
- `components/StockChart.tsx`: Migrated marker update from event-based to rAF-based polling
  - Replaced insufficient `subscribeCrosshairMove()` subscription with pointer/wheel event binding
  - Added interaction-triggered rAF loop for smooth, responsive marker positioning
  - Added 200ms debounce for interaction termination to handle momentum scrolling

### Technical Details
- Design Match Rate: 100% (10/10 requirements)
- Implementation Scope: Single file (StockChart.tsx), ~20 lines changed
- Performance Impact: Zero idle overhead (rAF only runs during interaction)
- Breaking Changes: None (backward compatible with existing marker data format)

---

## Future Entries
Completion reports for new features will be added here in reverse chronological order.