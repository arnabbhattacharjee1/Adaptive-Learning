import React from 'react';

interface A11yLiveAnnouncerProps {
  message: string;
}

export const A11yLiveAnnouncer: React.FC<A11yLiveAnnouncerProps> = ({ message }) => {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
      data-testid="a11y-live-region"
    >
      {message}
    </div>
  );
};
