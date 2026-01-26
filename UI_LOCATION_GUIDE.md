# 🗺️ UI LOCATION GUIDE - Reactivation & Activation History

## Where to Find These Features in the UI

### **Main Location: Profile Page**
- Navigate to: **Dashboard → Profile** (click user icon/avatar in top right)
- All features are on this single page, in order from top to bottom

---

## 1️⃣ REACTIVATION BUTTON

### Location on Profile Page:
**Section:** "Account Status Card" (appears after earnings cards)

### Visual Indicators:

#### **Scenario A: User Needs Reactivation (2/2 Commissions)**
```
┌─────────────────────────────────────────────────────────┐
│ 🔄  Ready to Reactivate!                     [Button]  │ ← PURPLE CARD
│                                                         │
│ You've completed your commission cycle (2/2).          │
│ Reactivate to reset your commission counter            │
│ and start earning again!                               │
│                                                         │
│                                   [🔄 Reactivate Now]  │ ← CLICK HERE
└─────────────────────────────────────────────────────────┘
```
**Card Color:** Purple gradient (from-purple-500 to-indigo-600)
**Button Text:** "🔄 Reactivate Now"
**Button Color:** White with purple text

---

#### **Scenario B: First Time Activation (0/2 Commissions)**
```
┌─────────────────────────────────────────────────────────┐
│ 🕐  Account Inactive                         [Button]  │ ← ORANGE CARD
│                                                         │
│ Activate your account to start earning                 │
│ commissions from your team.                            │
│                                                         │
│                                      [Activate Now]    │ ← CLICK HERE
└─────────────────────────────────────────────────────────┘
```
**Card Color:** Orange gradient (from-orange-500 to-amber-600)
**Button Text:** "Activate Now" (no icon)
**Button Color:** White with orange text

---

#### **Scenario C: Active User (0/2 or 1/2 Commissions)**
```
┌─────────────────────────────────────────────────────────┐
│ 🏆  Your Account is Active!                            │ ← GREEN CARD
│                                                         │
│ You have received 1/2 commissions.                     │
│ Keep growing your team!                                │
│                                                         │
│ [No Button - Already Active]                           │
└─────────────────────────────────────────────────────────┘
```
**Card Color:** Green gradient (from-green-500 to-emerald-600)
**Button:** No button shown (user is already active)

---

## 2️⃣ ACTIVATION HISTORY SECTION

### Location on Profile Page:
**Section:** "Activation History" (appears AFTER the Account Status Card)

### Visual Layout:
```
┌─────────────────────────────────────────────────────────┐
│ 📊 Activation History                                   │
│ View your complete activation timeline and statistics  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────┬──────────┬──────────┬──────────┐       │
│  │  TOTAL   │ LIFETIME │ CURRENT  │  STATUS  │       │
│  │  ACTIV.  │ EARNINGS │ POSITION │          │       │
│  │    2     │  ₹20,000 │    #42   │  Active  │       │
│  └──────────┴──────────┴──────────┴──────────┘       │
│                                                         │
│  Timeline:                                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  ● Current Activation           (Pulsing Green Dot)   │
│  ├─ Package: Gold Package                              │
│  ├─ Amount: ₹10,000                                    │
│  ├─ Activated: Jan 26, 2026                            │
│  └─ Days Active: 15 days                               │
│                                                         │
│  ○ Previous Activation #1       (Gray Dot)             │
│  ├─ Package: Silver Package                            │
│  ├─ Amount: ₹5,000                                     │
│  ├─ Activated: Jan 10, 2026                            │
│  ├─ Deactivated: Jan 25, 2026                          │
│  └─ Days Active: 5 days                                │
└─────────────────────────────────────────────────────────┘
```

### What You'll See:

#### **Summary Cards (4 Cards at Top)**
1. **Total Activations** - How many times you've activated
2. **Lifetime Earnings** - Total commissions earned across all activations
3. **Current Position** - Your position in the MLM chain
4. **Status** - Current activation status (Active/Inactive)

#### **Timeline (Below Summary Cards)**
- **Green pulsing dot** = Current/Active activation
- **Gray dots** = Previous/Deactivated activations
- Each entry shows:
  - Package name (e.g., "Gold Package")
  - Amount paid (e.g., ₹10,000)
  - Activation date
  - Deactivation date (for old activations)
  - Total days active

---

## 🎬 STEP-BY-STEP: How to Reactivate

### Prerequisites:
- User must have **2/2 commissions** (completed commission cycle)
- User must be **deactivated** (is_mlm_active = false)

### Steps:
1. **Login** to your account
2. **Navigate to Profile** (click your avatar in top right)
3. **Scroll to Account Status Card** (purple card)
4. You'll see:
   - Title: "Ready to Reactivate!"
   - Message: "You've completed your commission cycle (2/2)"
   - Button: "🔄 Reactivate Now" (purple button)
5. **Click "🔄 Reactivate Now"**
6. **Modal Opens:** "Reactivate Your Account"
7. **See Reactivation Benefits Card:**
   ```
   ✨ Reactivation Benefits
   ✓ Commission counter resets from 2/2 to 0/2
   ✓ Rejoin the chain at a new position
   ✓ Start earning commissions again immediately
   ✓ Your original sponsor is preserved
   ✓ Complete activation history saved
   ```
8. **Select Package** (Gold, Silver, or Bronze)
9. **Click Purple Button:** "🔄 Reactivate Now (₹10,000)"
10. **Success!** Your account is reactivated:
    - Commission count: 0/2 (reset)
    - New position in chain
    - Can earn 2 more commissions
    - Old activation saved to history

---

## 🎬 STEP-BY-STEP: How to View Activation History

### Steps:
1. **Login** to your account
2. **Navigate to Profile** (click your avatar in top right)
3. **Scroll down** past:
   - User info card
   - Earnings cards
   - Recent commissions (if any)
   - Account status card
4. **Find "Activation History" section** with 📊 icon
5. **View Summary Cards:**
   - Total Activations: 2
   - Lifetime Earnings: ₹20,000
   - Current Position: #42
   - Status: Active ✓
6. **View Timeline Below:**
   - **Green pulsing dot** = Your current activation
   - **Gray dots** = Your previous activations
   - Each shows package, dates, and performance

---

## 🔍 Visual Cues to Look For

### Reactivation State Indicators:

| State | Card Color | Icon | Button Text | Commission Count |
|-------|-----------|------|-------------|------------------|
| **Active** | 🟢 Green | 🏆 Award | No button | 0/2 or 1/2 |
| **Reactivation Needed** | 🟣 Purple | 🔄 RefreshCw | "🔄 Reactivate Now" | 2/2 |
| **Inactive (First Time)** | 🟠 Orange | 🕐 Clock | "Activate Now" | 0/2, never activated |
| **Inactive (Returning)** | 🟠 Orange | 🕐 Clock | "Activate Now" | Has history |

---

## 📱 Responsive Design

### Desktop (> 1024px):
- Full layout with all cards side-by-side
- Timeline shows 3 entries per row
- Modal centered with max-width

### Tablet (640px - 1024px):
- Cards in 2-column grid
- Timeline shows 2 entries per row
- Modal takes 80% width

### Mobile (< 640px):
- All cards stack vertically
- Timeline shows 1 entry per row
- Modal takes full width with padding
- Button text may wrap

---

## 🎨 Color Coding System

```css
Active User:        🟢 Green (#10B981 → #059669)
Reactivation Ready: 🟣 Purple (#8B5CF6 → #6366F1)
Inactive User:      🟠 Orange (#F59E0B → #D97706)
Error:              🔴 Red (#EF4444)
Success:            🟢 Emerald (#10B981)
```

---

## 🧪 Testing Different States

### To Test Reactivation UI:
You need a user with:
- `is_mlm_active = false`
- `commission_received_count = 2`
- Exists in `mlm_chain` table

### To Test First-Time Activation UI:
You need a user with:
- `is_mlm_active = false`
- `commission_received_count = 0`
- `activation_date IS NULL`
- No entry in `mlm_chain` table

### To Test Active User UI:
You need a user with:
- `is_mlm_active = true`
- `commission_received_count < 2` (0 or 1)
- Active entry in `mlm_chain` table

---

## 📊 What Data is Displayed

### In Account Status Card:
- Current activation status
- Commission progress (X/2)
- Contextual message based on state
- Action button (if inactive)

### In Activation History:
- **Summary Statistics:**
  - Total number of activations
  - Sum of all commissions earned
  - Current position in chain
  - Current active status

- **Timeline Data:**
  - Each activation's package details
  - Activation and deactivation dates
  - Days active for each period
  - Commission count for each activation
  - Visual distinction (current vs historical)

---

## 🎯 Page Layout Order

From top to bottom on Profile page:

1. **Header:** "My Profile" with gradient background
2. **User Info Card:** Avatar, username, email, role, commission count
3. **Earnings Cards (3 cards):** Total, Available, Pending
4. **Recent Commissions (if any):** Last 5 commissions received
5. **Account Status Card:** 🔄 REACTIVATION BUTTON IS HERE
6. **Activation History Section:** 📊 HISTORY TIMELINE IS HERE
7. **Logout Button:** At the very bottom

---

## ✅ Quick Reference

**Want to Reactivate?**
→ Profile Page → Purple Card → Click "🔄 Reactivate Now"

**Want to See History?**
→ Profile Page → Scroll Down → "📊 Activation History" Section

**Testing URL:**
→ http://localhost:3001/profile (when frontend is running)

---

*This guide reflects the implementation in Profile.tsx (lines 334-419)*
