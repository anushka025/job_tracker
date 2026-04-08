import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const API_BASE = process.env.REACT_APP_API_URL || '';

function MatchRing({ percentage }) {
  const color =
    percentage >= 80 ? 'text-emerald-600' :
    percentage >= 60 ? 'text-yellow-500' :
    'text-red-500';

  const ringColor =
    percentage >= 80 ? '#10b981' :
    percentage >= 60 ? '#f59e0b' :
    '#ef4444';

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="100" height="100" viewBox="0 0 100 100" className="-rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="10" />
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute">
        <span className={`text-2xl font-bold ${color}`}>{percentage}%</span>
      </div>
      <p className="text-xs text-gray-500 font-medium">Match Score</p>
    </div>
  );
}

function Chip({ label, color }) {
  const styles = {
    red: 'bg-red-100 text-red-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    emerald: 'bg-emerald-100 text-emerald-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[color] || styles.red}`}>
      {label}
    </span>
  );
}

function JobMatchModal({ app, userId, onClose, onOpenResume }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasResume, setHasResume] = useState(null); // null = checking

  // Check if user has a resume saved
  useEffect(() => {
    const checkResume = async () => {
      const { data } = await supabase
        .from('user_profiles')
        .select('resume_text')
        .eq('user_id', userId)
        .single();

      setHasResume(!!(data?.resume_text?.trim()));
    };
    checkResume();
  }, [userId]);

  // Load cached analysis on open
  const loadCachedAnalysis = useCallback(async () => {
    const { data } = await supabase
      .from('job_analyses')
      .select('*')
      .eq('job_id', app.id)
      .eq('user_id', userId)
      .single();

    if (data) {
      // Use cache if analyzed within last 24 hours
      const analysedAt = new Date(data.analyzed_at);
      const ageHours = (Date.now() - analysedAt.getTime()) / 3600000;
      if (ageHours < 24) {
        setAnalysis(data);
      }
    }
  }, [app.id, userId]);

  useEffect(() => {
    loadCachedAnalysis();
  }, [loadCachedAnalysis]);

  const handleAnalyze = async (forceRefresh = false) => {
    setLoading(true);
    setError('');

    try {
      // Fetch resume
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('resume_text')
        .eq('user_id', userId)
        .single();

      if (!profile?.resume_text?.trim()) {
        setError('No resume found. Please add your resume first.');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE}/api/analyze-match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobTitle: app.job_title,
          company: app.company_name,
          jobNotes: app.notes || '',
          resumeText: profile.resume_text,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server error ${response.status}`);
      }

      const result = await response.json();

      // Save to cache
      await supabase
        .from('job_analyses')
        .upsert(
          {
            job_id: app.id,
            user_id: userId,
            match_percentage: result.match_percentage,
            missing_skills: result.missing_skills,
            suggestions: result.suggestions,
            strengths: result.strengths,
            analyzed_at: new Date().toISOString(),
          },
          { onConflict: 'job_id,user_id' }
        );

      setAnalysis(result);
    } catch (err) {
      setError(err.message || 'Analysis failed. Is the AI server running?');
    }

    setLoading(false);
  };

  const isChecking = hasResume === null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="match-modal-title"
      onClick={onClose}
    >
      <div
        className="flex flex-col w-full max-w-lg max-h-[90vh] rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-200">
          <div className="min-w-0 pr-4">
            <h2 id="match-modal-title" className="text-xl font-bold text-gray-900 truncate">
              AI Match Analysis
            </h2>
            <p className="text-sm text-gray-500 mt-0.5 truncate">
              {app.job_title} — {app.company_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* No resume warning */}
          {!isChecking && !hasResume && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
              <p className="text-sm font-medium text-amber-800">
                No resume found. Add your resume to enable AI match analysis.
              </p>
              <button
                onClick={onOpenResume}
                className="mt-2 text-sm font-semibold text-amber-700 underline hover:text-amber-900"
              >
                Add my resume →
              </button>
            </div>
          )}

          {/* No job description tip */}
          {!app.notes?.trim() && (
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
              <p className="text-xs text-blue-700">
                <strong>Tip:</strong> For a better match score, paste the job description into the
                Notes field on this application before analyzing.
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-200 border-t-emerald-600" />
              <p className="text-sm text-gray-500">Analyzing with Claude AI...</p>
            </div>
          )}

          {/* Results */}
          {!loading && analysis && (
            <>
              {/* Match Ring */}
              <div className="flex justify-center relative py-2">
                <MatchRing percentage={analysis.match_percentage} />
              </div>

              {/* Strengths */}
              {analysis.strengths?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">What aligns well</h3>
                  <ul className="space-y-1">
                    {analysis.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-emerald-500 mt-0.5 flex-shrink-0">✓</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Missing Skills */}
              {analysis.missing_skills?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Missing skills / keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.missing_skills.map((skill, i) => (
                      <Chip key={i} label={skill} color="red" />
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {analysis.suggestions?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Resume improvement suggestions</h3>
                  <ul className="space-y-2">
                    {analysis.suggestions.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-blue-400 mt-0.5 flex-shrink-0">→</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Cache note */}
              {analysis.analyzed_at && (
                <p className="text-xs text-gray-400 text-center">
                  Analyzed {new Date(analysis.analyzed_at).toLocaleString()}
                  {' · '}
                  <button
                    onClick={() => handleAnalyze(true)}
                    className="underline hover:text-gray-600"
                  >
                    Re-analyze
                  </button>
                </p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
          {!isChecking && hasResume && !loading && (
            <button
              type="button"
              onClick={() => handleAnalyze(false)}
              className="rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white hover:bg-purple-700"
            >
              {analysis ? 'Re-analyze' : 'Analyze Match'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default JobMatchModal;
