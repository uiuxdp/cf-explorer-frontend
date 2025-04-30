import { useState } from 'react';

export default function EqualizerIcon() {
  const [isHovering, setIsHovering] = useState(true);
  
  // Create an array of 6 blocks with different animation properties
  const blocks = [
    { delay: '0ms', height: 'h-2', hoverHeight: 'h-2' },
    { delay: '100ms', height: 'h-3', hoverHeight: 'h-2' },
    { delay: '200ms', height: 'h-1', hoverHeight: 'h-5' },
    { delay: '300ms', height: 'h-2', hoverHeight: 'h-4' },
    { delay: '400ms', height: 'h-4', hoverHeight: 'h-3' },
    // { delay: '500ms', height: 'h-2', hoverHeight: 'h-4' }
  ];
  
  return (
<>  
      <div 
        className="flex items-center justify-center gap-[2px] w-6 h-6" 
        // onMouseEnter={() => setIsHovering(true)}
        // onMouseLeave={() => setIsHovering(false)}
      >
        {blocks.map((block, index) => (
          <div 
            key={index}
            className={`w-[2px] rounded-full bg-black transition-all duration-700 ease-in-out transform ${isHovering ? 'animate-pulse ' : ''}`}
            style={{ 
              height: isHovering ? undefined : block.height.replace('h-', '') * 4 + 'px',
              transitionDelay: block.delay,
              animation: isHovering ? `equalizeBlock 2s ease-in-out infinite alternate ${block.delay}` : 'none'
            }}
          />
        ))}
      </div>
      
      <style jsx>{`
        @keyframes equalizeBlock {
          0% {
            height: 4px;
          }
          20% {
            height: 16px;
          }
          40% {
            height: 8px;
          }
          60% {
            height: 20px;
          }
          80% {
            height: 6px;
          }
          100% {
            height: 12px;
          }
        }
      `}</style>
 </>    
  );
}