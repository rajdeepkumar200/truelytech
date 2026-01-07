import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

const MotivationModal = ({ onDismiss }: { onDismiss?: () => void }) => {
  const [isOpen, setIsOpen] = useState(false);

  const quotes = [
    'Small steps every day.',
    'Do it for future you.',
    'Discipline beats motivation.',
    'One more rep.',
    'Breathe. Reset. Continue.',
  ];

  const [quote, setQuote] = useState('');

  useEffect(() => {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setQuote(randomQuote);
    setIsOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDismiss = () => {
    setIsOpen(false);
    if (onDismiss) onDismiss();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
      />
      
      {/* Modal */}
      <div className="relative bg-popover rounded-2xl p-6 md:p-8 max-w-md w-full shadow-2xl animate-slide-up">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-card mb-4">
            <Sparkles className="w-6 h-6 text-card-foreground" />
          </div>

          <h2 className="font-display text-2xl text-foreground mb-4">
            Daily Motivation
          </h2>

          <blockquote className="text-lg text-foreground leading-relaxed mb-6">
            "{quote}"
          </blockquote>

          <button
            onClick={handleDismiss}
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
