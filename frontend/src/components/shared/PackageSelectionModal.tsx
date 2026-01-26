import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, CheckCircle, Loader2, AlertCircle, RefreshCw, Sparkles, Award } from 'lucide-react';
import packageService, { Package as PackageType } from '../../services/packageService';
import teamService from '../../services/teamService';
import activationRequestService from '../../services/activationRequestService';

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
  isReactivation?: boolean;
  commissionCount?: number;
}

const PackageSelectionModal: React.FC<PackageSelectionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  userBalance,
  isReactivation = false,
  commissionCount = 0
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

    // For reactivation, skip balance check - admin will review the request
    if (!isReactivation && userBalance < selectedPackage.amount) {
      setError(`Insufficient balance. You need ₹${selectedPackage.amount.toLocaleString()} but have ₹${userBalance.toLocaleString()}`);
      return;
    }

    setPurchasing(true);
    setError(null);

    try {
      // If this is a reactivation, submit a request for admin approval (no balance check)
      if (isReactivation) {
        const response = await activationRequestService.submitRequest(selectedPackage.id);

        if (response.success) {
          // Success - request submitted
          alert(`✅ ${response.message}\n\nYour reactivation request has been submitted to the admin. You will be notified once it's reviewed.`);
          onSuccess();
          onClose();
        } else {
          // Failed - show error
          setError(response.message);
        }
      } else {
        // First-time activation - instant activation (no admin approval needed)
        await teamService.createPurchase(
          user.id,
          selectedPackage.amount,
          undefined, // invitedBy
          selectedPackage.id // packageId
        );
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Operation failed. Please try again.';
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
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-dark-900 dark:text-white">
                  {isReactivation ? 'Reactivate Your Account' : 'Select Package'}
                </h2>
                {isReactivation && (
                  <RefreshCw className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {isReactivation
                  ? `Submit a request to admin for reactivation approval`
                  : 'Choose a package to activate your account'
                }
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-full transition-colors flex-shrink-0"
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

            {/* Reactivation Info Card - Clean Design */}
            {isReactivation && (
              <div className="mb-4 p-4 bg-gray-50 dark:bg-dark-700/50 rounded-lg border border-gray-200 dark:border-dark-600">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-dark-600 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <h4 className="font-semibold text-dark-900 dark:text-white text-sm">Admin Approval Required</h4>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 border-l-2 border-gray-300 dark:border-dark-600 pl-3">
                  Your reactivation request will be reviewed by an administrator before activation.
                </p>
                <ul className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                    <span>Commission counter resets from {commissionCount}/2 to 0/2</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                    <span>Rejoin the chain at a new position</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                    <span>Start earning commissions again immediately</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                    <span>Original sponsor relationship preserved</span>
                  </li>
                </ul>
              </div>
            )}

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
                  // For reactivation, allow selecting any package (no balance check)
                  const isDisabled = !isReactivation && !canAfford;

                  return (
                    <button
                      key={pkg.id}
                      onClick={() => setSelectedPackage(pkg)}
                      disabled={isDisabled}
                      className={`w-full p-4 rounded-lg border transition-all text-left ${
                        isSelected
                          ? 'border-dark-900 dark:border-white bg-gray-100 dark:bg-dark-700'
                          : !isDisabled
                          ? 'border-gray-200 dark:border-dark-600 hover:border-gray-400 dark:hover:border-dark-500'
                          : 'border-gray-200 dark:border-dark-600 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isSelected
                              ? 'bg-dark-900 dark:bg-white'
                              : 'bg-gray-100 dark:bg-dark-700'
                          }`}>
                            <Package className={`w-5 h-5 ${isSelected ? 'text-white dark:text-dark-900' : 'text-gray-500'}`} />
                          </div>
                          <div>
                            <h3 className={`font-semibold ${
                              isSelected ? 'text-dark-900 dark:text-white' : 'text-dark-900 dark:text-white'
                            }`}>
                              {pkg.name}
                            </h3>
                            {pkg.description && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                {pkg.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-dark-600 text-gray-700 dark:text-gray-300 rounded">
                                {pkg.commission_percentage}% commission
                              </span>
                              {!isReactivation && !canAfford && (
                                <span className="text-xs px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded">
                                  Insufficient balance
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${
                            isSelected ? 'text-dark-900 dark:text-white' : 'text-dark-900 dark:text-white'
                          }`}>
                            ₹{pkg.amount.toLocaleString()}
                          </p>
                          {isSelected && (
                            <CheckCircle className="w-5 h-5 text-dark-900 dark:text-white ml-auto mt-1" />
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
                className="flex-1 px-4 py-3 bg-dark-900 dark:bg-white text-white dark:text-dark-900 rounded-lg font-semibold hover:bg-dark-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {purchasing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {isReactivation ? (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Submit Request
                      </>
                    ) : (
                      'Activate Now'
                    )}
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
