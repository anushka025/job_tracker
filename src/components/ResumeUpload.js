import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

const ACCEPTED = '.pdf,.doc,.docx,.txt';
const API_BASE = process.env.REACT_APP_API_URL || '';

function ResumeUpload({ userId, onClose, onResumeSaved }) {
  const [resumeText, setResumeText] = useState('');
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(true);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchResume = async () => {
      const { data } = await supabase
        .from('user_profiles')
        .select('resume_text')
        .eq('user_id', userId)
        .single();

      if (data?.resume_text) setResumeText(data.resume_text);
      setLoading(false);
    };
    fetchResume();
  }, [userId]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setMessage('');
    setExtracting(true);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await fetch(`${API_BASE}/api/extract-resume`, { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Extraction failed.');
      setResumeText(data.text);
    } catch (err) {
      setMessage(err.message);
      setFileName('');
    } finally {
      setExtracting(false);
      // Reset so the same file can be re-selected if needed
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    if (!resumeText.trim()) {
      setMessage('Upload a file or paste your resume text before saving.');
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('user_profiles')
      .upsert(
        { user_id: userId, resume_text: resumeText.trim(), updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      );

    if (error) {
      setMessage('Error saving resume. Please try again.');
    } else {
      setMessage('Resume saved!');
      onResumeSaved?.(resumeText.trim());
      setTimeout(() => { setMessage(''); onClose(); }, 1000);
    }
    setSaving(false);
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="resume-modal-title"
      onClick={onClose}
    >
      <div
        className="flex flex-col w-full max-w-2xl max-h-[85vh] rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 id="resume-modal-title" className="text-xl font-bold text-gray-900">My Resume</h2>
            <p className="text-sm text-gray-500 mt-0.5">Upload a file or paste text — used for AI match analysis</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700" aria-label="Close">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-500">Loading...</div>
          ) : (
            <>
              {/* File upload zone */}
              <div
                className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-6 py-8 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {extracting ? (
                  <>
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-200 border-t-emerald-600" />
                    <p className="text-sm text-gray-500">Extracting text from {fileName}...</p>
                  </>
                ) : (
                  <>
                    <span className="text-3xl">📄</span>
                    <p className="text-sm font-medium text-gray-700">
                      {fileName ? `Loaded: ${fileName}` : 'Click to upload your resume'}
                    </p>
                    <p className="text-xs text-gray-400">PDF, DOCX, or TXT · max 10 MB</p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-gray-200" />
                <span className="text-xs text-gray-400 font-medium">or paste text below</span>
                <div className="flex-1 border-t border-gray-200" />
              </div>

              {/* Text area */}
              <div>
                <textarea
                  className="w-full h-56 rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono
                             focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
                  placeholder="Paste your full resume here..."
                  value={resumeText}
                  onChange={(e) => { setResumeText(e.target.value); setFileName(''); }}
                />
                <p className="text-xs text-gray-400 mt-1">{resumeText.trim().length} characters</p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
          <div>
            {message && (
              <span className={`text-sm font-medium ${message.includes('Error') || message.includes('failed') || message.includes('Upload') ? 'text-red-600' : 'text-emerald-600'}`}>
                {message}
              </span>
            )}
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || loading || extracting}
              className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Resume'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResumeUpload;
