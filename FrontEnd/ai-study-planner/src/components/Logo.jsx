import React from 'react';
import { GraduationCap, Calendar } from 'lucide-react';

export default function Logo({ className = '' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <GraduationCap className="w-8 h-8 text-blue-600" />
        <Calendar className="w-4 h-4 text-blue-400 absolute -bottom-1 -right-1" />
      </div>
      <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
        edu<span className="text-white">Planner</span>
      </span>
    </div>
  );
}
