import React, { useMemo } from 'react';
import { useTheme } from './ThemeProvider';

function AgentBackground() {
  return (
    <>
      <div className="fixed inset-0 -z-10" style={{ background: 'linear-gradient(135deg, #252547 0%, #1e2d55 50%, #1a4a80 100%)' }} />
      <div className="fixed inset-0 -z-10 opacity-12" style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(233,69,96,0.25) 40px, rgba(233,69,96,0.25) 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(233,69,96,0.25) 40px, rgba(233,69,96,0.25) 41px)',
      }} />
      <div className="fixed top-0 right-0 w-96 h-96 -z-10 opacity-25" style={{
        background: 'radial-gradient(circle, rgba(233,69,96,0.5) 0%, transparent 70%)',
      }} />
    </>
  );
}

function SpaceBackground() {
  const stars = useMemo(() =>
    Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      width: Math.random() * 3 + 1,
      top: Math.random() * 100,
      left: Math.random() * 100,
      opacity: Math.random() * 0.7 + 0.3,
      duration: Math.random() * 4 + 3,
      delay: Math.random() * 3,
    })),
  []);

  return (
    <>
      <div className="fixed inset-0 -z-10" style={{ background: 'linear-gradient(180deg, #151640 0%, #262668 50%, #151640 100%)' }} />
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {stars.map((s) => (
          <div key={s.id} className="absolute rounded-full bg-white" style={{
            width: `${s.width}px`,
            height: `${s.width}px`,
            top: `${s.top}%`,
            left: `${s.left}%`,
            opacity: s.opacity,
            animation: `float ${s.duration}s ease-in-out infinite`,
            animationDelay: `${s.delay}s`,
          }} />
        ))}
      </div>
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] -z-10 opacity-20" style={{
        background: 'radial-gradient(ellipse, rgba(123,47,247,0.5) 0%, rgba(0,212,255,0.25) 50%, transparent 70%)',
      }} />
    </>
  );
}

function TreasureBackground() {
  return (
    <>
      <div className="fixed inset-0 -z-10" style={{ background: 'linear-gradient(135deg, #3e2b12 0%, #5c4218 50%, #3e2b12 100%)' }} />
      <div className="fixed inset-0 -z-10 opacity-12" style={{
        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 30px, rgba(255,193,7,0.2) 30px, rgba(255,193,7,0.2) 31px)',
      }} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] -z-10 opacity-15" style={{
        background: 'radial-gradient(circle, rgba(255,193,7,0.4) 0%, transparent 60%)',
      }} />
    </>
  );
}

function DetectiveBackground() {
  return (
    <>
      <div className="fixed inset-0 -z-10" style={{ background: 'linear-gradient(180deg, #262b28 0%, #3a403c 50%, #262b28 100%)' }} />
      <div className="fixed inset-0 -z-10 opacity-8" style={{
        backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(76,175,80,0.25) 20px, rgba(76,175,80,0.25) 21px)`,
      }} />
      <div className="fixed top-10 left-10 w-80 h-80 -z-10 opacity-15" style={{
        background: 'radial-gradient(circle, rgba(76,175,80,0.5) 0%, transparent 60%)',
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
