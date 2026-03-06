import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { toast } from 'react-hot-toast';
import { FaImages, FaRobot, FaEye, FaPaperPlane } from 'react-icons/fa';
import CarouselCaptionModal from '../components/CarouselCaptionModal';

export default function CreateCarousel() {
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [captions, setCaptions] = useState([]);
  const [topic, setTopic] = useState('');
  const [platforms, setPlatforms] = useState(['linkedin']);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showCaptionModal, setShowCaptionModal] = useState(false);
  const [posting, setPosting] = useState(false);

  // Handle file upload
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length < 2) {
      toast.error('Please select at least 2 images for carousel');
      return;
    }
    
    if (files.length > 10) {
      toast.error('Maximum 10 images allowed');
      return;
    }

    // Check file sizes
    const oversized = files.filter(f => f.size > 10 * 1024 * 1024);
    if (oversized.length > 0) {
      toast.error('Some images exceed 10MB limit');
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      files.forEach(file => formData.append('images', file));

      const response = await api.post('/carousel/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setImages(response.data.images);
        setCaptions(new Array(response.data.images.length).fill(''));
        toast.success(`${response.data.count} images uploaded successfully! 📸`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.error || 'Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  // Remove image
  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newCaptions = captions.filter((_, i) => i !== index);
    setImages(newImages);
    setCaptions(newCaptions);
    if (currentSlide >= newImages.length) {
      setCurrentSlide(Math.max(0, newImages.length - 1));
    }
  };

  // Reorder images
  const moveImage = (fromIndex, toIndex) => {
    const newImages = [...images];
    const newCaptions = [...captions];
    
    const [movedImage] = newImages.splice(fromIndex, 1);
    const [movedCaption] = newCaptions.splice(fromIndex, 1);
    
    newImages.splice(toIndex, 0, movedImage);
    newCaptions.splice(toIndex, 0, movedCaption);
    
    setImages(newImages);
    setCaptions(newCaptions);
  };

  // Update caption for specific slide
  const updateCaption = (index, text) => {
    const newCaptions = [...captions];
    newCaptions[index] = text;
    setCaptions(newCaptions);
  };

  // Post carousel
  const handlePost = async () => {
    if (images.length < 2) {
      toast.error('Please upload at least 2 images');
      return;
    }

    const filledCaptions = captions.filter(c => c.trim()).length;
    if (filledCaptions === 0) {
      toast.error('Please add at least one caption');
      return;
    }

    setPosting(true);

    try {
      const requestData = {
        imageUrls: images,
        captions: captions.filter(c => c.trim()),
        platforms,
        topic
      };

      console.log('📸 Posting carousel with data:', requestData);
      console.log('Image URLs:', images);
      console.log('Captions count:', requestData.captions.length);
      console.log('Platforms:', platforms);

      const response = await api.post('/carousel/post', requestData);

      console.log('✅ Carousel post response:', response.data);

      if (response.data.success) {
        toast.success('Carousel posted successfully! 🎉');
        setTimeout(() => navigate('/analytics'), 2000);
      } else {
        toast.error(response.data.error || 'Failed to post carousel');
      }
    } catch (error) {
      console.error('❌ Post error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      const errorMsg = error.response?.data?.error || error.message || 'Failed to post carousel';
      toast.error(errorMsg);
      
      // Show debug info if available
      if (error.response?.data?.debug) {
        console.log('Debug info from server:', error.response.data.debug);
      }
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate(-1)}
            className="text-[#a1a1aa] hover:text-white mb-4 flex items-center gap-2"
          >
            ← Back
          </button>
          <h1 className="text-4xl font-bold text-white mb-2">📸 Create Carousel Post</h1>
          <p className="text-[#a1a1aa]">Upload 2-10 images and let AI create captions for your slides</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Upload & Builder */}
          <div className="space-y-6">
            {/* Upload Section */}
            {images.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#18181b] border-2 border-dashed border-[#22d3ee]/30 rounded-xl p-12 text-center"
              >
                <FaImages className="text-6xl text-[#a1a1aa] mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Upload Your Images</h3>
                <p className="text-[#a1a1aa] mb-6">Select 2-10 images to create your carousel</p>
                
                <label className="cursor-pointer">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    disabled={uploading}
                    className="hidden"
                  />
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-block bg-[#22d3ee] text-[#0a0a0b] px-8 py-4 rounded-xl font-bold text-lg"
                  >
                    {uploading ? 'Uploading...' : '📤 Choose Images'}
                  </motion.div>
                </label>
                
                <p className="text-[#a1a1aa] text-sm mt-4">JPG, PNG • Max 10MB per image</p>
              </motion.div>
            ) : (
              /* Image Grid */
              <div className="bg-[#18181b] border border-white/[0.08] rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">Your Slides ({images.length})</h3>
                  <label className="cursor-pointer text-[#22d3ee] hover:text-[#22d3ee] text-sm font-semibold">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    + Add More
                  </label>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {images.map((img, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer ${
                        currentSlide === index ? 'border-[#22d3ee]' : 'border-white/[0.06]'
                      }`}
                      onClick={() => setCurrentSlide(index)}
                    >
                      <img src={img} alt={`Slide ${index + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute top-1 left-1 bg-black/70 text-white px-2 py-1 rounded text-xs font-bold">
                        {index + 1}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(index);
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        ×
                      </button>
                      {currentSlide === index && (
                        <div className="absolute inset-0 border-4 border-[#22d3ee] rounded-lg pointer-events-none"></div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Topic Input */}
            {images.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#18181b] border border-white/[0.08] rounded-xl p-6"
              >
                <label className="block text-white font-bold mb-2">Carousel Topic (Optional)</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Marketing tips, Product launch, Tutorial..."
                  className="w-full bg-[#18181b] border border-white/[0.06] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#22d3ee]/40 focus:ring-1 focus:ring-[#22d3ee]/20 transition-colors"
                />
                <p className="text-[#a1a1aa] text-sm mt-2">Helps AI generate better captions</p>
              </motion.div>
            )}

            {/* AI Caption Generation */}
            {images.length > 0 && (
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowCaptionModal(true)}
                className="w-full bg-white/[0.06] border border-white/[0.08] text-white px-6 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3"
              >
                <FaRobot className="text-2xl" />
                Generate AI Captions for All Slides
              </motion.button>
            )}
          </div>

          {/* Right Column - Preview & Captions */}
          {images.length > 0 && (
            <div className="space-y-6">
              {/* Preview */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-[#18181b] border border-white/[0.08] rounded-xl p-6"
              >
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <FaEye /> Preview Slide {currentSlide + 1}
                </h3>

                <div className="aspect-square rounded-lg overflow-hidden mb-4">
                  <img
                    src={images[currentSlide]}
                    alt={`Slide ${currentSlide + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Slide Navigation */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setCurrentSlide(Math.max(0, currentSlide - 1))}
                    disabled={currentSlide === 0}
                    className="px-4 py-2 bg-[#18181b] text-white rounded-lg disabled:opacity-30 hover:bg-[#18181b]"
                  >
                    ← Prev
                  </button>
                  <div className="flex gap-2">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentSlide(i)}
                        className={`w-2 h-2 rounded-full ${
                          i === currentSlide ? 'bg-[#22d3ee]' : 'bg-[#18181b]'
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentSlide(Math.min(images.length - 1, currentSlide + 1))}
                    disabled={currentSlide === images.length - 1}
                    className="px-4 py-2 bg-[#18181b] text-white rounded-lg disabled:opacity-30 hover:bg-[#18181b]"
                  >
                    Next →
                  </button>
                </div>

                {/* Caption Editor */}
                <div>
                  <label className="block text-white font-bold mb-2">Caption for Slide {currentSlide + 1}</label>
                  <textarea
                    value={captions[currentSlide] || ''}
                    onChange={(e) => updateCaption(currentSlide, e.target.value)}
                    placeholder="Enter caption for this slide..."
                    rows={4}
                    className="w-full bg-[#18181b] border border-white/[0.06] text-white rounded-lg px-4 py-3 focus:outline-none focus:border-[#22d3ee]/40 focus:ring-1 focus:ring-[#22d3ee]/20 transition-colors resize-none"
                  />
                  <p className="text-[#a1a1aa] text-sm mt-1">{captions[currentSlide]?.length || 0} characters</p>
                </div>
              </motion.div>

              {/* Platform Selection */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-[#18181b] border border-white/[0.08] rounded-xl p-6"
              >
                <h3 className="text-xl font-bold text-white mb-4">Select Platform</h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => setPlatforms(['linkedin'])}
                    className={`flex-1 px-4 py-3 rounded-lg font-semibold ${
                      platforms.includes('linkedin')
                        ? 'bg-[#22d3ee] text-[#0a0a0b]'
                        : 'bg-[#18181b] text-[#a1a1aa] hover:bg-[#18181b]'
                    }`}
                  >
                    LinkedIn
                  </button>
                </div>
              </motion.div>

              {/* Post Button */}
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePost}
                disabled={posting || captions.filter(c => c.trim()).length === 0}
                className="w-full bg-[#22d3ee] text-[#0a0a0b] px-6 py-4 rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                <FaPaperPlane />
                {posting ? 'Posting Carousel...' : 'Post Carousel to LinkedIn'}
              </motion.button>
            </div>
          )}
        </div>
      </div>

      {/* AI Caption Modal */}
      <CarouselCaptionModal
        show={showCaptionModal}
        onClose={() => setShowCaptionModal(false)}
        images={images}
        topic={topic}
        platform={platforms[0]}
        onCaptionsGenerated={(generatedCaptions) => {
          setCaptions(generatedCaptions);
          setShowCaptionModal(false);
          toast.success('AI captions generated! Review and edit as needed 🎨');
        }}
      />
    </div>
  );
}

