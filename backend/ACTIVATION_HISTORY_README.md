# Activation History Migration - JSONB Implementation

## Overview

This migration converts the multi-row MLM chain system to a JSONB-based activation history system. This provides:

- **Single row per user** in `mlm_chain` (no database bloat)
- **Complete history** stored in JSONB format
- **Preserved sponsor relationships** (original sponsor never overwritten)
- **Fast queries** with GIN indexes
- **Analytics-ready** data structure

---

## What Changed

### Database Schema

**Before:**
```
mlm_chain table:
- Multiple rows per user (one per activation/reactivation)
- Database bloat over time
- Hard to query history

users table:
- sponsored_by gets overwritten on reactivation ❌
```

**After:**
```
mlm_chain table:
- ONE row per user (active users only)
- Clean, performant

users table:
- activation_history JSONB column ✅
- Complete history preserved
- sponsored_by never overwritten ✅
- GIN indexes for fast queries
```

---

## JSONB Structure

```json
{
  "activations": [
    {
      "id": 1,
      "position_in_chain": 42,
      "package": {
        "id": "pkg-uuid",
        "name": "Silver Package",
        "amount": 5000
      },
      "timeline": {
        "activated_at": "2025-01-15T08:00:00Z",
        "deactivated_at": "2025-01-20T15:30:00Z",
        "days_active": 5
      },
      "performance": {
        "commissions_earned": 2,
        "purchase_type": "activation"
      },
      "sponsor_at_activation": "sponsor-uuid",
      "is_current": false
    }
  ],
  "statistics": {
    "total_activations": 2,
    "total_days_active": 10,
    "average_days_active": 5.0,
    "favorite_package": "Silver Package",
    "current_package": "Gold Package",
    "last_updated": "2025-01-26T10:30:00Z"
  }
}
```

---

## How to Run Migration

### Step 1: Backup Database

```bash
# Create backup before migration
pg_dump -U bigteam bigteam > backup_before_activation_history.sql
```

### Step 2: Run Migration Script

```bash
cd backend
source venv/bin/activate
python activation_history_migration.py
```

The script will:
1. Add `activation_history` JSONB column to `users` table
2. Migrate all existing `mlm_chain` data to JSONB format
3. Delete old deactivated entries from `mlm_chain`
4. Add GIN indexes for fast queries
5. Verify migration success

### Step 3: Restart Backend

```bash
# If backend is running, restart it
pkill -f "python app.py"
python app.py
```

---

## New API Endpoints

### User Endpoints

```bash
# Get my activation history
GET /api/activation-history/my-history

# Get specific user's history
GET /api/activation-history/user/{user_id}
```

### Admin Endpoints

```bash
# Get reactivation statistics
GET /api/activation-history/stats/reactivation

# Get package popularity
GET /api/activation-history/stats/packages

# Get activation timeline
GET /api/activation-history/timeline?days=30
```

---

## Frontend Components

### New Components Created

1. **`ActivationHistoryTimeline.tsx`**
   - Visual timeline of user activations
   - Summary cards (total activations, earnings, position, status)
   - Detailed history with dates and packages

### Usage in Frontend

```tsx
import ActivationHistoryTimeline from '@/components/user/ActivationHistoryTimeline';

// In your profile or dashboard page
<ActivationHistoryTimeline />
```

---

## Benefits

| Feature | Before | After |
|---------|--------|-------|
| **Rows per user** | 5+ for 5 reactivations | 1 row always |
| **Query speed** | Slower (JOINs, MAX) | Faster (single row) |
| **History tracking** | Limited | Complete |
| **Sponsor preservation** | Lost on reactivation | Always preserved |
| **Package history** | Hard to track | Easy |
| **Database size** | Grows linearly | Minimal growth |
| **Analytics** | Complex queries | Simple JSONB queries |

---

## Code Changes

### Modified Files

1. **`services/team_service.py`**
   - Updated `activate_user()` to save history to JSONB
   - Deactivation now saves activation data before marking inactive
   - Sponsor field preserved on reactivation

2. **`app.py`**
   - Added `activation_history_bp` blueprint

### New Files

1. **`activation_history_migration.py`** - Migration script
2. **`services/activation_history_service.py`** - JSONB query service
3. **`routes/activation_history.py`** - API endpoints
4. **`frontend/src/services/activationHistoryService.ts`** - Frontend API client
5. **`frontend/src/components/user/ActivationHistoryTimeline.tsx`** - UI component

---

## Testing

### Test Activation Flow

```bash
# 1. Activate a new user
POST /api/team/purchase
{
  "amount": 5000,
  "package_id": "pkg-uuid"
}

# 2. Check activation history
GET /api/activation-history/my-history

# Expected: Should see 1 activation record
```

### Test Reactivation Flow

```bash
# 1. User reaches 2/2 commissions (gets deactivated)
# 2. User reactivates
POST /api/team/purchase
{
  "amount": 5000,
  "package_id": "pkg-uuid"
}

# 3. Check history
GET /api/activation-history/my-history

# Expected:
# - activation_history array has old activation
# - sponsored_by is still original sponsor (not changed)
# - statistics show 2 total activations
```

---

## Rollback Plan

If migration fails:

```bash
# Restore from backup
psql -U bigteam bigteam < backup_before_activation_history.sql

# Revert code changes
git checkout HEAD~1 backend/services/team_service.py
git checkout HEAD~1 backend/app.py
```

---

## Performance

### Query Performance

```sql
-- Get user history (FAST with GIN index)
SELECT activation_history FROM users WHERE id = 'user-uuid';

-- Find users with 3+ activations (FAST)
SELECT username FROM users
WHERE jsonb_array_length(activation_history->'activations') >= 3;

-- Get total earnings from all activations (FAST)
SELECT SUM((elem->>'total_earned')::numeric)
FROM users, jsonb_array_elements(activation_history->'activations') elem
WHERE id = 'user-uuid';
```

### Index Performance

```sql
-- Check index usage
EXPLAIN ANALYZE
SELECT * FROM users
WHERE activation_history @> '{"statistics": {"total_activations": 5}}'::jsonb;

-- Should show: "Index Scan using idx_users_activation_history_gin"
```

---

## Monitoring

### Check Migration Status

```sql
-- Users with activation history
SELECT COUNT(*) FROM users
WHERE activation_history IS NOT NULL
AND jsonb_array_length(activation_history->'activations') > 0;

-- Total activations across platform
SELECT SUM(jsonb_array_length(activation_history->'activations'))
FROM users;

-- Verify no deactivated entries in mlm_chain
SELECT COUNT(*) FROM mlm_chain WHERE is_active = false;
-- Should be: 0
```

---

## Support

If you encounter issues:

1. Check logs: `tail -f backend/logs/app.log`
2. Verify database: `psql -U bigteam bigteam`
3. Test endpoints: Use Postman or curl
4. Contact: [Your contact info]

---

## Future Enhancements

- [ ] Add export history to CSV/PDF
- [ ] Add activation history charts
- [ ] Add email notifications on reactivation
- [ ] Add comparison with other users
- [ ] Add predictive analytics (days until next reactivation)
