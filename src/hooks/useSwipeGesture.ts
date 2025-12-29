import { useState, useRef, TouchEvent } from 'react';
import { triggerHaptic } from './useSound';

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}

export const useSwipeGesture = ({ onSwipeLeft, onSwipeRight, threshold = 80 }: SwipeGestureOptions) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const startXRef = useRef(0);
  const isDraggingRef = useRef(false);

  const handleTouchStart = (e: TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    isDraggingRef.current = true;
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDraggingRef.current) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startXRef.current;
    
    // Limit the swipe distance
    const limitedDiff = Math.max(-150, Math.min(150, diff));
    setSwipeOffset(limitedDiff);
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
    
    if (swipeOffset > threshold && onSwipeRight) {
      triggerHaptic(30);
      onSwipeRight();
    } else if (swipeOffset < -threshold && onSwipeLeft) {
      triggerHaptic(30);
      onSwipeLeft();
    }
    
    setSwipeOffset(0);
  };

  return {
    swipeOffset,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
};
