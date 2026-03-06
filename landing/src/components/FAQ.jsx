import { useState } from 'react';

const faqs = [
  {
    q: 'How does the AI learn my brand voice?',
    a: 'It analyzes your past posts and writing style — tone, vocabulary, emoji usage, sentence structure. Every generated post sounds like you wrote it, not a robot.',
  },
  {
    q: 'Which platforms are supported?',
    a: 'LinkedIn, Twitter/X, Instagram, Facebook, YouTube, Reddit, Medium, Pinterest, Telegram, Discord, Slack, Bluesky, Mastodon, Dev.to, and Tumblr. 16 platforms total.',
  },
  {
    q: 'Can I edit posts before they go live?',
    a: 'Absolutely. Every AI-generated post goes through you first. Review, edit, and approve in the calendar view. Nothing publishes without your approval.',
  },
  {
    q: 'Is my data safe?',
    a: 'Your social media credentials are encrypted with AES-256 and stored securely in our database. We never post without your explicit approval. You can disconnect any account at any time.',
  },
  {
    q: 'What happens when I hit the free limit?',
    a: 'You will see a friendly upgrade prompt. Your already-scheduled posts continue as planned. No surprises, no sudden cutoffs.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel from your dashboard with one click. No lock-in contracts, no hidden fees. Your scheduled posts will continue until the end of your billing period.',
  },
];

function AccordionItem({ item, isOpen, toggle }) {
  return (
    <div className="border-b border-border">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between py-5 text-left group"
        aria-expanded={isOpen}
      >
        <span className="font-body font-medium text-txt-primary group-hover:text-accent transition-colors pr-4">
          {item.q}
        </span>
        <span className={`text-txt-muted transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-45' : ''}`}>
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 4v12M4 10h12" />
          </svg>
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-48 pb-5' : 'max-h-0'}`}
      >
        <p className="text-sm text-txt-secondary leading-relaxed pr-12">{item.a}</p>
      </div>
    </div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section id="faq" className="py-32 px-6">
      <div className="max-w-2xl mx-auto">
        <h2 className="font-display text-4xl sm:text-5xl text-center mb-16">
          Frequently asked questions
        </h2>

        <div>
          {faqs.map((item, i) => (
            <AccordionItem
              key={i}
              item={item}
              isOpen={openIndex === i}
              toggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
