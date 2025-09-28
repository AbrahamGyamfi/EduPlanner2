import React from 'react';
import { GraduationCap, Calendar } from 'lucide-react';

export default function Logo({ className = '', variant = 'sidebar', size = 'normal' }) {
  // Define color schemes for different variants based on the original design
  const variants = {
    sidebar: {
      iconPrimary: 'text-blue-500',
      iconSecondary: 'text-blue-400',
      textEdu: 'text-blue-500',
      textPlanner: 'text-white'
    },
    light: {
      iconPrimary: 'text-blue-500',
      iconSecondary: 'text-blue-400',
      textEdu: 'text-blue-500',
      textPlanner: 'text-gray-800'
    },
    dark: {
      iconPrimary: 'text-blue-500',
      iconSecondary: 'text-blue-400',
      textEdu: 'text-blue-500',
      textPlanner: 'text-white'
    }
  };

  // Define size configurations
  const sizeConfigs = {
    small: {
      iconSize: 'w-10 h-10',
      subIconSize: 'w-5 h-5',
      textSize: 'text-2xl',
      gap: 'gap-3'
    },
    normal: {
      iconSize: 'w-10 h-10',
      subIconSize: 'w-5 h-5',
      textSize: 'text-3xl',
      gap: 'gap-3'
    }
  };

  const colors = variants[variant] || variants.sidebar;
  const sizeConfig = sizeConfigs[size] || sizeConfigs.normal;

  return (
    <div className={`flex items-center ${sizeConfig.gap} ${className}`}>
      <div className="relative">
        <GraduationCap className={`${sizeConfig.iconSize} ${colors.iconPrimary}`} />
        <Calendar className={`${sizeConfig.subIconSize} ${colors.iconSecondary} absolute -bottom-1 -right-1`} />
      </div>
      <span className={`${sizeConfig.textSize} font-bold`}>
        <span className={colors.textEdu}>edu</span><span className={colors.textPlanner}>Planner</span>
      </span>
    </div>
  );
}
