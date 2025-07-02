// FeaturedCarousel.tsx
import React from 'react';
import { motion } from 'framer-motion';
import projects from '../data/projects.json';

const featuredProjects = projects.filter(p => p.highlight);

const FeaturedCarousel = () => {
  return (
    <section className="py-12 px-6 bg-[#1a1e2a]">
      <h2 className="text-3xl font-bold text-white mb-6 text-center">🔥 Featured Work</h2>
      <div className="overflow-x-auto no-scrollbar">
        <div className="flex gap-6">
          {featuredProjects.map(project => (
            <motion.div
              key={project.id}
              className="min-w-[300px] max-w-sm flex-shrink-0 bg-[#21253b] rounded-2xl shadow-xl overflow-hidden"
              whileHover={{ scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <img src={project.media.thumbnail} alt={project.title} className="h-48 w-full object-cover" />
              <div className="p-4">
                <h3 className="text-xl font-semibold text-white">{project.title}</h3>
                <p className="text-sm text-gray-300 italic">{project.emotion}</p>
                <p className="text-sm text-gray-400 mt-2">{project.subtitle}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCarousel;