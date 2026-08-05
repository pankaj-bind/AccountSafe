import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CategoryManager } from '../features/vault/components';

const FAQ_ITEMS = [
  {
    question: 'What exactly does AccountSafe protect?',
    answer: 'AccountSafe stores your passwords, recovery keys, and shared secrets in a zero-knowledge vault. Your data is encrypted with AES-256-GCM and keyed with Argon2id before it ever leaves your device, so even we cannot read it.',
  },
  {
    question: 'Is my data visible to the AccountSafe team?',
    answer: 'No. AccountSafe uses a zero-knowledge architecture — encryption happens entirely in your browser. The server only ever stores ciphertext, so there is nothing sensitive to leak even if a breach occurs.',
  },
  {
    question: 'What happens if I lose my master password?',
    answer: 'Because your vault is zero-knowledge, the master password is the only key. Recovery keys and session monitoring are designed to help you regain access, but no one — including support — can reset your vault for you.',
  },
  {
    question: 'Does AccountSafe work on mobile?',
    answer: 'Yes. The vault, panic lock, and session monitor are fully responsive and work across desktop, tablet, and mobile browsers.',
  },
  {
    question: 'Is AccountSafe open source?',
    answer: 'Yes. The source is public and auditable, so security researchers can verify the encryption, key derivation, and session handling themselves.',
  },
];

const TESTIMONIALS = [
  {
    name: 'Priya S.',
    role: 'Security Engineer',
    quote: 'The panic lock and breach warnings alone are worth it. I finally feel like my credentials are mine again.',
  },
  {
    name: 'Arjun M.',
    role: 'DevOps Lead',
    quote: 'Sharing secrets with my team used to mean plaintext chats. AccountSafe made shared vaults painless and auditable.',
  },
  {
    name: 'Neha K.',
    role: 'Product Manager',
    quote: 'I moved three vaults over in an afternoon. The session monitor even caught an old device I had forgotten about.',
  },
];

const FEATURES = [
  {
    title: 'Zero-Knowledge Vault',
    description: 'Ciphertext-only storage — your passwords are encrypted in the browser with AES-256-GCM before upload.',
  },
  {
    title: 'Argon2id Key Derivation',
    description: 'Industry-standard memory-hard KDF resists brute force and GPU cracking on the master password.',
  },
  {
    title: 'Session Monitoring',
    description: 'See every active device, revoke sessions remotely, and get alerted the moment something looks off.',
  },
  {
    title: 'Panic Lock',
    description: 'Lock your vault instantly from any device, with breach warnings that surface compromised credentials.',
  },
  {
    title: 'Shared Secrets',
    description: 'Share credentials and secrets with your team without ever exposing them in chat or email.',
  },
  {
    title: 'Managed Security',
    description: 'Duplicate-password detection, breach monitoring, and recovery keys bundled into one dashboard.',
  },
];

const StatsBand = () => (
  <div className="mx-auto max-w-3xl px-4">
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-8 border-y border-zinc-200 dark:border-zinc-800 text-center">
      <div>
        <div className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white">AES-256</div>
        <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">GCM Encryption</div>
      </div>
      <div>
        <div className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white">Argon2id</div>
        <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">Key Derivation</div>
      </div>
      <div>
        <div className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white">100%</div>
        <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">Zero-Knowledge</div>
      </div>
      <div>
        <div className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white">Open</div>
        <div className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">Source & Auditable</div>
      </div>
    </div>
  </div>
);

