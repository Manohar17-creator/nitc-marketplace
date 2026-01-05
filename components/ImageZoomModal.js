'use client';

import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

export default function ImageZoomModal({ image, onClose }) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPinching, setIsPinching] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);
  const lastTouchDistance = useRef(0);
  const lastTouchCenter = useRef({ x: 0, y: 0 });
  const dragStart = useRef({ x: 0, y: 0 });
  const lastTap = useRef(0);

  useEffect(() => {
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

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
      // Pinch zoom
      e.preventDefault();
      setIsPinching(true);
      setIsDragging(false);
      lastTouchDistance.current = getDistance(e.touches);
      lastTouchCenter.current = getCenter(e.touches);
    } else if (e.touches.length === 1 && scale > 1) {
      // Single finger drag when zoomed
      setIsDragging(true);
      dragStart.current = {
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      };
    } else if (e.touches.length === 1) {
      // Handle double tap
      const now = Date.now();
      const DOUBLE_TAP_DELAY = 300;
      
      if (now - lastTap.current < DOUBLE_TAP_DELAY) {
        // Double tap detected - zoom to tap location
        handleDoubleTap(e.touches[0]);
      }
      lastTap.current = now;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && isPinching) {
      e.preventDefault();
      
      const currentDistance = getDistance(e.touches);
      const currentCenter = getCenter(e.touches);
      
      // Calculate new scale
      const scaleChange = currentDistance / lastTouchDistance.current;
      const newScale = Math.min(Math.max(scale * scaleChange, 1), 5);
      
      // Calculate position change to zoom towards pinch center
      const scaleDiff = newScale - scale;
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (containerRect) {
        const centerX = currentCenter.x - containerRect.left - containerRect.width / 2;
        const centerY = currentCenter.y - containerRect.top - containerRect.height / 2;
        
        setPosition({
          x: position.x - (centerX * scaleDiff) / scale,
          y: position.y - (centerY * scaleDiff) / scale,
        });
      }
      
      setScale(newScale);
      lastTouchDistance.current = currentDistance;
      lastTouchCenter.current = currentCenter;
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      e.preventDefault();
      
      const newX = e.touches[0].clientX - dragStart.current.x;
      const newY = e.touches[0].clientY - dragStart.current.y;
      
      setPosition({ x: newX, y: newY });
    }
  };

  const handleTouchEnd = (e) => {
    if (e.touches.length < 2) {
      setIsPinching(false);
    }
    
    if (e.touches.length === 0) {
      setIsDragging(false);
      
      // Reset if zoomed out
      if (scale <= 1) {
        setScale(1);
        setPosition({ x: 0, y: 0 });
      }
    }
  };

  const handleDoubleTap = (touch) => {
    if (scale === 1) {
      // Zoom in to tap location
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (containerRect) {
        const tapX = touch.clientX - containerRect.left - containerRect.width / 2;
        const tapY = touch.clientY - containerRect.top - containerRect.height / 2;
        
        const newScale = 2.5;
        setScale(newScale);
        setPosition({
          x: -tapX * (newScale - 1),
          y: -tapY * (newScale - 1),
        });
      }
    } else {
      // Zoom out
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  // Desktop double-click support
  const handleDoubleClick = (e) => {
    e.stopPropagation();
    
    if (scale === 1) {
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (containerRect) {
        const clickX = e.clientX - containerRect.left - containerRect.width / 2;
        const clickY = e.clientY - containerRect.top - containerRect.height / 2;
        
        const newScale = 2.5;
        setScale(newScale);
        setPosition({
          x: -clickX * (newScale - 1),
          y: -clickY * (newScale - 1),
        });
      }
    } else {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  // Desktop mouse drag support
  const handleMouseDown = (e) => {
    if (scale > 1) {
      setIsDragging(true);
      dragStart.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      };
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && scale > 1) {
      const newX = e.clientX - dragStart.current.x;
      const newY = e.clientY - dragStart.current.y;
      setPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div 
      className="fixed inset-0 bg-black z-[100]"
      style={{ width: '100vw', height: '100vh' }}
      onClick={scale === 1 ? onClose : undefined}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 bg-white/20 text-white p-3 rounded-full hover:bg-white/30 transition-colors z-[110] backdrop-blur-sm safe-top"
      >
        <X size={28} />
      </button>
      
      <div 
        ref={containerRef}
        className="w-full h-full flex items-center justify-center overflow-hidden select-none"
        style={{ padding: '60px 16px', touchAction: 'none' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img 
          src={image.url} 
          alt={image.title}
          className="w-full h-auto"
          style={{ 
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            transformOrigin: 'center center',
            transition: isDragging || isPinching ? 'none' : 'transform 0.3s ease-out',
            cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
          }}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={handleDoubleClick}
          onMouseDown={handleMouseDown}
          draggable={false}
        />
      </div>
      
      <div className="absolute bottom-6 left-0 right-0 text-center px-4 safe-bottom pointer-events-none">
        <p className="text-white text-sm font-medium drop-shadow-lg bg-black/40 inline-block px-4 py-2 rounded-full backdrop-blur-sm">
          {image.title}
        </p>
      </div>
    </div>
  );
}