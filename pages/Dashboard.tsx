import React from 'react';
import MagicBento from '../components/MagicBento';
import ScrambledText from '../components/ScrambledText';

interface DashboardProps {
    onTabChange: (tabId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onTabChange }) => {
  return (
    <div className="w-full min-h-full flex flex-col items-center justify-start py-10 px-4">

      {/* Pulsing Neon Magenta Text Glow */}
      <style>
      {`
        @keyframes pulseGlow {
          0% {
            text-shadow:
              0 0 6px rgba(255,0,255,0.85),
              0 0 14px rgba(255,0,255,0.7),
              0 0 28px rgba(255,0,255,0.4);
          }
          50% {
            text-shadow:
              0 0 10px rgba(255,0,255,1),
              0 0 22px rgba(255,0,255,0.9),
              0 0 40px rgba(255,0,255,0.6),
              0 0 80px rgba(255,0,255,0.4);
          }
          100% {
            text-shadow:
              0 0 6px rgba(255,0,255,0.85),
              0 0 14px rgba(255,0,255,0.7),
              0 0 28px rgba(255,0,255,0.4);
          }
        }

        .pulse-text {
          color: #ff00ff;
          animation: pulseGlow 2.4s ease-in-out infinite;
        }
      `}
      </style>

      {/* Pulse Glow Title */}
      <div className="mb-6">
        <ScrambledText
          className="pulse-text !m-0 !max-w-full !font-sans !text-4xl !font-bold text-center justify-center"
          radius={150}
        >
          DASHBOARD
        </ScrambledText>
      </div>

      {/* Subtitle */}
      <p className="text-white/60 mb-10">
        Choose a tool below to begin analysis
      </p>

      {/* Magic Bento Component */}
      <MagicBento
        onTabChange={onTabChange}
        enableStars={true}
        enableSpotlight={true}
        enableBorderGlow={true}
        enableTilt={true}
        enableMagnetism={true}
        clickEffect={true}
      />
    </div>
  );
};

export default Dashboard;
