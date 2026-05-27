import React from 'react';

const faqItems = [
  {
    question: 'What does zero-knowledge mean in AccountSafe?',
    answer:
      'Sensitive vault data is encrypted in the browser before it is sent anywhere. The server stores ciphertext and cannot decrypt your vault contents.',
  },
  {
    question: 'Does my master password leave my device?',
    answer:
      'No. The browser derives an authentication hash and encryption key locally, then sends only the derived auth hash for verification.',
  },
  {
    question: 'What encryption protects vault data?',
    answer:
      'AccountSafe uses AES-256-GCM authenticated encryption with Argon2id key derivation, matching the security model documented in the project README.',
  },
  {
    question: 'Can I export or restore my vault?',
    answer:
      'Yes. Export and import use encrypted vault backups, so the server still never sees decrypted vault data during backup or restore.',
  },
  {
    question: 'What is duress mode?',
    answer:
      'Duress mode lets a secondary password reveal a decoy vault while the real vault remains protected under the primary password.',
  },
  {
    question: 'How do shared secrets stay private?',
    answer:
      'One-time sharing encrypts content client-side. The encrypted blob can be stored by the server, while the decryption key stays in the URL fragment and is not sent to the server.',
  },
  {
    question: 'Can I self-host AccountSafe?',
    answer:
      'Yes. The project includes Docker/local development steps and production deployment guidance for the Django backend, PostgreSQL, and hosted frontend.',
  },
];

const SecurityFaqSection: React.FC = () => {
  return (
    <section className="px-4 pb-16 sm:pb-24" aria-labelledby="faq-heading">
      <div className="mx-auto max-w-5xl border-t border-zinc-200 pt-10 dark:border-zinc-800 sm:pt-12">
        <div className="mb-8 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
            Security FAQ
          </p>
          <h2
            id="faq-heading"
            className="mt-3 text-2xl font-bold text-zinc-900 dark:text-white sm:text-3xl"
          >
            Straight answers from the security docs
          </h2>
          <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            No fabricated reviews or usage claims. These answers reflect the documented
            zero-knowledge vault, export, duress, sharing, and self-hosting behavior.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {faqItems.map((item) => (
            <details
              key={item.question}
              className="group rounded-lg border border-zinc-200 bg-zinc-50/70 p-4 text-left dark:border-zinc-800 dark:bg-zinc-900/45"
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                <span>{item.question}</span>
                <span
                  aria-hidden="true"
                  className="mt-0.5 text-lg leading-none text-emerald-600 transition-transform group-open:rotate-45 dark:text-emerald-400"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SecurityFaqSection;
