export default function GradientBlobs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Static gradient blobs - no animation for performance */}
      <div className="absolute -top-1/2 -left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
      <div className="absolute top-1/4 -right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-1/4 left-1/3 w-96 h-96 bg-pink-500/15 rounded-full blur-3xl" />
    </div>
  );
}

