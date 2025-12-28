import { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const quotes = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
  { text: "We are what we repeatedly do. Excellence is not an act, but a habit.", author: "Aristotle" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Small daily improvements are the key to staggering long-term results.", author: "Robin Sharma" },
  { text: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Ryun" },
  { text: "Your future is created by what you do today, not tomorrow.", author: "Robert Kiyosaki" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "The journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
  { text: "It's not about being the best. It's about being better than you were yesterday.", author: "Unknown" },
  { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
];

const MotivationModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [quote, setQuote] = useState(quotes[0]);

  useEffect(() => {
    // Check if we should show the modal (once per session)
    const lastShown = sessionStorage.getItem('motivation-shown');
    if (!lastShown) {
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
      setQuote(randomQuote);
      setIsOpen(true);
      sessionStorage.setItem('motivation-shown', 'true');
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
        onClick={() => setIsOpen(false)}
      />
      
      {/* Modal */}
      <div className="relative bg-popover rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl animate-slide-up">
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-card mb-4">
            <Sparkles className="w-6 h-6 text-card-foreground" />
          </div>

          <h2 className="font-display text-2xl text-foreground mb-4">
            Daily Motivation
          </h2>

          <blockquote className="text-lg text-foreground leading-relaxed mb-3">
            "{quote.text}"
          </blockquote>

          <p className="text-sm text-muted-foreground mb-6">
            — {quote.author}
          </p>

          <button
            onClick={() => setIsOpen(false)}
            className="w-full py-3 bg-card text-card-foreground rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            Let's Get Started! 💪
          </button>
        </div>
      </div>
    </div>
  );
};

export default MotivationModal;
