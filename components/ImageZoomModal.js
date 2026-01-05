'use client';

import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

export default function ImageZoomModal({ image, onClose }) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPinching, setIsPinching] = useState(false);
  const containerRef = useRef(null);
  const lastTouchDistance = useRef(0);
  const lastPosition = useRef({ x: 0, y: 0 });

  const getDistance = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getCenter = (touches) => {
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    };
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      setIsPinching(true);
      lastTouchDistance.current = getDistance(e.touches);
      lastPosition.current = getCenter(e.touches);
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && isPinching) {
      e.preventDefault();
      
      const currentDistance = getDistance(e.touches);
      const currentCenter = getCenter(e.touches);
      
      // Calculate scale
      const scaleChange = currentDistance / lastTouchDistance.current;
      const newScale = Math.min(Math.max(scale * scaleChange, 1), 5);
      
      // Calculate position
      if (newScale > 1) {
        const deltaX = currentCenter.x - lastPosition.current.x;
        const deltaY = currentCenter.y - lastPosition.current.y;
        
        setPosition({
          x: position.x + deltaX,
          y: position.y + deltaY,
        });
      } else {
        setPosition({ x: 0, y: 0 });
      }
      
      setScale(newScale);
      lastTouchDistance.current = currentDistance;
      lastPosition.current = currentCenter;
    }
  };

  const handleTouchEnd = (e) => {
    if (e.touches.length < 2) {
      setIsPinching(false);
      
      // Reset if zoomed out
      if (scale <= 1) {
        setScale(1);
        setPosition({ x: 0, y: 0 });
      }
    }
  };

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    if (scale === 1) {
      setScale(2);
    } else {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black z-[100]"
      style={{ width: '100vw', height: '100vh' }}
      onClick={scale === 1 ? onClose : undefined}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 bg-white/20 text-white p-3 rounded-full hover:bg-white/30 transition-colors z-[110] backdrop-blur-sm safe-top"
      >
        <X size={28} />
      </button>
      
      <div 
        ref={containerRef}
        className="w-full h-full flex items-center justify-center overflow-hidden"
        style={{ padding: '60px 16px' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img 
          src={image.url} 
          alt={image.title}
          className="w-full h-auto transition-transform duration-200"
          style={{ 
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
            transformOrigin: 'center center',
          }}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={handleDoubleClick}
        />
      </div>
      
      <div className="absolute bottom-6 left-0 right-0 text-center px-4 safe-bottom">
        <p className="text-white text-sm font-medium drop-shadow-lg bg-black/40 inline-block px-4 py-2 rounded-full backdrop-blur-sm">
          {image.title}
        </p>
      </div>
    </div>
  );
}