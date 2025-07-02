// ProjectGrid.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import projects from '../data/projects.json';

const filters = ['All', 'Digital Art', 'UI/UX', 'Speculative Design'];

const ProjectGrid = () => {
  const [selected, setSelected] = useState('All');

  const filtered = selected === 'All'
    ? projects
    : projects.filter(p => p.type.includes(selected));

  return (
    <section className="p-8 space-y-6">
      <div className="flex flex-wrap gap-4 justify-center">
        {filters.map(filter => (
          <button
            key={filter}
            className={\`px-4 py-2 rounded-full border border-white transition 
              \${selected === filter ? 'bg-white text-black' : 'text-white hover:bg-white/10'}\`}
            onClick={() => setSelected(filter)}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-6">
        <AnimatePresence>
          {filtered.map((proj) => (
            <motion.div
              key={proj.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              layout
              className="bg-[#21253b] rounded-xl overflow-hidden shadow-lg hover:scale-[1.02] transition-transform duration-300"
            >
              <img src={proj.media.thumbnail} alt={proj.title} className="w-full object-cover h-48" />
              <div className="p-4">
                <h3 className="text-lg font-bold text-white">{proj.title}</h3>
                <p className="text-sm text-gray-300">{proj.subtitle}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default ProjectGrid;