#!/bin/bash

# MediaUpload.tsx - remove File
sed -i 's/import { Film, Image, X, Upload, File } from/import { Film, Image, X, Upload } from/' src/components/dashboard/Content/MediaUpload.tsx

# DashboardLayout.tsx - remove TopBar import
sed -i '/^import TopBar/d' src/components/dashboard/Layout/DashboardLayout.tsx

# Sidebar.tsx - remove UserCheck
sed -i 's/UserCheck, //g' src/components/dashboard/Layout/Sidebar.tsx

# TopBar.tsx - remove Bell
sed -i 's/, Bell//g' src/components/dashboard/Layout/TopBar.tsx

# EditUserModal.tsx - remove loading
# sed command for this is complex, will do manually

# LoginPage.tsx - remove Users
sed -i 's/import { Home, LogIn, UserPlus, Users } from/import { Home, LogIn, UserPlus } from/' src/pages/LoginPage.tsx

# ContentManagement.tsx - remove AnimatePresence
sed -i 's/import { motion, AnimatePresence } from/import { motion } from/' src/pages/admin/ContentManagement.tsx

# CustomerOverview.tsx - remove X and Clock
sed -i 's/X, //g; s/, Clock//g' src/pages/admin/CustomerOverview.tsx

# UserTreeView.tsx - remove Crown and Shield
sed -i 's/Crown, //g; s/Shield, //g' src/pages/admin/UserTreeView.tsx

echo "Fixed unused imports"
