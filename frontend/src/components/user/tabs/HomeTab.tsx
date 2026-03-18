import React, { memo, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ArrowRight, Image as ImageIcon, Video, Clock, ExternalLink, Users, Film, Play } from 'lucide-react';
import SponsorCarousel from '../SponsorCarousel';
import { useData } from '../../../contexts/DataContext';
import { HomeContentSkeleton } from '../../shared/Skeleton';
import { isSafeUrl } from '../../../utils/url';

const HomeTab: React.FC = memo(() => {
  const { homeData, homeDataLoading } = useData();

  // Loading state
  if (homeDataLoading && !homeData) {
    return <HomeContentSkeleton />;
  }

  // Get data arrays
  const photos = useMemo(() => homeData?.photos || [], [homeData?.photos]);
  const videos = useMemo(() => homeData?.videos || [], [homeData?.videos]);
  const meetings = useMemo(() => homeData?.meetings || [], [homeData?.meetings]);

  // Video refs for auto-play on hover
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});

  // Helper functions for meetings
  const formatTime = (timeStr: string) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const isToday = (dateStr: string) => {
    if (!dateStr) return false;
    const today = new Date();
    const meetingDate = new Date(dateStr);
    return today.toDateString() === meetingDate.toDateString();
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-4">
      {/* Sponsor Carousel */}
      <SponsorCarousel />

      {/* Photos Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-dark-900 dark:text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6 text-accent-bitcoin" />
            Latest Photos
          </h2>
          {photos.length > 0 && (
            <Link
              to="/user/photos"
              className="flex items-center gap-1 text-sm sm:text-base text-accent-bitcoin hover:text-accent-orange transition-colors font-semibold"
            >
              See More
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {photos.length === 0 ? (
          <div className="bg-white dark:bg-dark-800 rounded-xl p-8 text-center">
            <ImageIcon className="w-12 h-12 mx-auto mb-3 text-dark-300 dark:text-dark-600" />
            <p className="text-dark-600 dark:text-dark-300">No photos available</p>
          </div>
        ) : (
          <div className="flex overflow-x-auto gap-3 sm:gap-4 pb-2 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {photos.map((photo) => (
              <Link
                key={photo.id}
                to="/user/photos"
                className="relative flex-shrink-0 w-[45vw] sm:w-[200px] aspect-square rounded-xl overflow-hidden group shadow-lg hover:shadow-2xl transition-shadow snap-start"
              >
                <img
                  src={photo.media_url}
                  alt={photo.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-xs font-semibold line-clamp-2">{photo.title}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Videos Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-dark-900 dark:text-white flex items-center gap-2">
            <Film className="w-5 h-5 sm:w-6 sm:h-6 text-accent-bitcoin" />
            Latest Videos
          </h2>
          {videos.length > 0 && (
            <Link
              to="/user/videos"
              className="flex items-center gap-1 text-sm sm:text-base text-accent-bitcoin hover:text-accent-orange transition-colors font-semibold"
            >
              See More
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {videos.length === 0 ? (
          <div className="bg-white dark:bg-dark-800 rounded-xl p-8 text-center">
            <Film className="w-12 h-12 mx-auto mb-3 text-dark-300 dark:text-dark-600" />
            <p className="text-dark-600 dark:text-dark-300">No videos available</p>
          </div>
        ) : (
          <div className="flex overflow-x-auto gap-3 sm:gap-4 pb-2 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {videos.slice(0, 10).map((video) => (
              <Link
                key={video.id}
                to="/user/videos"
                className="relative flex-shrink-0 w-[45vw] sm:w-[200px] aspect-[9/16] rounded-xl overflow-hidden group shadow-lg hover:shadow-2xl transition-shadow snap-start bg-black"
                onMouseEnter={() => {
                  const vid = videoRefs.current[video.id];
                  if (vid) {
                    vid.muted = true;
                    vid.play().catch(() => {});
                  }
                }}
                onMouseLeave={() => {
                  const vid = videoRefs.current[video.id];
                  if (vid) {
                    vid.pause();
                    vid.currentTime = 0;
                  }
                }}
              >
                {/* Video thumbnail or video preview */}
                {video.thumbnail_url ? (
                  <>
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:opacity-0 transition-opacity duration-300"
                      loading="lazy"
                    />
                    <video
                      ref={el => { if (el) videoRefs.current[video.id] = el; }}
                      src={video.media_url}
                      className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      muted
                      loop
                      playsInline
                      preload="metadata"
                    />
                  </>
                ) : (
                  <video
                    ref={el => { if (el) videoRefs.current[video.id] = el; }}
                    src={video.media_url}
                    className="w-full h-full object-cover"
                    muted
                    loop
                    playsInline
                    preload="metadata"
                  />
                )}
                {/* Play icon overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-all">
                  <div className="w-12 h-12 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="w-6 h-6 text-white fill-white" />
                  </div>
                </div>
                {/* Title overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <p className="text-white text-xs font-semibold line-clamp-2">{video.title}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Zoom Meetings Section */}
      <section className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl sm:rounded-2xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-dark-900 dark:text-white">
              Upcoming Meetings
            </h2>
          </div>
          {meetings.length > 0 && (
            <Link
              to="/user/meetings"
              className="flex items-center gap-1 text-sm sm:text-base text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors font-semibold"
            >
              See All
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {meetings.length === 0 ? (
          <div className="bg-white/50 dark:bg-dark-800/50 rounded-xl p-6 sm:p-8 text-center">
            <Video className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-blue-600/50 dark:text-blue-400/50" />
            <p className="text-dark-700 dark:text-dark-200 font-medium mb-1">
              No upcoming meetings
            </p>
            <p className="text-xs sm:text-sm text-dark-500 dark:text-dark-400">
              Check back later for scheduled Zoom meetings
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {meetings.map((meeting: any) => (
              <div
                key={meeting.id}
                className={`bg-white dark:bg-dark-800 rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow ${
                  isToday(meeting.meeting_date) ? 'ring-2 ring-green-500/50' : ''
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isToday(meeting.meeting_date)
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : 'bg-blue-100 dark:bg-blue-900/30'
                  }`}>
                    <Video className={`w-5 h-5 sm:w-6 sm:h-6 ${
                      isToday(meeting.meeting_date)
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-blue-600 dark:text-blue-400'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-sm sm:text-base font-bold text-dark-900 dark:text-white truncate">
                        {meeting.title}
                      </h3>
                      {isToday(meeting.meeting_date) && (
                        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
                          Today
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-dark-500 dark:text-dark-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{formatDate(meeting.meeting_date)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatTime(meeting.meeting_time)}</span>
                      </div>
                      {meeting.host_name && (
                        <div className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[100px]">{meeting.host_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {isSafeUrl(meeting.zoom_link) ? (
                    <a
                      href={meeting.zoom_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors shadow-md hover:shadow-lg w-full sm:w-auto"
                    >
                      <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>Join</span>
                    </a>
                  ) : (
                    <span className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 bg-gray-400 text-white text-xs sm:text-sm font-medium rounded-lg w-full sm:w-auto cursor-not-allowed opacity-60">
                      <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>Join</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
});

HomeTab.displayName = 'HomeTab';

export default HomeTab;
