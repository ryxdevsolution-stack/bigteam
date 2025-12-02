import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Video, Clock, ExternalLink, Users, Loader2 } from 'lucide-react';
import { getMeetings, Meeting } from '../../../services/meetingService';

const MeetingsTab: React.FC = () => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMeetings = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getMeetings();
        setMeetings(data);
      } catch (err) {
        setError('Failed to load meetings');
      } finally {
        setLoading(false);
      }
    };

    fetchMeetings();
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const isToday = (dateStr: string) => {
    const today = new Date();
    const meetingDate = new Date(dateStr);
    return today.toDateString() === meetingDate.toDateString();
  };

  const isTomorrow = (dateStr: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const meetingDate = new Date(dateStr);
    return tomorrow.toDateString() === meetingDate.toDateString();
  };

  const getDateLabel = (dateStr: string) => {
    if (isToday(dateStr)) return 'Today';
    if (isTomorrow(dateStr)) return 'Tomorrow';
    return formatDate(dateStr);
  };

  const handleJoinMeeting = (zoomLink: string) => {
    window.open(zoomLink, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-dark-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg"
        >
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-dark-900 dark:text-white">
            Zoom Meetings
          </h1>
          <p className="text-sm sm:text-base text-dark-600 dark:text-dark-300 mt-2">
            Loading upcoming meetings...
          </p>
        </motion.div>
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-dark-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg"
        >
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-dark-900 dark:text-white">
            Zoom Meetings
          </h1>
        </motion.div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-dark-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-dark-900 dark:text-white">
            Zoom Meetings
          </h1>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Video className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
              {meetings.length} Upcoming
            </span>
          </div>
        </div>
        <p className="text-sm sm:text-base text-dark-600 dark:text-dark-300">
          Join scheduled Zoom meetings and video calls
        </p>
      </motion.div>

      {meetings.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-dark-800 rounded-xl sm:rounded-2xl p-8 sm:p-12 md:p-16 shadow-lg"
        >
          <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <div className="relative mb-6">
              <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center">
                <Video className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-dark-800 flex items-center justify-center shadow-lg">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-dark-900 dark:text-white mb-3">
              No Upcoming Meetings
            </h2>

            <p className="text-sm sm:text-base text-dark-600 dark:text-dark-300 mb-6">
              There are no scheduled Zoom meetings at the moment. Check back later for upcoming sessions.
            </p>

            <div className="bg-light-100 dark:bg-dark-700 rounded-xl p-4 sm:p-6 w-full">
              <div className="flex items-start gap-3 text-left">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-accent-bitcoin mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-dark-900 dark:text-white text-sm sm:text-base mb-1">
                    Stay Tuned
                  </h3>
                  <p className="text-xs sm:text-sm text-dark-600 dark:text-dark-300">
                    New meetings will appear here when scheduled by the admin. You'll be able to join directly with one click.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {meetings.map((meeting, index) => (
            <motion.div
              key={meeting.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (index + 1) }}
              className="bg-white dark:bg-dark-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isToday(meeting.meeting_date)
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : 'bg-blue-100 dark:bg-blue-900/30'
                    }`}>
                      <Video className={`w-6 h-6 sm:w-7 sm:h-7 ${
                        isToday(meeting.meeting_date)
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-blue-600 dark:text-blue-400'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-lg sm:text-xl font-bold text-dark-900 dark:text-white truncate">
                          {meeting.title}
                        </h3>
                        {isToday(meeting.meeting_date) && (
                          <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
                            Today
                          </span>
                        )}
                        {isTomorrow(meeting.meeting_date) && (
                          <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs font-medium rounded-full">
                            Tomorrow
                          </span>
                        )}
                      </div>
                      {meeting.description && (
                        <p className="text-sm text-dark-600 dark:text-dark-300 mb-3 line-clamp-2">
                          {meeting.description}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-dark-500 dark:text-dark-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          <span>{getDateLabel(meeting.meeting_date)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          <span>{formatTime(meeting.meeting_time)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-dark-400 dark:text-dark-500">•</span>
                          <span>{meeting.duration_minutes} min</span>
                        </div>
                        {meeting.host_name && (
                          <div className="flex items-center gap-1.5">
                            <Users className="w-4 h-4" />
                            <span>Host: {meeting.host_name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end lg:justify-start">
                  <button
                    onClick={() => handleJoinMeeting(meeting.zoom_link)}
                    className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-blue-600/20 hover:shadow-blue-700/30"
                  >
                    <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-sm sm:text-base">Join Meeting</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MeetingsTab;
