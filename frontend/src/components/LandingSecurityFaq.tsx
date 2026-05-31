import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ShieldCheck } from 'lucide-react';

type FaqItem = {
  question: string;
  answer: string;
  source: string;
};

const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'What does zero-knowledge mean in AccountSafe?',
    answer:
      'Sensitive vault data is encrypted in the browser before it is sent anywhere. The server stores encrypted vault data, not readable credentials.',
    source: 'README and SECURITY.md',
  },
  {
    question: 'Does my master password leave my device?',
    answer:
      'No. The browser derives authentication and encryption material locally, then sends only the derived authentication hash needed for verification.',
    source: 'SECURITY.md security model',
  },
  {
    question: 'What encryption protects vault data?',
    answer:
      'Vault data uses AES-256-GCM authenticated encryption with Argon2id key derivation, matching the project security documentation.',
    source: 'README feature list',
  },
  {
    question: 'Can I export or restore my vault?',
    answer:
      'Yes. AccountSafe supports encrypted zero-knowledge export and import flows, so backups stay decryptable only by the account holder.',
    source: 'README and disaster recovery docs',
  },
  {
    question: 'What is duress mode?',
    answer:
      'Duress mode lets a separate password open a decoy vault while keeping the real vault protected, which is useful for coercion-resistant access.',
    source: 'README active defense section',
  },
  {
    question: 'How does shared-secret access work?',
    answer:
      'Shared secrets are protected with a passphrase and expiry controls so temporary access can be granted without exposing the entire vault.',
    source: 'README and API docs',
  },
  {
    question: 'Can I self-host AccountSafe?',
    answer:
      'Yes. The repository includes local, Docker, and production setup guidance for running the Django backend and React frontend yourself.',
    source: 'README and configuration docs',
  },
];

const LandingSecurityFaq: React.FC = () => {
  return (
    <section className="border-t border-zinc-200 bg-zinc-50 px-4 py-14 dark:border-zinc-800 dark:bg-[#0d0d10] sm:py-16">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Security FAQ
            </div>
            <h2 className="text-2xl font-semibold tracking-normal text-zinc-900 dark:text-white sm:text-3xl">
              Practical answers before you trust a vault
            </h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400 sm:text-base">
              Short, implementation-backed answers about how AccountSafe protects credentials without marketing claims or fabricated social proof.
            </p>
          </div>
          <Link
            to="/docs/security"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-400 hover:bg-white dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-900"
          >
            Read security docs
          </Link>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {FAQ_ITEMS.map(item => (
            <details
              key={item.question}
              className="group rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition-colors open:border-emerald-300 dark:border-zinc-800 dark:bg-zinc-950 dark:open:border-emerald-500/50"
            >
              <summary className="flex cursor-pointer list-none items-start gap-3 text-left text-sm font-semibold text-zinc-900 marker:hidden dark:text-zinc-100">
                <HelpCircle className="mt-0.5 h-4 w-4 flex-none text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                <span className="flex-1">{item.question}</span>
                <span className="mt-1 h-2 w-2 flex-none rotate-45 border-b border-r border-zinc-500 transition-transform group-open:rotate-[225deg] dark:border-zinc-400" aria-hidden="true" />
              </summary>
              <p className="mt-3 pl-7 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {item.answer}
              </p>
              <p className="mt-2 pl-7 text-xs font-medium text-zinc-500 dark:text-zinc-500">
                Source: {item.source}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LandingSecurityFaq;
