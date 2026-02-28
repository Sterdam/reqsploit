import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import {
  ArrowLeft,
  Chrome,
  Download,
  Shield,
  Zap,
  Globe,
  Lock,
  Wifi,
  CheckCircle,
  ArrowRight,
  Monitor,
  Settings,
} from 'lucide-react';

const EXTENSION_VERSION = '2.1.1';
const EXTENSION_FILE = `/reqsploit-extension-v${EXTENSION_VERSION}.zip`;

export function Extension() {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A1929] via-[#0D1F33] to-[#0A1929]">
      {/* Top Navigation */}
      <nav className="border-b border-white/10 bg-[#0A1929]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-4">
              <Link
                to={user ? '/dashboard' : '/'}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{user ? 'Dashboard' : 'Home'}</span>
              </Link>
              <div className="h-5 w-px bg-white/20" />
              <div className="flex items-center gap-2">
                <Chrome className="w-4 h-4 text-blue-400" />
                <span className="text-white font-semibold">Chrome Extension</span>
              </div>
            </div>
            {!user && (
              <Link
                to="/register"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg transition text-sm font-medium"
              >
                Get Started
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 blur-3xl" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 relative">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 mb-6">
              <Chrome className="w-5 h-5 text-blue-400" />
              <span className="text-blue-300 text-sm font-medium">Chrome Extension v{EXTENSION_VERSION}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              ReqSploit <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Extension</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              Capture all HTTP traffic directly from your browser. No proxy, no certificate
              — powered by Chrome DevTools Protocol.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={EXTENSION_FILE}
                download
                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg transition font-semibold text-lg group"
              >
                <Download className="w-5 h-5" />
                Download v{EXTENSION_VERSION}
              </a>
              <a
                href="#install"
                className="inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-4 rounded-lg transition font-semibold text-lg"
              >
                How to Install
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
            <p className="mt-4 text-sm text-gray-500">
              Free &middot; Open source &middot; Manifest V3 &middot; 33 KB
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-[#0D1F33]/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-12">What it does</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Globe, title: 'HTTP Traffic Capture', desc: 'Intercepts all requests and responses via Chrome DevTools Protocol (CDP).' },
              { icon: Zap, title: 'Real-time Streaming', desc: 'Traffic is streamed instantly to your ReqSploit dashboard via WebSocket.' },
              { icon: Shield, title: 'AI Analysis', desc: 'Every captured request can be analyzed by Claude AI for vulnerabilities.' },
              { icon: Lock, title: 'HTTPS Support', desc: 'Full TLS traffic visibility without installing any root certificate.' },
              { icon: Wifi, title: 'Zero Config', desc: 'No proxy settings to configure. Install and it works immediately.' },
              { icon: Monitor, title: 'Popup Dashboard', desc: 'Quick controls, session status, and live stats right from the popup.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition">
                <Icon className="w-8 h-8 text-blue-400 mb-3" />
                <h3 className="text-white font-semibold mb-2">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Installation Guide */}
      <section id="install" className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-4">Installation Guide</h2>
          <p className="text-gray-400 text-center mb-12 max-w-xl mx-auto">
            Install in under 2 minutes. No Chrome Web Store needed — load directly as a developer extension.
          </p>

          <div className="space-y-6">
            {/* Step 1 */}
            <div className="flex gap-5">
              <div className="flex-shrink-0">
                <span className="w-10 h-10 rounded-full bg-blue-600 text-white text-lg font-bold flex items-center justify-center">1</span>
              </div>
              <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-white font-semibold text-lg mb-2">Download the Extension</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Click the button below to download the extension zip file, then extract it to a folder on your computer.
                </p>
                <a
                  href={EXTENSION_FILE}
                  download
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg transition font-medium text-sm"
                >
                  <Download className="w-4 h-4" />
                  Download reqsploit-extension-v{EXTENSION_VERSION}.zip
                </a>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-5">
              <div className="flex-shrink-0">
                <span className="w-10 h-10 rounded-full bg-blue-600 text-white text-lg font-bold flex items-center justify-center">2</span>
              </div>
              <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-white font-semibold text-lg mb-2">Open Chrome Extensions</h3>
                <p className="text-gray-400 text-sm mb-3">
                  Navigate to the extensions management page in Chrome:
                </p>
                <div className="bg-[#0A1929] border border-white/10 rounded-lg px-4 py-3 font-mono text-blue-300 text-sm mb-3 select-all">
                  chrome://extensions
                </div>
                <p className="text-gray-400 text-sm">
                  Then enable <span className="text-white font-medium">Developer mode</span> using the toggle in the top-right corner.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-5">
              <div className="flex-shrink-0">
                <span className="w-10 h-10 rounded-full bg-blue-600 text-white text-lg font-bold flex items-center justify-center">3</span>
              </div>
              <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-white font-semibold text-lg mb-2">Load the Extension</h3>
                <p className="text-gray-400 text-sm">
                  Click <span className="text-white font-medium">"Load unpacked"</span> and select the folder where you extracted the zip.
                  The ReqSploit extension icon will appear in your toolbar.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex gap-5">
              <div className="flex-shrink-0">
                <span className="w-10 h-10 rounded-full bg-cyber-green text-white text-lg font-bold flex items-center justify-center">4</span>
              </div>
              <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="text-white font-semibold text-lg mb-2">Start Pentesting</h3>
                <p className="text-gray-400 text-sm mb-3">
                  Log in to your <Link to={user ? '/dashboard' : '/register'} className="text-blue-400 hover:text-blue-300 underline">{user ? 'dashboard' : 'ReqSploit account'}</Link>,
                  click the extension icon, hit <span className="text-white font-medium">"Start Session"</span>, and browse your target.
                  All traffic appears in real-time on the dashboard.
                </p>
                <div className="flex items-center gap-2 text-cyber-green text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>You're all set!</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Configuration */}
      <section className="py-16 bg-[#0D1F33]/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <Settings className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold text-white">Configuration</h2>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <p className="text-gray-300 mb-4 text-sm leading-relaxed">
              The extension connects to <code className="text-blue-300 bg-white/10 px-1.5 py-0.5 rounded text-xs">https://reqsploit.com</code> by default.
              If you're running a self-hosted instance, you can configure the backend URL from the extension popup settings.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-[#0A1929] border border-white/10 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Backend URL</p>
                <p className="text-sm text-white font-mono">https://reqsploit.com</p>
              </div>
              <div className="bg-[#0A1929] border border-white/10 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Dashboard URL</p>
                <p className="text-sm text-white font-mono">https://reqsploit.com</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Requirements</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="text-center bg-white/5 border border-white/10 rounded-xl p-6">
              <Chrome className="w-8 h-8 text-blue-400 mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-1">Google Chrome</h3>
              <p className="text-gray-400 text-sm">Version 116 or higher</p>
            </div>
            <div className="text-center bg-white/5 border border-white/10 rounded-xl p-6">
              <Shield className="w-8 h-8 text-blue-400 mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-1">ReqSploit Account</h3>
              <p className="text-gray-400 text-sm">Free plan works</p>
            </div>
            <div className="text-center bg-white/5 border border-white/10 rounded-xl p-6">
              <Wifi className="w-8 h-8 text-blue-400 mx-auto mb-3" />
              <h3 className="text-white font-semibold mb-1">Internet Connection</h3>
              <p className="text-gray-400 text-sm">For WebSocket streaming</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to start?</h2>
          <p className="text-gray-300 mb-8">
            Download the extension, create a free account, and start intercepting traffic in minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={EXTENSION_FILE}
              download
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg transition font-semibold text-lg"
            >
              <Download className="w-5 h-5" />
              Download Extension
            </a>
            {!user && (
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-4 rounded-lg transition font-semibold text-lg"
              >
                Create Free Account
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#0A1929] py-8">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} ReqSploit. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
