# MLM Linear Chain System Documentation

## System Overview
This is a **Linear Chain MLM System** where users join sequentially in a straight line. Each new user pays commissions to the 2 active users directly above them in the chain.

## How It Works

### Sequential Joining
```
Position 1: User A (first user)
    ↓
Position 2: User B (joins below A)
    ↓
Position 3: User C (joins below B)
    ↓
... continues ...
```

### Commission Flow
When User C activates:
- User B (position 2) receives 15% commission
- User A (position 1) receives 15% commission
- Total: 30% distributed to the 2 users above

### Cycling Out
- After a user receives 2 commissions (30% total), they become **inactive**
- Inactive users are hidden from the active chain
- They can reactivate by purchasing again, which places them at the bottom

## Backend Implementation

### Correct Service (IN USE)
**File**: `backend/services/mlm_service.py`
- Implements linear chain logic
- Uses `mlm_chain` table for sequential positioning
- Distributes commissions to last 2 active users
- Auto-deactivates users after commission_limit (2)

### Routes (IN USE)
**File**: `backend/routes/mlm.py`
- Uses `MLMService` (linear chain)
- Endpoints:
  - `POST /api/mlm/activate` - Activate user
  - `GET /api/mlm/chain` - Get chain status
  - `GET /api/mlm/tree/<user_id>` - Get user tree info
  - `POST /api/mlm/purchase` - Process activation purchase

### Database Tables (IN USE)
1. **mlm_chain** - Sequential positions in the chain
   - `position` - Order in chain (1, 2, 3, ...)
   - `user_id` - Reference to user
   - `is_active` - Whether user can receive commissions

2. **commissions** - Commission records
   - Tracks who paid whom and how much

3. **purchases** - Activation/reactivation purchases

4. **mlm_settings** - Configuration
   - `activation_amount`: 1000 (amount to join)
   - `commission_rate`: 0.15 (15%)
   - `commission_limit`: 2 (deactivate after 2 commissions)

## Frontend Implementation

### Linear Chain Visualization
**File**: `frontend/src/pages/admin/UserTreeView.tsx`
- Shows users in vertical straight line
- Sorted by creation date (sequential order)
- Displays commission flow indicators
- Shows cycle completion status

### User Creation
**File**: `frontend/src/components/dashboard/Users/CreateUserForm.tsx`
- Shows new user's position number
- Displays which 2 users will receive commissions
- Real-time chain position calculation

## Files to IGNORE/REMOVE

### ❌ NOT USED - Binary Tree Files
These files were created by mistake and are **NOT being used**:

1. **`backend/services/mlm_binary_tree_service.py`**
   - Implements binary tree with left/right branches
   - Uses spillover placement algorithm
   - **NOT imported or used anywhere**
   - Can be safely deleted

2. **`backend/mlm_binary_tree_migration.py`**
   - Adds binary tree columns (left_child_id, right_child_id, etc.)
   - Migration was run but columns are not used
   - Some columns like `is_hidden`, `cycle_count` could be useful for cycle tracking

### Database Columns Added (But Not Used)
From binary tree migration:
- `left_child_id` - NOT NEEDED
- `right_child_id` - NOT NEEDED
- `tree_position` - NOT NEEDED
- `placement_sponsor_id` - NOT NEEDED
- `is_hidden` - Could be useful for tracking cycle completion
- `cycle_count` - Could be useful for tracking how many cycles
- `last_hidden_at` - Could be useful for reactivation tracking

## Current System Status

✅ **Working Correctly**
- Backend uses linear chain service
- Frontend displays linear chain correctly
- Commission distribution works sequentially
- Cycle out system functional

✅ **What's Active**
- `mlm_service.py` (linear chain)
- `routes/mlm.py` (using linear chain)
- `mlm_chain` table (sequential positions)
- Frontend visualization (vertical line)

❌ **What to Remove**
- `services/mlm_binary_tree_service.py` (unused)
- Optionally: binary tree migration columns (not critical)

## Testing the System

### Test Flow
1. Create User A → Position 1
2. Create User B → Position 2, A gets 15%
3. Create User C → Position 3, B gets 15%, A gets 15% (A now at 30%, cycles out)
4. Create User D → Position 4, C gets 15%, B gets 15% (B now at 30%, cycles out)
5. Create User E → Position 5, D gets 15%, C gets 15% (C now at 30%, cycles out)

### Expected Results
- Only active users in chain receive commissions
- After 2 commissions, user becomes inactive
- New users always join at the end
- Chain grows sequentially

## API Endpoints for Testing

```bash
# Activate a user
POST /api/mlm/activate
{
  "user_id": "uuid",
  "sponsored_by": "uuid" (optional)
}

# Get chain status (for visualization)
GET /api/mlm/chain

# Get user's MLM tree info
GET /api/mlm/tree/<user_id>
```

## Configuration

Edit settings in database (`mlm_settings` table):
```sql
UPDATE mlm_settings SET setting_value = '2000' WHERE setting_key = 'activation_amount';
UPDATE mlm_settings SET setting_value = '0.20' WHERE setting_key = 'commission_rate';
UPDATE mlm_settings SET setting_value = '3' WHERE setting_key = 'commission_limit';
```

## Summary

Your system is a **Linear Chain MLM** (not binary tree):
- Users join in a straight vertical line
- Commissions go to the 2 users above
- Cycle out after 2 commissions
- Reactivation puts user at bottom

The binary tree work was created by mistake and can be ignored/removed.
