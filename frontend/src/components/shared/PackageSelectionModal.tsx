import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import packageService, { Package as PackageType } from '../../services/packageService';
import teamService from '../../services/teamService';

// Safe user retrieval from localStorage
const getUserFromStorage = (): { id?: string } => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : {};
  } catch {
    return {};
  }
};

interface PackageSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userBalance: number;
}

const PackageSelectionModal: React.FC<PackageSelectionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  userBalance
}) => {
  const [packages, setPackages] = useState<PackageType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState<PackageType | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchPackages();
    }
  }, [isOpen]);

  const fetchPackages = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await packageService.getPackagesForUser();
      setPackages(data);
    } catch {
      setError('Failed to load packages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedPackage) return;

    const user = getUserFromStorage();
    if (!user.id) {
      setError('Session expired. Please login again.');
      return;
    }

    if (userBalance < selectedPackage.amount) {
      setError(`Insufficient balance. You need ₹${selectedPackage.amount.toLocaleString()} but have ₹${userBalance.toLocaleString()}`);
      return;
    }

    setPurchasing(true);
    setError(null);

    try {
      await teamService.createPurchase(
        user.id,
        selectedPackage.amount,
        undefined, // invitedBy
        selectedPackage.id // packageId
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Purchase failed. Please try again.';
      setError(errorMsg);
    } finally {
      setPurchasing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-dark-600">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-dark-900 dark:text-white">
                Select Package
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Choose a package to activate your account
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh]">
            {/* Balance Info */}
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                Your Balance: <span className="font-bold">₹{userBalance.toLocaleString()}</span>
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-accent-bitcoin animate-spin mb-3" />
                <p className="text-gray-500 dark:text-gray-400">Loading packages...</p>
              </div>
            )}

            {/* Packages List */}
            {!loading && packages.length > 0 && (
              <div className="space-y-3">
                {packages.map((pkg) => {
                  const isSelected = selectedPackage?.id === pkg.id;
                  const canAfford = userBalance >= pkg.amount;

                  return (
                    <button
                      key={pkg.id}
                      onClick={() => setSelectedPackage(pkg)}
                      disabled={!canAfford}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                        isSelected
                          ? 'border-accent-bitcoin bg-orange-50 dark:bg-orange-900/20'
                          : canAfford
                          ? 'border-gray-200 dark:border-dark-600 hover:border-accent-bitcoin/50'
                          : 'border-gray-200 dark:border-dark-600 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            isSelected
                              ? 'bg-gradient-to-br from-accent-bitcoin to-accent-orange'
                              : 'bg-gray-100 dark:bg-dark-700'
                          }`}>
                            <Package className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-gray-500'}`} />
                          </div>
                          <div>
                            <h3 className={`font-semibold ${
                              isSelected ? 'text-accent-bitcoin' : 'text-dark-900 dark:text-white'
                            }`}>
                              {pkg.name}
                            </h3>
                            {pkg.description && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                {pkg.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-xs px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full">
                                {pkg.commission_percentage}% commission
                              </span>
                              {!canAfford && (
                                <span className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full">
                                  Insufficient balance
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${
                            isSelected ? 'text-accent-bitcoin' : 'text-dark-900 dark:text-white'
                          }`}>
                            ₹{pkg.amount.toLocaleString()}
                          </p>
                          {isSelected && (
                            <CheckCircle className="w-5 h-5 text-accent-bitcoin ml-auto mt-1" />
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Empty State */}
            {!loading && packages.length === 0 && !error && (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No packages available</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-dark-600 bg-gray-50 dark:bg-dark-700">
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-dark-500 rounded-xl text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-100 dark:hover:bg-dark-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePurchase}
                disabled={!selectedPackage || purchasing}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-accent-bitcoin to-accent-orange text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {purchasing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Activate Now
                    {selectedPackage && (
                      <span className="text-sm opacity-80">
                        (₹{selectedPackage.amount.toLocaleString()})
                      </span>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PackageSelectionModal;
