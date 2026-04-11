export const metadata = {
  title: "Mzansi BizMail | Professional Email for South African Businesses",
  description: "Manage all your .co.za emails in one fast, mobile-first workspace built for South African businesses.",
};

import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#006B3C] via-[#008C4A] to-[#00A85C]">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <svg viewBox="0 0 40 40" className="w-8 h-8">
                  <rect x="4" y="8" width="32" height="24" rx="3" fill="#006B3C"/>
                  <path d="M4 12 L20 24 L36 12" stroke="#FFB612" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-2xl font-bold text-white">Mzansi BizMail</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login" className="px-5 py-2.5 bg-white/20 text-white font-semibold rounded-lg hover:bg-white/30 transition-colors border border-white/30">
                Sign In
              </Link>
              <Link href="/setup" className="px-5 py-2.5 bg-white text-[#006B3C] font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-md">
                Get Started
              </Link>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                <span className="w-2 h-2 bg-[#FFB612] rounded-full animate-pulse"></span>
                <span className="text-white/90 text-sm font-medium">Built for South African Businesses</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Your Business Email.<br/>
                <span className="text-[#FFB612]">Finally Under Control.</span>
              </h1>
              
              <p className="text-lg md:text-xl text-white/80 mb-8 max-w-xl">
                Manage all your .co.za emails in one powerful, mobile-first workspace. 
                Connect, sync, and manage your business communications with ease.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/setup" className="inline-flex items-center justify-center px-8 py-4 bg-[#FFB612] text-[#1A1A1A] font-bold rounded-xl hover:bg-yellow-400 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                  <span>Set Up Your Email</span>
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H12" />
                  </svg>
                </Link>
                <button className="inline-flex items-center justify-center px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-all backdrop-blur-sm">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Watch Demo
                </button>
              </div>

              {/* Quick Stats */}
              <div className="flex flex-wrap gap-8 mt-12 justify-center lg:justify-start">
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">30</p>
                  <p className="text-white/60 text-sm">Day Sync</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">AES-256</p>
                  <p className="text-white/60 text-sm">Encryption</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">100%</p>
                  <p className="text-white/60 text-sm">Local Support</p>
                </div>
              </div>
            </div>

            {/* Right - Visual Preview */}
            <div className="relative hidden lg:block">
              <div className="relative">
                {/* Main App Preview */}
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden transform rotate-2 hover:rotate-0 transition-transform duration-500">
                  <div className="bg-gray-100 p-3 flex items-center gap-2 border-b">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="flex-1 bg-white rounded-md px-3 py-1 text-sm text-gray-500 ml-4">
                      Mzansi BizMail - Inbox
                    </div>
                  </div>
                  <div className="flex h-80">
                    {/* Sidebar */}
                    <div className="w-48 bg-gray-50 p-3 border-r">
                      <div className="text-xs font-bold text-green-700 mb-3">Mzansi BizMail</div>
                      <div className="space-y-1">
                        <div className="px-2 py-1.5 bg-green-100 text-green-700 text-sm rounded font-medium">Inbox</div>
                        <div className="px-2 py-1.5 text-gray-600 text-sm">Sent</div>
                        <div className="px-2 py-1.5 text-gray-600 text-sm">Drafts</div>
                      </div>
                      <div className="mt-4">
                        <div className="text-xs font-semibold text-gray-500 mb-2">Accounts</div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="w-2 h-2 rounded-full bg-green-600"></span>
                            <span className="text-gray-700">info@biz.co.za</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                            <span className="text-gray-700">sales@co.za</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Email List */}
                    <div className="flex-1 p-2">
                      <div className="space-y-1">
                        <div className="flex gap-2 p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100">
                          <div className="w-1 bg-green-600 rounded-full"></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between">
                              <span className="font-medium text-sm text-gray-900">John @ Company</span>
                              <span className="text-xs text-gray-400">10:45</span>
                            </div>
                            <p className="text-sm font-medium text-gray-800 truncate">Invoice Ready</p>
                            <p className="text-xs text-gray-500 truncate">Your invoice has been generated...</p>
                          </div>
                        </div>
                        <div className="flex gap-2 p-2 rounded cursor-pointer hover:bg-gray-50">
                          <div className="w-1 bg-yellow-500 rounded-full"></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between">
                              <span className="font-medium text-sm text-gray-900">Sarah @ Sales</span>
                              <span className="text-xs text-gray-400">09:30</span>
                            </div>
                            <p className="text-sm font-medium text-gray-800 truncate">Meeting Notes</p>
                            <p className="text-xs text-gray-500 truncate">Here are the notes from today...</p>
                          </div>
                        </div>
                        <div className="flex gap-2 p-2 rounded cursor-pointer hover:bg-gray-50">
                          <div className="w-1 bg-blue-500 rounded-full"></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between">
                              <span className="font-medium text-sm text-gray-900">Support Team</span>
                              <span className="text-xs text-gray-400">Yesterday</span>
                            </div>
                            <p className="text-sm font-medium text-gray-800 truncate">Ticket Update</p>
                            <p className="text-xs text-gray-500 truncate">Your support ticket has been...</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute -left-8 top-1/4 bg-white rounded-xl shadow-lg p-4 transform -rotate-3 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-xl">✓</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">30-Day Sync</p>
                      <p className="text-xs text-gray-500">Rolling mirror</p>
                    </div>
                  </div>
                </div>

                <div className="absolute -right-6 bottom-1/4 bg-white rounded-xl shadow-lg p-4 transform rotate-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                      <span className="text-xl">🔐</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">Secure</p>
                      <p className="text-xs text-gray-500">AES-256 Encrypted</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Features Section */}
        <section className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Mzansi BizMail?</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Built specifically for South African businesses to handle the unique challenges of local email hosting.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="group p-6 rounded-2xl border border-gray-100 hover:border-green-200 hover:shadow-xl transition-all bg-gradient-to-b from-white to-green-50/30">
                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-600 transition-colors">
                  <svg className="w-7 h-7 text-green-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Fast Sync</h3>
                <p className="text-gray-600">30-day rolling mirror with instant synchronization. Never miss an important email again.</p>
              </div>

              <div className="group p-6 rounded-2xl border border-gray-100 hover:border-yellow-200 hover:shadow-xl transition-all bg-gradient-to-b from-white to-yellow-50/30">
                <div className="w-14 h-14 bg-yellow-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-yellow-500 transition-colors">
                  <svg className="w-7 h-7 text-yellow-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Smart Inbox</h3>
                <p className="text-gray-600">Unified view across all your accounts. Color-coded organization with instant switching.</p>
              </div>

              <div className="group p-6 rounded-2xl border border-gray-100 hover:border-red-200 hover:shadow-xl transition-all bg-gradient-to-b from-white to-red-50/30">
                <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-red-500 transition-colors">
                  <svg className="w-7 h-7 text-red-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Bank-Level Security</h3>
                <p className="text-gray-600">AES-256 encryption for all credentials. Your data never leaves our secure servers.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Local Edge Section */}
        <section className="bg-gradient-to-r from-[#006B3C] to-[#008C4A] py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-white mb-4">Made for South Africa</h2>
              <p className="text-white/80 max-w-2xl mx-auto">
                Optimized for local hosting providers and .co.za domains
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 text-center">
                <div className="text-4xl mb-3">🏠</div>
                <h3 className="font-semibold text-white mb-1">cPanel Support</h3>
                <p className="text-white/70 text-sm">Works with major SA hosts</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 text-center">
                <div className="text-4xl mb-3">🌍</div>
                <h3 className="font-semibold text-white mb-1">.co.za Domains</h3>
                <p className="text-white/70 text-sm">Native handling</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 text-center">
                <div className="text-4xl mb-3">📡</div>
                <h3 className="font-semibold text-white mb-1">Low Bandwidth</h3>
                <p className="text-white/70 text-sm">Fast on slow connections</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 text-center">
                <div className="text-4xl mb-3">💬</div>
                <h3 className="font-semibold text-white mb-1">Local Support</h3>
                <p className="text-white/70 text-sm">English & Zulu support</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-[#FFB612] py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-4">
              Ready to take control?
            </h2>
            <p className="text-lg text-[#1A1A1A]/80 mb-8">
              Set up your business email in minutes. No credit card required.
            </p>
            <Link href="/setup" className="inline-flex items-center px-8 py-4 bg-[#006B3C] text-white font-bold rounded-xl hover:bg-green-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
              Start Free Setup
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H12" />
              </svg>
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-[#1A1A1A] py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <svg viewBox="0 0 40 40" className="w-6 h-6">
                    <rect x="4" y="8" width="32" height="24" rx="3" fill="#006B3C"/>
                    <path d="M4 12 L20 24 L36 12" stroke="#FFB612" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-white font-semibold">Mzansi BizMail</span>
              </div>
              <div className="flex gap-6 text-gray-400">
                <a href="#" className="hover:text-white transition-colors">Privacy</a>
                <a href="#" className="hover:text-white transition-colors">Terms</a>
                <a href="#" className="hover:text-white transition-colors">Contact</a>
              </div>
              <p className="text-gray-500 text-sm">© 2024 Mzansi BizMail. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}