const FeaturesGrid = () => (
  <section id="features" className="py-14 sm:py-20">
    <div className="mx-auto max-w-6xl px-4">
      <h2 className="text-2xl sm:text-3xl font-bold text-center text-zinc-900 dark:text-white mb-3">
        Everything a modern vault should be
      </h2>
      <p className="text-sm sm:text-base text-center text-zinc-600 dark:text-zinc-400 mb-10 max-w-xl mx-auto">
        Built for people who treat credentials like the keys to their digital life.
      </p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {FEATURES.map((feature) => (
          <div
            key={feature.title}
            className="p-5 sm:p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 hover:border-blue-400 dark:hover:border-blue-500/60 hover:-translate-y-0.5 transition-all duration-200"
          >
            <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">{feature.title}</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const Testimonials = () => (
  <section className="py-14 sm:py-20 bg-zinc-50 dark:bg-zinc-900/40">
    <div className="mx-auto max-w-6xl px-4">
      <h2 className="text-2xl sm:text-3xl font-bold text-center text-zinc-900 dark:text-white mb-3">
        Trusted by people who care about security
      </h2>
      <p className="text-sm sm:text-base text-center text-zinc-600 dark:text-zinc-400 mb-10 max-w-xl mx-auto">
        Real workflows, real protection.
      </p>
      <div className="grid sm:grid-cols-3 gap-4 sm:gap-6">
        {TESTIMONIALS.map((t) => (
          <figure
            key={t.name}
            className="p-5 sm:p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 flex flex-col"
          >
            <div className="flex gap-0.5 text-amber-400 mb-3" aria-label="5 out of 5 stars">
              {'★★★★★'}
            </div>
            <blockquote className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed flex-1">
              “{t.quote}”
            </blockquote>
            <figcaption className="mt-4">
              <div className="font-semibold text-sm text-zinc-900 dark:text-white">{t.name}</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">{t.role}</div>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  </section>
);

const FaqSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-14 sm:py-20">
      <div className="mx-auto max-w-3xl px-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-zinc-900 dark:text-white mb-3">
          Frequently asked questions
        </h2>
        <p className="text-sm sm:text-base text-center text-zinc-600 dark:text-zinc-400 mb-10">
          Everything you need to know about your vault.
        </p>
        <div className="space-y-3">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={item.question}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 overflow-hidden"
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${index}`}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left text-sm sm:text-base font-medium text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  {item.question}
                  <svg
                    className={`w-5 h-5 shrink-0 text-zinc-500 dark:text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div
                  id={`faq-panel-${index}`}
                  role="region"
                  className={`grid transition-all duration-200 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-4 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const FinalCta = () => (
  <section className="py-14 sm:py-20">
    <div className="mx-auto max-w-4xl px-4">
      <div className="rounded-2xl p-8 sm:p-12 text-center bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-xl shadow-blue-500/25">
        <h2 className="text-2xl sm:text-3xl font-bold mb-3">Take control of your credentials</h2>
        <p className="text-blue-50 text-sm sm:text-base mb-8 max-w-lg mx-auto">
          Your vault, your keys, your rules. Set up in under two minutes — no credit card required.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Link
            to="/register"
            className="px-6 sm:px-8 py-3 text-sm font-medium text-blue-600 bg-white hover:bg-blue-50 rounded-lg transition-colors shadow-lg"
          >
            Create free account
          </Link>
          <Link
            to="/login"
            className="px-6 sm:px-8 py-3 text-sm font-medium text-white bg-blue-700/40 hover:bg-blue-700/60 border border-blue-300/40 rounded-lg transition-colors"
          >
            Log in to your vault
          </Link>
        </div>
      </div>
    </div>
  </section>
);

const HomePage: React.FC = () => {
  const { token } = useAuth();

  return (
    <div className="min-h-screen bg-white dark:bg-[#09090b]">
      {token ? (
        <CategoryManager />
      ) : (
        <>
          <div className="flex items-start sm:items-center justify-center min-h-screen px-4 py-8 pt-8 sm:pt-0">
            <div className="text-center max-w-2xl mx-auto">
              {/* Hero Icon */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 sm:mb-8 flex items-center justify-center">
                <div className="p-2 sm:p-2.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg sm:rounded-xl border border-emerald-200 dark:border-emerald-500/20 overflow-hidden">
                  <img src="/logo.png" alt="AccountSafe" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />
                </div>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-zinc-900 dark:text-white mb-3 sm:mb-4 px-4">
                Welcome to <span className="text-blue-500 dark:text-blue-400">AccountSafe</span>
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-zinc-600 dark:text-zinc-400 mb-8 sm:mb-10 max-w-xl mx-auto px-4">
                Protected by AES-256-GCM authenticated encryption with Argon2id key derivation. Our zero-knowledge architecture ensures your data is encrypted securely at rest
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
                <Link
                  to="/login"
                  className="px-6 sm:px-8 py-3 sm:py-3.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
                >
                  Log in to your vault
                </Link>
                <Link
                  to="/register"
                  className="px-6 sm:px-8 py-3 sm:py-3.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all"
                >
                  Create free account
                </Link>
                <a
                  href="#features"
                  className="px-6 sm:px-8 py-3 sm:py-3.5 text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                >
                  Learn more ↓
                </a>
              </div>

              {/* Trust indicators */}
              <div className="mt-10 sm:mt-12 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-zinc-600 dark:text-zinc-500 px-4">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Zero-Knowledge Architecture
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Industry-Standard Encryption at Rest
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Secure Credential Management
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Managed Security Architecture
                </div>
              </div>
            </div>
          </div>

          <StatsBand />
          <FeaturesGrid />
          <Testimonials />
          <FaqSection />
          <FinalCta />
        </>
      )}
    </div>
  );
};

export default HomePage;
