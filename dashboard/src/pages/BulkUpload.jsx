import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { showSuccess, showError } from '../components/ui/Toast';
import AnimatedBackground from '../components/ui/AnimatedBackground';

export default function BulkUpload() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [scheduling, setScheduling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [editingRow, setEditingRow] = useState(null);
  const [editData, setEditData] = useState({});

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile.name.endsWith('.csv')) {
      showError('Please upload a CSV file');
      return;
    }

    setFile(selectedFile);
    uploadAndParse(selectedFile);
  };

  const uploadAndParse = async (fileToUpload) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', fileToUpload);

      const response = await api.post('/bulk/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setParsedData(response.data.data);
        setSummary(response.data.summary);
        showSuccess(`Parsed ${response.data.summary.total} posts. ${response.data.summary.valid} valid, ${response.data.summary.invalid} invalid.`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      showError(error.response?.data?.error || 'Failed to parse CSV file');
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await api.get('/bulk/template', {
        responseType: 'blob'
      });

      // Create blob with correct MIME type
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'bulk-upload-template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url); // Clean up
      showSuccess('Template downloaded!');
    } catch (error) {
      console.error('Download error:', error);
      showError(error.response?.data?.error || 'Failed to download template');
    }
  };

  const handleScheduleAll = async () => {
    const validPosts = parsedData.filter(row => row.isValid);
    
    if (validPosts.length === 0) {
      showError('No valid posts to schedule');
      return;
    }

    setScheduling(true);
    setProgress(0);

    try {
      const postsToSchedule = validPosts.map(row => ({
        rowNumber: row.rowNumber,
        caption: row.parsed.caption,
        platforms: row.parsed.platforms,
        schedule_datetime: row.parsed.schedule_datetime,
        image_url: row.parsed.image_url,
        reddit_title: row.parsed.reddit_title,
        reddit_subreddit: row.parsed.reddit_subreddit
      }));

      const response = await api.post('/bulk/schedule', { posts: postsToSchedule });

      if (response.data.success) {
        showSuccess(`Successfully scheduled ${response.data.scheduled} posts!`);
        setProgress(100);
        
        // Redirect to calendar after 2 seconds
        setTimeout(() => {
          navigate('/calendar');
        }, 2000);
      }
    } catch (error) {
      console.error('Scheduling error:', error);
      showError(error.response?.data?.error || 'Failed to schedule posts');
    } finally {
      setScheduling(false);
    }
  };

  const handleEditRow = (row) => {
    setEditingRow(row.rowNumber);
    setEditData({
      caption: row.parsed.caption,
      platforms: row.parsed.platforms.join(','),
      image_url: row.parsed.image_url,
      reddit_title: row.parsed.reddit_title,
      reddit_subreddit: row.parsed.reddit_subreddit
    });
  };

  const handleSaveEdit = (rowNumber) => {
    const updatedData = parsedData.map(row => {
      if (row.rowNumber === rowNumber) {
        return {
          ...row,
          parsed: {
            ...row.parsed,
            caption: editData.caption,
            platforms: editData.platforms.split(',').map(p => p.trim()),
            image_url: editData.image_url,
            reddit_title: editData.reddit_title,
            reddit_subreddit: editData.reddit_subreddit
          },
          errors: [], // Clear errors after editing
          isValid: true
        };
      }
      return row;
    });

    setParsedData(updatedData);
    setEditingRow(null);
    showSuccess('Row updated');
  };

  const handleCancelEdit = () => {
    setEditingRow(null);
    setEditData({});
  };

  const handleReset = () => {
    setFile(null);
    setParsedData(null);
    setSummary(null);
    setProgress(0);
  };

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-black text-white mb-2 flex items-center gap-3">
            <span className="text-5xl">📤</span>
            Bulk CSV Upload
          </h1>
          <p className="text-gray-300 text-lg">Schedule hundreds of posts at once from a CSV file</p>
        </motion.div>

        {/* Template Download Button */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <button
            onClick={downloadTemplate}
            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition shadow-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download CSV Template
          </button>
        </motion.div>

        {/* Upload Area */}
        {!parsedData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group relative bg-gradient-to-br from-blue-900/30 to-purple-900/30 backdrop-blur-2xl border-2 border-blue-400/40 rounded-2xl p-12 shadow-2xl shadow-blue-500/20 overflow-hidden mb-8"
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"></div>
            
            <input
              type="file"
              accept=".csv"
              onChange={handleFileInputChange}
              className="hidden"
              id="csv-upload"
            />

            <label
              htmlFor="csv-upload"
              className={`relative cursor-pointer flex flex-col items-center justify-center text-center ${
                dragging ? 'scale-105' : ''
              } transition-transform`}
            >
              <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${
                dragging 
                  ? 'bg-gradient-to-br from-blue-500 to-purple-500' 
                  : 'bg-gradient-to-br from-blue-600/50 to-purple-600/50'
              } backdrop-blur-xl border-2 border-blue-400/60 shadow-2xl`}>
                {uploading ? (
                  <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                )}
              </div>

              <h3 className="text-2xl font-bold text-white mb-2">
                {dragging ? 'Drop your CSV file here' : uploading ? 'Processing...' : 'Upload CSV File'}
              </h3>
              <p className="text-gray-300 mb-4">
                Drag and drop your CSV file here, or click to browse
              </p>
              <p className="text-sm text-gray-400">
                Maximum file size: 10MB • Supported format: CSV
              </p>
            </label>
          </motion.div>
        )}

        {/* Summary Card */}
        {summary && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-2xl border-2 border-white/20 rounded-2xl p-6 shadow-2xl mb-6"
          >
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span>📊</span>
              Upload Summary
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-900/30 backdrop-blur-xl border border-blue-400/30 rounded-xl p-4">
                <p className="text-blue-300 text-sm font-semibold mb-1">Total Posts</p>
                <p className="text-3xl font-black text-white">{summary.total}</p>
              </div>
              
              <div className="bg-green-900/30 backdrop-blur-xl border border-green-400/30 rounded-xl p-4">
                <p className="text-green-300 text-sm font-semibold mb-1">Valid Posts</p>
                <p className="text-3xl font-black text-white">{summary.valid}</p>
              </div>
              
              <div className="bg-red-900/30 backdrop-blur-xl border border-red-400/30 rounded-xl p-4">
                <p className="text-red-300 text-sm font-semibold mb-1">Errors</p>
                <p className="text-3xl font-black text-white">{summary.invalid}</p>
              </div>
              
              <div className="bg-yellow-900/30 backdrop-blur-xl border border-yellow-400/30 rounded-xl p-4">
                <p className="text-yellow-300 text-sm font-semibold mb-1">Warnings</p>
                <p className="text-3xl font-black text-white">{summary.withWarnings}</p>
              </div>
            </div>

            {/* Progress Bar */}
            {scheduling && (
              <div className="mt-6">
                <div className="flex justify-between text-sm text-gray-300 mb-2">
                  <span>Scheduling posts...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"
                  />
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Action Buttons */}
        {parsedData && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap gap-4 mb-6"
          >
            <button
              onClick={handleScheduleAll}
              disabled={scheduling || summary.valid === 0}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-black text-lg hover:opacity-90 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {scheduling ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Scheduling...
                </>
              ) : (
                <>
                  ✅ Schedule {summary.valid} Valid Posts
                </>
              )}
            </button>

            <button
              onClick={handleReset}
              className="bg-gradient-to-r from-gray-700 to-gray-600 text-white px-6 py-4 rounded-xl font-bold hover:opacity-90 transition shadow-lg"
            >
              ❌ Cancel & Upload New
            </button>
          </motion.div>
        )}

        {/* Preview Table */}
        {parsedData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-gray-900/80 to-gray-800/80 backdrop-blur-2xl border-2 border-white/20 rounded-2xl p-6 shadow-2xl overflow-hidden"
          >
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span>📋</span>
              Preview & Edit
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-white/20">
                    <th className="text-left text-white font-bold p-3">Row</th>
                    <th className="text-left text-white font-bold p-3">Status</th>
                    <th className="text-left text-white font-bold p-3">Date/Time</th>
                    <th className="text-left text-white font-bold p-3">Caption</th>
                    <th className="text-left text-white font-bold p-3">Platforms</th>
                    <th className="text-left text-white font-bold p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedData.map((row) => (
                    <tr
                      key={row.rowNumber}
                      className={`border-b border-white/10 ${
                        row.isValid ? 'bg-green-900/10' : 'bg-red-900/10'
                      }`}
                    >
                      <td className="p-3 text-white font-mono">{row.rowNumber}</td>
                      <td className="p-3">
                        {row.isValid ? (
                          <span className="inline-flex items-center gap-1 bg-green-600/30 border border-green-400/50 text-green-200 px-2 py-1 rounded text-xs font-bold">
                            ✅ Valid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-red-600/30 border border-red-400/50 text-red-200 px-2 py-1 rounded text-xs font-bold">
                            ❌ Error
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-gray-300 text-sm">
                        {row.parsed.schedule_datetime 
                          ? new Date(row.parsed.schedule_datetime).toLocaleString()
                          : <span className="text-red-400">Invalid</span>}
                      </td>
                      <td className="p-3 text-gray-300 text-sm max-w-md">
                        {editingRow === row.rowNumber ? (
                          <textarea
                            value={editData.caption}
                            onChange={(e) => setEditData({ ...editData, caption: e.target.value })}
                            className="w-full bg-gray-800 border border-gray-600 text-white rounded p-2 text-sm"
                            rows={2}
                          />
                        ) : (
                          <span className="line-clamp-2">{row.parsed.caption}</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {row.parsed.platforms.map(platform => (
                            <span
                              key={platform}
                              className="inline-block bg-blue-600/30 border border-blue-400/50 text-blue-200 px-2 py-0.5 rounded text-xs font-semibold capitalize"
                            >
                              {platform}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3">
                        {editingRow === row.rowNumber ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveEdit(row.rowNumber)}
                              className="bg-green-600 text-white px-3 py-1 rounded text-sm font-bold hover:opacity-90"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="bg-gray-600 text-white px-3 py-1 rounded text-sm font-bold hover:opacity-90"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEditRow(row)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm font-bold hover:opacity-90"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Errors Display */}
            {parsedData.some(row => row.errors.length > 0) && (
              <div className="mt-6 bg-red-900/20 border-2 border-red-400/30 rounded-xl p-4">
                <h4 className="text-red-300 font-bold mb-2 flex items-center gap-2">
                  <span>⚠️</span>
                  Validation Errors
                </h4>
                <div className="space-y-2">
                  {parsedData.filter(row => row.errors.length > 0).map((row) => (
                    <div key={row.rowNumber} className="text-sm">
                      <span className="text-red-400 font-mono font-bold">Row {row.rowNumber}:</span>
                      <ul className="list-disc list-inside text-red-300 ml-4">
                        {row.errors.map((error, idx) => (
                          <li key={idx}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

