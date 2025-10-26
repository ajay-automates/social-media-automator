import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export const PostCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow p-6 space-y-3">
    <Skeleton height={20} width="60%" />
    <Skeleton height={16} width="40%" />
    <Skeleton height={200} />
    <div className="flex gap-2">
      <Skeleton circle height={32} width={32} />
      <Skeleton circle height={32} width={32} />
      <Skeleton circle height={32} width={32} />
    </div>
  </div>
);

export const DashboardSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[...Array(6)].map((_, i) => (
      <PostCardSkeleton key={i} />
    ))}
  </div>
);

const PlatformIcon = ({ platform }) => {
  const icons = {
    twitter: '🐦',
    linkedin: '🔗',
    instagram: '📸',
    telegram: '💬',
    facebook: '📘',
    pinterest: '📌',
    youtube: '📺',
  };
  
  return <span className="text-2xl">{icons[platform.toLowerCase()] || '📱'}</span>;
};

export const PostingOverlay = ({ platforms = [], currentPlatform }) => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center mb-6">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
          <h3 className="text-xl font-semibold text-gray-900">Publishing your post...</h3>
          <p className="text-gray-500 mt-2">This may take a few moments</p>
        </div>
        
        <div className="space-y-3">
          {platforms.map((platform, index) => {
            const isCompleted = index < platforms.indexOf(currentPlatform) || 
                              (platforms.indexOf(currentPlatform) === -1 && index === platforms.length - 1);
            const isActive = currentPlatform === platform;
            const isPending = !isCompleted && !isActive;
            
            return (
              <div key={platform} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <PlatformIcon platform={platform} />
                  <span className="font-medium capitalize">{platform}</span>
                </div>
                {isActive ? (
                  <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                ) : isCompleted ? (
                  <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <div className="h-5 w-5 border-2 border-gray-300 rounded-full"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const AnalyticsSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow p-6">
          <Skeleton height={16} width="50%" className="mb-4" />
          <Skeleton height={40} width="70%" />
        </div>
      ))}
    </div>
    <div className="bg-white rounded-lg shadow p-6">
      <Skeleton height={24} width="40%" className="mb-4" />
      <Skeleton height={300} />
    </div>
  </div>
);

