import React from 'react';
import MagicBento from '../components/MagicBento';
import ScrambledText from '../components/ScrambledText';
import Squares from '../components/Squares';
import { AccentColor, Theme } from '../types';

interface DashboardProps {
  onTabChange: (tabId: string) => void;
  accentColor: AccentColor | null;
  theme: Theme;
}

const Dashboard: React.FC<DashboardProps> = ({ onTabChange, accentColor, theme }) => {
  const titleStyle: React.CSSProperties = {
    color: accentColor ? accentColor.main : 'var(--color-primary)',
    textShadow: `0 0 25px ${accentColor ? accentColor.glow : 'var(--color-primary-glow)'}`
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">

      {/* Background Squares */}
      <div className="absolute inset-0 z-0">
        <Squares theme={theme} />
      </div>

      {/* FLOAT ANIMATION CSS */}
      <style>
        {`
          @keyframes dashboardFloat {
            0%   { transform: translateY(0px); }
            50%  { transform: translateY(-12px); }
            100% { transform: translateY(0px); }
          }
          .animate-dashboard-float {
            animation: dashboardFloat 4.5s ease-in-out infinite;
          }
        `}
      </style>

      {/* Foreground Content */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center gap-12 p-4 animate-dashboard-float">

        {/* Title */}
        <ScrambledText
          className="!text-5xl md:!text-5xl !font-bold text-center !m-0"
          style={titleStyle}
          radius={50}
          scrambleChars="*<>/"
        >
          DASHBOARD
        </ScrambledText>

        {/* Bento Grid */}
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
    </div>
  );
};

export default Dashboard;
