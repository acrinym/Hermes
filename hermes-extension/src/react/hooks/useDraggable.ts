// src/react/hooks/useDraggable.ts

import { useState, useEffect, useRef, RefObject } from 'react';

export const useDraggable = (elRef: RefObject<HTMLElement>, headerRef: RefObject<HTMLElement>) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isStacked, setStacked] = useState(false);
  const dragInfo = useRef({ dx: 0, dy: 0 });

  useEffect(() => {
    const el = elRef.current;
    const header = headerRef.current;
    if (!el || !header) return;

    // Place it in the top right initially
    setPosition({ x: window.innerWidth - el.offsetWidth - 20, y: 20 });

    const handleMouseDown = (e: MouseEvent) => {
      dragInfo.current = {
        dx: e.clientX - position.x,
        dy: e.clientY - position.y,
      };
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      header.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e: MouseEvent) => {
      const newX = e.clientX - dragInfo.current.dx;
      const newY = e.clientY - dragInfo.current.dy;
      const elWidth = el.offsetWidth;
      
      if (newX < 10 || newX > window.innerWidth - elWidth - 10) {
        setStacked(true);
      } else {
        setStacked(false);
      }
      
      const clampedX = Math.max(0, Math.min(newX, window.innerWidth - elWidth));
      const clampedY = Math.max(0, Math.min(newY, window.innerHeight - el.offsetHeight));

      setPosition({ x: clampedX, y: clampedY });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      header.style.cursor = 'grab';
    };

    header.addEventListener('mousedown', handleMouseDown);

    return () => {
      header.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [elRef, headerRef, position.x, position.y]);

  return { position, isStacked };
};