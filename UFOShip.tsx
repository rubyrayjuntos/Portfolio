// UFOShip.tsx
import React from 'react';
import { motion } from 'framer-motion';

const UFOShip = () => (
  <motion.svg
    width="60" height="30" viewBox="-30 -15 60 30"
    xmlns="http://www.w3.org/2000/svg"
    initial={{ y: 0 }}
    animate={{ y: [0, -3, 0] }}
    transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
  >
    <defs>
      <linearGradient id="ufoLargeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#9C27B0" />
        <stop offset="50%" stopColor="#7B1FA2" />
        <stop offset="100%" stopColor="#4A148C" />
      </linearGradient>
      <filter id="ufoGlow">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <ellipse cx="0" cy="0" rx="25" ry="8"
      fill="url(#ufoLargeGradient)"
      stroke="#E1BEE7"
      strokeWidth="2"
      filter="url(#ufoGlow)"
    />
    <ellipse cx="0" cy="-5" rx="15" ry="5"
      fill="#E1BEE7"
      stroke="#9C27B0"
      strokeWidth="1"
    />
    <ellipse cx="0" cy="-5" rx="8" ry="3"
      fill="#F3E5F5"
      stroke="#7B1FA2"
      strokeWidth="1"
    />
    <circle cx="-15" cy="0" r="2" fill="#FFEB3B" opacity="0.8"/>
    <circle cx="15" cy="0" r="2" fill="#FFEB3B" opacity="0.8"/>
    <circle cx="-8" cy="0" r="1.5" fill="#4CAF50" opacity="0.7"/>
    <circle cx="8" cy="0" r="1.5" fill="#4CAF50" opacity="0.7"/>
  </motion.svg>
);

export default UFOShip;