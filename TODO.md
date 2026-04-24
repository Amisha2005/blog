# Speech-to-Text Fix TODO

## Issues Found in `frontend/app/interview/InterviewRoom.tsx`

1. **Speech recognition NOT stopped on pause** - `pauseInterviewForViolation()` stops detection loops but leaves speech recognition running. When `rec.onend` fires, auto-restart fails silently because `isPausedRef.current` is true, leaving state inconsistent.

2. **Speech recognition NOT restarted on resume** - `handleFixedIt()` resumes detection loops but never restarts speech recognition. User must click mic button twice to get it working.

3. **State inconsistency** - `isListeningRef.current` not updated in `rec.onend` and `rec.onerror` auto-restart branches.

## Steps

- [x] 1. Understand the codebase and identify issues
- [x] 2. Add `wasListeningBeforePauseRef` to track mic state before pause
- [x] 3. Fix `pauseInterviewForViolation()` to stop speech recognition properly
- [x] 4. Fix `handleFixedIt()` to restart speech recognition if it was active before pause
- [x] 5. Fix state sync in `rec.onend` and `rec.onerror`
- [x] 6. Build and verify

