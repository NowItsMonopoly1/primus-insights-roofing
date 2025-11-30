import Link from 'next/link'
import { SignInButton, SignUpButton } from '@clerk/nextjs'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">Primus Home Pro</h1>
            </div>
            <div className="flex gap-4">
              <SignInButton mode="modal">
                <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                  Get Started
                </button>
              </SignUpButton>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            AI-Powered CRM for Home Service Professionals
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Capture leads, automate follow-ups, and manage your roofing, HVAC, or solar business—all in one platform.
          </p>
          <div className="flex gap-4 justify-center">
            <SignUpButton mode="modal">
              <button className="px-8 py-4 text-lg font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-lg">
                Start Free Trial
              </button>
            </SignUpButton>
            <Link href="/templates/simple">
              <button className="px-8 py-4 text-lg font-semibold text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:border-gray-400">
                View Demo
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-white">
        <h2 className="text-3xl font-bold text-center mb-12">Everything You Need to Scale</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 border rounded-lg">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Lead Capture</h3>
            <p className="text-gray-600">High-conversion landing pages that turn visitors into qualified leads automatically.</p>
          </div>

          <div className="p-6 border rounded-lg">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">AI Automation</h3>
            <p className="text-gray-600">AI-powered lead scoring, intent detection, and automated follow-up sequences.</p>
          </div>

          <div className="p-6 border rounded-lg">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Smart CRM</h3>
            <p className="text-gray-600">Track every lead interaction with timeline views and AI-powered insights.</p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Simple, Transparent Pricing</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {/* Free */}
          <div className="border rounded-lg p-8">
            <h3 className="text-2xl font-bold mb-2">Free</h3>
            <p className="text-gray-600 mb-4">For getting started</p>
            <p className="text-4xl font-bold mb-6">$0<span className="text-lg text-gray-600">/mo</span></p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                50 leads/month
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                1 automation
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Basic AI analysis
              </li>
            </ul>
            <SignUpButton mode="modal">
              <button className="w-full px-4 py-2 text-center font-semibold text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50">
                Start Free
              </button>
            </SignUpButton>
          </div>

          {/* Pro */}
          <div className="border-2 border-blue-600 rounded-lg p-8 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
              Most Popular
            </div>
            <h3 className="text-2xl font-bold mb-2">Pro</h3>
            <p className="text-gray-600 mb-4">For solo operators</p>
            <p className="text-4xl font-bold mb-6">$48<span className="text-lg text-gray-600">/mo</span></p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                1,000 leads/month
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Unlimited automations
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Advanced AI features
              </li>
            </ul>
            <SignUpButton mode="modal">
              <button className="w-full px-4 py-2 text-center font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                Start Trial
              </button>
            </SignUpButton>
          </div>

          {/* Agency */}
          <div className="border rounded-lg p-8">
            <h3 className="text-2xl font-bold mb-2">Agency</h3>
            <p className="text-gray-600 mb-4">For scaling businesses</p>
            <p className="text-4xl font-bold mb-6">$148<span className="text-lg text-gray-600">/mo</span></p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Unlimited leads
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Unlimited automations
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Priority support
              </li>
            </ul>
            <SignUpButton mode="modal">
              <button className="w-full px-4 py-2 text-center font-semibold text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50">
                Start Trial
              </button>
            </SignUpButton>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 text-white py-20">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold mb-6">Ready to Scale Your Home Service Business?</h2>
          <p className="text-xl mb-8 opacity-90">Join contractors who are closing more deals with AI-powered automation.</p>
          <SignUpButton mode="modal">
            <button className="px-8 py-4 text-lg font-semibold text-blue-600 bg-white rounded-lg hover:bg-gray-100 shadow-lg">
              Get Started Free
            </button>
          </SignUpButton>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>&copy; 2025 Primus Home Pro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
