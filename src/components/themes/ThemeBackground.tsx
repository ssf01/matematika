import React from 'react';
import { useTheme } from './ThemeProvider';

function AgentBackground() {
  return (
    <>
      <div className="fixed inset-0 -z-10" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }} />
      <div className="fixed inset-0 -z-10 opacity-10" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(233,69,96,0.3) 40px, rgba(233,69,96,0.3) 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(233,69,96,0.3) 40px, rgba(233,69,96,0.3) 41px)',
      }} />
      <div className="fixed top-0 right-0 w-96 h-96 -z-10 opacity-20" style={{
        background: 'radial-gradient(circle, rgba(233,69,96,0.4) 0%, transparent 70%)',
      }} />
    </>
  );
}

function SpaceBackground() {
  return (
    <>
      <div className="fixed inset-0 -z-10" style={{ background: 'linear-gradient(180deg, #0b0c2a 0%, #1b1b4b 50%, #0b0c2a 100%)' }} />
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {Array.from({ length: 50 }).map((_, i) => (
          <div key={i} className="absolute rounded-full bg-white" style={{
            width: `${Math.random() * 3 + 1}px`,
            height: `${Math.random() * 3 + 1}px`,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.7 + 0.3,
            animation: `float ${Math.random() * 4 + 3}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 3}s`,
          }} />
        ))}
      </div>
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] -z-10 opacity-15" style={{
        background: 'radial-gradient(ellipse, rgba(123,47,247,0.5) 0%, rgba(0,212,255,0.2) 50%, transparent 70%)',
      }} />
    </>
  );
}

function TreasureBackground() {
  return (
    <>
      <div className="fixed inset-0 -z-10" style={{ background: 'linear-gradient(135deg, #2d1b00 0%, #4a3000 50%, #2d1b00 100%)' }} />
      <div className="fixed inset-0 -z-10 opacity-10" style={{
        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 30px, rgba(255,193,7,0.2) 30px, rgba(255,193,7,0.2) 31px)',
      }} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] -z-10 opacity-10" style={{
        background: 'radial-gradient(circle, rgba(255,193,7,0.3) 0%, transparent 60%)',
      }} />
    </>
  );
}

function DetectiveBackground() {
  return (
    <>
      <div className="fixed inset-0 -z-10" style={{ background: 'linear-gradient(180deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)' }} />
      <div className="fixed inset-0 -z-10 opacity-5" style={{
        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(76,175,80,0.3) 20px, rgba(76,175,80,0.3) 21px)`,
      }} />
      <div className="fixed top-10 left-10 w-80 h-80 -z-10 opacity-10" style={{
        background: 'radial-gradient(circle, rgba(76,175,80,0.4) 0%, transparent 60%)',
      }} />
    </>
  );
}

export function ThemeBackground() {
  const { themeId } = useTheme();

  switch (themeId) {
    case 'agent': return <AgentBackground />;
    case 'space': return <SpaceBackground />;
    case 'treasure': return <TreasureBackground />;
    case 'detective': return <DetectiveBackground />;
    default: return null;
  }
}
