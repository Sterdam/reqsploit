import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Zap, Brain, Code, CheckCircle, ArrowRight, Menu, X, Chrome, Download } from 'lucide-react';

export function Landing() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A1929] via-[#0D1F33] to-[#0A1929]">
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-[#0A1929]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Shield className="w-8 h-8 text-blue-500" />
              <span className="text-xl font-bold text-white">Req<span className="text-cyber-green">Sploit</span></span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-300 hover:text-white transition">Features</a>
              <a href="#pricing" className="text-gray-300 hover:text-white transition">Pricing</a>
              <a href="#extension" className="text-gray-300 hover:text-white transition">Extension</a>
              <Link to="/docs" className="text-gray-300 hover:text-white transition">Docs</Link>
              <Link to="/login" className="text-gray-300 hover:text-white transition">Login</Link>
              <Link
                to="/register"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition font-medium"
              >
                Get Started
              </Link>
            </div>
            <button
              className="md:hidden text-gray-300 hover:text-white p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-white/10 py-4 space-y-3">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-gray-300 hover:text-white transition px-2 py-2">Features</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block text-gray-300 hover:text-white transition px-2 py-2">Pricing</a>
              <a href="#extension" onClick={() => setMobileMenuOpen(false)} className="block text-gray-300 hover:text-white transition px-2 py-2">Extension</a>
              <Link to="/docs" onClick={() => setMobileMenuOpen(false)} className="block text-gray-300 hover:text-white transition px-2 py-2">Docs</Link>
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="block text-gray-300 hover:text-white transition px-2 py-2">Login</Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition font-medium text-center"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 blur-3xl"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center space-x-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 mb-8">
              <Zap className="w-4 h-4 text-blue-400" />
              <span className="text-blue-300 text-sm font-medium">AI-Powered Penetration Testing</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              The Future of
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent"> Pentest</span>
            </h1>

            <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
              Professional web security toolkit with Claude AI assistant. Intercept traffic, detect vulnerabilities,
              and guide your pentesting in real-time.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg transition font-semibold text-lg inline-flex items-center justify-center group"
              >
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition" />
              </Link>
              <a
                href="#features"
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-4 rounded-lg transition font-semibold text-lg"
              >
                Learn More
              </a>
            </div>

            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>10,000 free AI tokens</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Setup in 3 minutes</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-[#0D1F33]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Why ReqSploit?</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Modern pentesting requires modern tools. Say goodbye to Burp Suite complexity.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-6">
                <Brain className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">AI Assistant</h3>
              <p className="text-gray-400 leading-relaxed mb-4">
                Claude AI analyzes every request/response in real-time. Get instant vulnerability
                detection, exploit suggestions, and guided pentesting.
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Automatic SQLi, XSS detection
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Context-aware suggestions
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Educational explanations
                </li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Zero Friction</h3>
              <p className="text-gray-400 leading-relaxed mb-4">
                Setup in 3 clicks. Install extension, download certificate, start intercepting.
                No complex configuration, no steep learning curve.
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  One-click proxy config
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Auto SSL certificate
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Modern web interface
                </li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-6">
                <Code className="w-6 h-6 text-cyber-green" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Professional Grade</h3>
              <p className="text-gray-400 leading-relaxed mb-4">
                Full interception capabilities with request modification, repeater, history, and real-time
                WebSocket communication. Everything you need for serious pentesting.
              </p>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Request/Response editor
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  Traffic filtering
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  History & export
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Chrome Extension Section */}
      <section id="extension" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-white/10 rounded-3xl p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 mb-6">
                  <Chrome className="w-4 h-4 text-blue-400" />
                  <span className="text-blue-300 text-sm font-medium">Chrome Extension</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Get the ReqSploit Extension
                </h2>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  The Chrome extension captures all HTTP traffic directly from your browser using Chrome DevTools Protocol.
                  No proxy setup, no certificate installation — just install and start pentesting.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href="/reqsploit-extension-v2.1.0.zip"
                    download
                    className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition font-semibold group"
                  >
                    <Download className="w-5 h-5" />
                    Download Extension v2.1
                  </a>
                  <Link
                    to="/docs"
                    className="inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-3 rounded-lg transition font-semibold"
                  >
                    Installation Guide
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-4 bg-white/5 rounded-xl p-4 border border-white/10">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 text-sm font-bold flex items-center justify-center border border-blue-600/30">1</span>
                  <div>
                    <p className="text-white font-medium">Download & Unzip</p>
                    <p className="text-gray-400 text-sm">Download the zip file and extract it to a folder</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 bg-white/5 rounded-xl p-4 border border-white/10">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 text-sm font-bold flex items-center justify-center border border-blue-600/30">2</span>
                  <div>
                    <p className="text-white font-medium">Load in Chrome</p>
                    <p className="text-gray-400 text-sm">Go to <code className="text-blue-300 bg-white/10 px-1 rounded">chrome://extensions</code>, enable Developer mode, click "Load unpacked"</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 bg-white/5 rounded-xl p-4 border border-white/10">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 text-sm font-bold flex items-center justify-center border border-blue-600/30">3</span>
                  <div>
                    <p className="text-white font-medium">Start Pentesting</p>
                    <p className="text-gray-400 text-sm">Log in on the dashboard, start a session, and browse your target</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Start free. Upgrade when you need more. No hidden fees.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* FREE Plan */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-blue-500/50 transition">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-white">$0</span>
                  <span className="text-gray-400">/month</span>
                </div>
              </div>
              <p className="text-gray-400 mb-6">Perfect for getting started</p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">10,000 AI tokens/month</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">Manual analysis only</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">7-day history</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">1 session</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">Community support</span>
                </li>
              </ul>
              <Link
                to="/register"
                className="block w-full bg-white/10 hover:bg-white/20 text-white text-center py-3 rounded-lg transition font-semibold"
              >
                Get Started
              </Link>
            </div>

            {/* PRO Plan */}
            <div className="bg-gradient-to-b from-blue-600/20 to-purple-600/20 backdrop-blur-sm border-2 border-blue-500 rounded-2xl p-8 relative transform scale-105">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </div>
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-white">$29</span>
                  <span className="text-gray-400">/month</span>
                </div>
              </div>
              <p className="text-gray-400 mb-6">For professional pentesters</p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">100,000 AI tokens/month</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">Auto background analysis</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">90-day history</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">5 simultaneous sessions</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">Export reports (PDF/JSON)</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">Priority support</span>
                </li>
              </ul>
              <Link
                to="/register?plan=pro"
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-3 rounded-lg transition font-semibold"
              >
                Start Pro Trial
              </Link>
            </div>

            {/* ENTERPRISE Plan */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-purple-500/50 transition">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Enterprise</h3>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-bold text-white">$99</span>
                  <span className="text-gray-400">/month</span>
                </div>
              </div>
              <p className="text-gray-400 mb-6">For security teams</p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">500,000 AI tokens/month</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">Unlimited sessions</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">Unlimited history</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">Team collaboration</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">Custom AI prompts</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">API access</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">SSO/SAML</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">Dedicated support</span>
                </li>
              </ul>
              <Link
                to="/register?plan=enterprise"
                className="block w-full bg-white/10 hover:bg-white/20 text-white text-center py-3 rounded-lg transition font-semibold"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Level Up Your Pentesting?</h2>
          <p className="text-xl text-gray-300 mb-8">
            Join hundreds of pentesters using AI to find vulnerabilities faster.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg transition font-semibold text-lg group"
          >
            Start Free Trial
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-[#0A1929]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Shield className="w-6 h-6 text-blue-500" />
                <span className="text-lg font-bold text-white">Req<span className="text-cyber-green">Sploit</span></span>
              </div>
              <p className="text-gray-400 text-sm">
                Web security testing platform with AI assistant for professional penetration testing.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#extension" className="hover:text-white transition">Chrome Extension</a></li>
                <li><Link to="/docs" className="hover:text-white transition">Documentation</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Get Started</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link to="/register" className="hover:text-white transition">Create Account</Link></li>
                <li><Link to="/login" className="hover:text-white transition">Sign In</Link></li>
                <li><Link to="/pricing" className="hover:text-white transition">View Plans</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><span className="text-gray-500 cursor-default">Privacy Policy</span></li>
                <li><span className="text-gray-500 cursor-default">Terms of Service</span></li>
                <li><span className="text-gray-500 cursor-default">Security</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; {new Date().getFullYear()} ReqSploit. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
