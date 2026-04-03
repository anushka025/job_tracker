import React from 'react';
import { Link } from 'react-router-dom';

function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                JobTracker Pro
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Link 
                to="/login" 
                className="px-4 py-2 text-gray-700 font-medium hover:text-gray-900 transition"
              >
                Log in
              </Link>
              <Link 
                to="/signup" 
                className="px-6 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 shadow-sm transition"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-block mb-4">
            <span className="px-4 py-2 bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-full">
              🚀 Free Forever • No Credit Card Required
            </span>
          </div>
          
          <h2 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
            Land Your Dream Job
            <br />
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              With Smart Tracking
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Ditch the spreadsheets. Auto-import applications from Gmail, 
            track every interview, and organize your entire job search in one beautiful dashboard.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link 
              to="/signup" 
              className="px-8 py-4 bg-emerald-600 text-white text-lg font-semibold rounded-xl hover:bg-emerald-700 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
            >
              Start Tracking Free →
            </Link>
            <a 
              href="#features"
              className="px-8 py-4 bg-white text-gray-700 text-lg font-semibold rounded-xl border-2 border-gray-300 hover:border-emerald-500 hover:text-emerald-600 transition-all"
            >
              See How It Works
            </a>
          </div>

          <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
              <span>No installation needed</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
              <span>Setup in 2 minutes</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-white">
        <div className="text-center mb-16">
          <h3 className="text-4xl font-bold text-gray-900 mb-4">
            Everything You Need to Get Hired Faster
          </h3>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Built by job seekers, for job seekers. No fluff, just features that actually help.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="group p-8 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 hover:shadow-xl transition-all duration-300 border border-emerald-100">
            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center mb-5 shadow-sm group-hover:scale-110 transition-transform">
              <span className="text-3xl">📧</span>
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-3">
              Gmail Auto-Import
            </h4>
            <p className="text-gray-700 leading-relaxed">
              Connect once, never log applications manually again. We auto-capture confirmations from LinkedIn, Indeed, and 50+ job boards.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="group p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-xl transition-all duration-300 border border-blue-100">
            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center mb-5 shadow-sm group-hover:scale-110 transition-transform">
              <span className="text-3xl">📊</span>
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-3">
              Kanban Pipeline View
            </h4>
            <p className="text-gray-700 leading-relaxed">
              Drag & drop applications between Applied, Interview, Offer, and Rejected. See your entire pipeline at a glance.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="group p-8 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-xl transition-all duration-300 border border-purple-100">
            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center mb-5 shadow-sm group-hover:scale-110 transition-transform">
              <span className="text-3xl">🎯</span>
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-3">
              Smart Reminders
            </h4>
            <p className="text-gray-700 leading-relaxed">
              Never miss a follow-up. Get notified for interviews, application deadlines, and companies that haven't responded.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="group p-8 rounded-2xl bg-gradient-to-br from-orange-50 to-red-50 hover:shadow-xl transition-all duration-300 border border-orange-100">
            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center mb-5 shadow-sm group-hover:scale-110 transition-transform">
              <span className="text-3xl">📈</span>
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-3">
              Success Analytics
            </h4>
            <p className="text-gray-700 leading-relaxed">
              Track response rates, interview conversion, and time-to-hire. Optimize your strategy with real data.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="group p-8 rounded-2xl bg-gradient-to-br from-yellow-50 to-amber-50 hover:shadow-xl transition-all duration-300 border border-yellow-100">
            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center mb-5 shadow-sm group-hover:scale-110 transition-transform">
              <span className="text-3xl">🔒</span>
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-3">
              Bank-Level Security
            </h4>
            <p className="text-gray-700 leading-relaxed">
              End-to-end encryption, row-level security, and GDPR compliance. Your job search stays 100% private.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="group p-8 rounded-2xl bg-gradient-to-br from-cyan-50 to-sky-50 hover:shadow-xl transition-all duration-300 border border-cyan-100">
            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center mb-5 shadow-sm group-hover:scale-110 transition-transform">
              <span className="text-3xl">⚡</span>
            </div>
            <h4 className="text-xl font-bold text-gray-900 mb-3">
              Lightning Fast
            </h4>
            <p className="text-gray-700 leading-relaxed">
              Real-time sync across devices. Works offline. Built on cutting-edge tech for instant updates.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 py-20">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h3 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Your Next Job Starts Here
          </h3>
          <p className="text-xl text-emerald-100 mb-10 leading-relaxed">
            Join thousands of job seekers who landed their dream role 3x faster with JobTracker Pro
          </p>
          <Link 
            to="/signup" 
            className="inline-block px-10 py-5 bg-white text-emerald-600 text-lg font-bold rounded-xl hover:bg-gray-50 shadow-2xl transition-all transform hover:-translate-y-1"
          >
            Get Started Free — No Credit Card →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-xl font-bold text-white">JobTracker Pro</p>
              <p className="text-sm mt-1">The smart way to track your job search</p>
            </div>
            <div className="flex gap-6">
              <a href="#privacy" className="hover:text-white transition">Privacy</a>
              <a href="#terms" className="hover:text-white transition">Terms</a>
              <a href="#contact" className="hover:text-white transition">Contact</a>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>© 2026 JobTracker Pro</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;