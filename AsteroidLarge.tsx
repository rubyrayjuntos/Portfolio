// AsteroidLarge.tsx
import React from 'react';
import { motion } from 'framer-motion';

const AsteroidLarge = () => (
  <motion.svg
    width="80" height="80" viewBox="-40 -40 80 80"
    xmlns="http://www.w3.org/2000/svg"
    initial={{ scale: 1 }}
    whileHover={{ scale: 1.05, rotate: 2 }}
    transition={{ type: 'spring', stiffness: 100 }}
  >
    <defs>
      <radialGradient id="asteroidGradient" cx="30%" cy="30%">
        <stop offset="0%" stopColor="#8D6E63" />
        <stop offset="50%" stopColor="#6D4C41" />
        <stop offset="100%" stopColor="#4E342E" />
      </radialGradient>
      <filter id="asteroidGlow">
        <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <path
      d="M-35,-20 Q-40,-10 -35,0 Q-30,10 -25,15 Q-15,20 -5,18 Q5,15 15,10 Q20,5 25,-5 Q30,-15 25,-25 Q20,-35 10,-38 Q0,-40 -10,-35 Q-20,-30 -25,-25 Q-30,-20 -35,-20 Z"
      fill="url(#asteroidGradient)"
      stroke="#5D4037"
      strokeWidth="2"
      filter="url(#asteroidGlow)"
    />
    <circle cx="-15" cy="-10" r="2" fill="#3E2723" opacity="0.6"/>
    <circle cx="10" cy="5" r="1.5" fill="#3E2723" opacity="0.7"/>
    <circle cx="5" cy="-15" r="1" fill="#3E2723" opacity="0.8"/>
    <circle cx="-5" cy="10" r="1.5" fill="#3E2723" opacity="0.6"/>
  </motion.svg>
);

export default AsteroidLarge;