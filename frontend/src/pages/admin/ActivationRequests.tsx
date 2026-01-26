/**
 * Activation Requests Admin Panel
 *
 * Allows admins to view, approve, and reject reactivation requests
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  User,
  Mail,
  Wallet,
  AlertCircle,
  Loader2,
  TrendingUp,
  X
} from 'lucide-react';
import activationRequestService, { AdminRequestWithUser } from '../../services/activationRequestService';

const ActivationRequests: React.FC = () => {
  const [requests, setRequests] = useState<AdminRequestWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [showApproveModal, setShowApproveModal] = useState<AdminRequestWithUser | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await activationRequestService.getAllPendingRequests();
      if (response.success) {
        setRequests(response.requests);
      } else {
        setError('Failed to load requests');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApproveClick = (request: AdminRequestWithUser) => {
    setShowApproveModal(request);
  };

  const handleApprove = async (requestId: string) => {
    setProcessing(requestId);
    setError(null);

    try {
      const response = await activationRequestService.approveRequest(requestId);
      if (response.success) {
        setShowApproveModal(null);
        setSuccessMessage('Request approved successfully! User has been activated.');
        fetchRequests(); // Refresh the list
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to approve request');
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectClick = (requestId: string) => {
    setShowRejectModal(requestId);
    setRejectionReason('');
  };

  const handleReject = async (requestId: string) => {
    if (!rejectionReason.trim()) {
      setError('Please provide a rejection reason');
      return;
    }

    setProcessing(requestId);
    setError(null);

    try {
      const response = await activationRequestService.rejectRequest(requestId, rejectionReason);
      if (response.success) {
        setShowRejectModal(null);
        setSuccessMessage('Request rejected successfully. User has been notified.');
        fetchRequests(); // Refresh the list
      } else {
        setError(response.message);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reject request');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 animate-spin text-gray-400" />
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">Loading requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 md:p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-dark-800 rounded-lg sm:rounded-xl border border-gray-200 dark:border-dark-700 p-4 sm:p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2 text-dark-900 dark:text-white">
              <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-gray-600 dark:text-gray-400" />
              Activation Requests
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              Review and approve reactivation requests
            </p>
          </div>
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-dark-700 rounded-lg px-4 py-2 self-start sm:self-auto">
            <div className="text-2xl sm:text-3xl font-bold text-dark-900 dark:text-white">
              {requests.length}
            </div>
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              Pending
            </div>
          </div>
        </div>
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg sm:rounded-xl p-3 sm:p-4"
        >
          <div className="flex items-start gap-2 sm:gap-3">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-red-800 dark:text-red-200">Error</h3>
              <p className="text-xs sm:text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* No Requests */}
      {requests.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white dark:bg-dark-800 rounded-lg sm:rounded-xl border border-gray-200 dark:border-dark-700 p-8 sm:p-12 text-center"
        >
          <Clock className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-gray-300 dark:text-gray-600 mx-auto mb-3 sm:mb-4" />
          <h3 className="text-base sm:text-lg font-semibold text-dark-900 dark:text-white mb-2">
            No Pending Requests
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            All reactivation requests have been processed
          </p>
        </motion.div>
      )}

      {/* Requests List */}
      <div className="space-y-3 sm:space-y-4">
        {requests.map((req, index) => (
          <motion.div
            key={req.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white dark:bg-dark-800 rounded-lg sm:rounded-xl border border-gray-200 dark:border-dark-700 overflow-hidden hover:border-gray-300 dark:hover:border-dark-600 transition-colors"
          >
            <div className="p-4 sm:p-5 md:p-6">
              {/* Request Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gray-100 dark:bg-dark-700 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-bold text-dark-900 dark:text-white truncate">
                      {req.user.username}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 truncate">
                      <Mail className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{req.user.email}</span>
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    {new Date(req.requested_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500">
                    {new Date(req.requested_at).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>

              {/* Request Details Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4">
                {/* Package */}
                <div className="bg-gray-50 dark:bg-dark-700/50 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Package className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">
                      Package
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-dark-900 dark:text-white truncate">
                    {req.package_name}
                  </div>
                  <div className="text-sm sm:text-base md:text-lg font-bold text-dark-900 dark:text-white">
                    ₹{req.package_amount.toLocaleString()}
                  </div>
                </div>

                {/* User Balance */}
                <div className="bg-gray-50 dark:bg-dark-700/50 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Wallet className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">
                      Balance
                    </span>
                  </div>
                  <div className="text-sm sm:text-base md:text-lg font-bold text-dark-900 dark:text-white">
                    ₹{req.user.current_balance.toLocaleString()}
                  </div>
                  <div className={`text-[10px] sm:text-xs font-medium ${req.user.current_balance >= req.package_amount ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {req.user.current_balance >= req.package_amount ? '✓ Sufficient' : '✗ Insufficient'}
                  </div>
                </div>

                {/* Commissions */}
                <div className="bg-gray-50 dark:bg-dark-700/50 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">
                      Commissions
                    </span>
                  </div>
                  <div className="text-sm sm:text-base md:text-lg font-bold text-dark-900 dark:text-white">
                    {req.user.commission_count}/2
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                    {req.user.commission_count >= 2 ? 'Completed' : 'In Progress'}
                  </div>
                </div>

                {/* Status */}
                <div className="bg-gray-50 dark:bg-dark-700/50 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 dark:text-gray-400" />
                    <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">
                      Status
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-dark-900 dark:text-white capitalize">
                    {req.status}
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {req.request_type}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={() => handleApproveClick(req)}
                  disabled={processing === req.id || req.user.current_balance < req.package_amount}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {processing === req.id ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      <span className="hidden sm:inline">Processing...</span>
                      <span className="sm:hidden">Processing</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                      Approve
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleRejectClick(req.id)}
                  disabled={processing === req.id}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  Reject
                </button>
              </div>

              {/* Insufficient Balance Warning */}
              {req.user.current_balance < req.package_amount && (
                <div className="mt-3 sm:mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                  <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>User has insufficient balance. Cannot approve until user adds funds.</span>
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-dark-800 rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-md p-5 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-dark-900 dark:text-white">
                Reject Request
              </h3>
              <button
                onClick={() => setShowRejectModal(null)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-4">
              Please provide a reason for rejecting this request. The user will be notified.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-dark-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 text-sm sm:text-base"
              rows={4}
            />
            <div className="flex gap-2 sm:gap-3 mt-4">
              <button
                onClick={() => setShowRejectModal(null)}
                className="flex-1 px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-dark-600 rounded-lg text-dark-700 dark:text-dark-300 font-semibold hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(showRejectModal)}
                disabled={!rejectionReason.trim() || processing === showRejectModal}
                className="flex-1 px-4 py-2.5 sm:py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
              >
                {processing === showRejectModal ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Approval Confirmation Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-dark-800 rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-md p-5 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-dark-900 dark:text-white">
                Approve Reactivation Request
              </h3>
              <button
                onClick={() => setShowApproveModal(null)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Request Details */}
            <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4 mb-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white dark:bg-dark-800 flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-dark-900 dark:text-white">
                      {showApproveModal.user.username}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {showApproveModal.user.email}
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-dark-600 pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Package:</span>
                    <span className="font-semibold text-dark-900 dark:text-white">
                      {showApproveModal.package_name}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                    <span className="font-bold text-dark-900 dark:text-white">
                      ₹{showApproveModal.package_amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">User Balance:</span>
                    <span className={`font-semibold ${
                      showApproveModal.user.current_balance >= showApproveModal.package_amount
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      ₹{showApproveModal.user.current_balance.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
              <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-300">
                <strong>Action:</strong> Approving this request will:
              </p>
              <ul className="mt-2 space-y-1 text-xs text-blue-700 dark:text-blue-400">
                <li>• Deduct ₹{showApproveModal.package_amount.toLocaleString()} from user balance</li>
                <li>• Activate the user in the MLM chain</li>
                <li>• Reset commission counter to 0/2</li>
                <li>• User can start earning commissions again</li>
              </ul>
            </div>

            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to approve this reactivation request?
            </p>

            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => setShowApproveModal(null)}
                disabled={processing === showApproveModal.id}
                className="flex-1 px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-dark-600 rounded-lg text-dark-700 dark:text-dark-300 font-semibold hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors text-sm sm:text-base disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleApprove(showApproveModal.id)}
                disabled={processing === showApproveModal.id}
                className="flex-1 px-4 py-2.5 sm:py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base flex items-center justify-center gap-2"
              >
                {processing === showApproveModal.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Approve Request
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Success Modal */}
      {successMessage && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-dark-800 rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Success Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </div>

            {/* Success Message */}
            <h3 className="text-xl font-bold text-center text-dark-900 dark:text-white mb-2">
              Success!
            </h3>
            <p className="text-sm text-center text-gray-600 dark:text-gray-400 mb-6">
              {successMessage}
            </p>

            {/* OK Button */}
            <button
              onClick={() => setSuccessMessage(null)}
              className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors text-sm sm:text-base"
            >
              OK
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ActivationRequests;
