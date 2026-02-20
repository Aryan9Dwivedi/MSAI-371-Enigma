import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Users, 
  Award, 
  Target, 
  Layers, 
  TrendingUp,
  Shield,
  Clock,
  Star
} from 'lucide-react';

const badgeConfig = {
  'speed-demon': {
    name: 'Speed Demon',
    icon: Zap,
    color: 'from-yellow-400 to-orange-500',
    description: 'Complete 5 tasks in a week'
  },
  'team-player': {
    name: 'Team Player',
    icon: Users,
    color: 'from-blue-400 to-indigo-500',
    description: 'Help 3+ colleagues this month'
  },
  'skill-master': {
    name: 'Skill Master',
    icon: Award,
    color: 'from-purple-400 to-pink-500',
    description: 'Master 5+ different skills'
  },
  'reliable': {
    name: 'Reliable',
    icon: Target,
    color: 'from-emerald-400 to-teal-500',
    description: '95%+ on-time completion'
  },
  'multitasker': {
    name: 'Multitasker',
    icon: Layers,
    color: 'from-indigo-400 to-violet-500',
    description: 'Handle 5+ concurrent tasks'
  },
  'optimizer': {
    name: 'Optimizer',
    icon: TrendingUp,
    color: 'from-cyan-400 to-blue-500',
    description: 'Improve efficiency by 20%'
  },
  'quality-focused': {
    name: 'Quality Focused',
    icon: Star,
    color: 'from-amber-400 to-yellow-500',
    description: '90%+ quality rating'
  },
  'automation-expert': {
    name: 'Automation Expert',
    icon: Zap,
    color: 'from-violet-400 to-purple-500',
    description: 'Automate 3+ processes'
  },
  'security-champion': {
    name: 'Security Champion',
    icon: Shield,
    color: 'from-red-400 to-rose-500',
    description: 'Identify 5+ security issues'
  },
  'early-bird': {
    name: 'Early Bird',
    icon: Clock,
    color: 'from-orange-400 to-amber-500',
    description: 'Complete tasks before deadline'
  }
};

export default function BadgeDisplay({ badges, size = 'default', showTooltip = true }) {
  if (!badges || badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badgeId) => {
        const config = badgeConfig[badgeId];
        if (!config) return null;

        const Icon = config.icon;
        const sizeClass = size === 'small' ? 'w-6 h-6' : size === 'large' ? 'w-12 h-12' : 'w-8 h-8';
        
        return (
          <div
            key={badgeId}
            className="group relative"
            title={showTooltip ? `${config.name}: ${config.description}` : undefined}
          >
            <div className={`${sizeClass} rounded-full bg-gradient-to-br ${config.color} flex items-center justify-center shadow-lg ring-2 ring-white dark:ring-slate-800 transition-transform hover:scale-110`}>
              <Icon className={`${size === 'small' ? 'w-3 h-3' : size === 'large' ? 'w-6 h-6' : 'w-4 h-4'} text-white`} />
            </div>
            {showTooltip && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 dark:bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                <div className="font-semibold">{config.name}</div>
                <div className="text-slate-300">{config.description}</div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-800"></div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}