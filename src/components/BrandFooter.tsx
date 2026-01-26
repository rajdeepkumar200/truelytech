import { useState } from 'react';

const BrandFooter = () => {
  const [logoOk, setLogoOk] = useState(true);

  return (
    <footer className="border-t border-border/50 bg-background/50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 flex flex-col items-center gap-3 text-center">
        {logoOk ? (
          <a
            href="https://truelytechtechnologies.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block">
            <img
              src="/truelytech-logo.svg"
              alt="TruelyTech Technologies"
              className="h-14 w-auto"
              loading="lazy"
              onError={() => setLogoOk(false)}
            />
          </a>
        ) : (
          <a
            href="https://truelytechtechnologies.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-foreground">
            TruelyTech Technologies
          </a>
        )}
        <p className="text-xs text-muted-foreground">
          Built by <span className="font-medium text-foreground">TruelyTech Technologies</span>
        </p>
      </div>
    </footer>
  );
};

export default BrandFooter;
