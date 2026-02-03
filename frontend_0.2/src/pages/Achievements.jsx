import React, { useState, useEffect } from 'react';
import * as mockData from '@/components/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, TrendingUp, Award, Star, Medal, Crown, Sparkles } from 'lucide-react';
import ConsoleSidebar from '@/components/console/ConsoleSidebar';
import ConsoleHeader from '@/components/console/ConsoleHeader';
import BadgeDisplay from '@/components/gamification/BadgeDisplay';
import { motion } from 'framer-motion';

export default function Achievements() {
  const [role, setRole] = useState(() => localStorage.getItem('kraft_role') || 'manager');
  const [agents, setAgents] = useState([]);

  useEffect(() => {
    localStorage.setItem('kraft_role', role);
  }, [role]);

  const handleRoleChange = (newRole) => {
    setRole(newRole);
  };

  useEffect(() => {
    setAgents(mockData.getAll('agents'));
  }, []);

  const leaderboard = [...agents]
    .sort((a, b) => (b.points || 0) - (a.points || 0))
    .slice(0, 10);

  const topPerformer = leaderboard[0];

  const stats = {
    totalPoints: agents.reduce((sum, a) => sum + (a.points || 0), 0),
    totalBadges: agents.reduce((sum, a) => sum + (a.badges?.length || 0), 0),
    avgCompletionRate: agents.length > 0 
      ? Math.round(agents.reduce((sum, a) => sum + (a.on_time_completion_rate || 0), 0) / agents.length)
      : 0,
    topConfidence: Math.max(...agents.map(a => a.avg_confidence_score || 0))
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      <ConsoleSidebar role={role} onRoleChange={setRole} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <ConsoleHeader role={role} onRoleChange={handleRoleChange} />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Trophy className="w-7 h-7 text-amber-500" />
                  Achievements & Leaderboard
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Track team performance and celebrate success</p>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Points', value: stats.totalPoints.toLocaleString(), icon: Star, color: 'amber' },
                { label: 'Badges Earned', value: stats.totalBadges, icon: Award, color: 'indigo' },
                { label: 'Avg On-Time Rate', value: `${stats.avgCompletionRate}%`, icon: TrendingUp, color: 'emerald' },
                { label: 'Top Confidence', value: `${stats.topConfidence}%`, icon: Sparkles, color: 'violet' }
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="border-slate-200 dark:border-slate-800 h-full">
                    <CardContent className="p-5 h-full">
                      <div className="flex items-start justify-between h-full">
                        <div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
                          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{stat.value}</p>
                        </div>
                        <div className={`p-2.5 rounded-xl bg-${stat.color}-50 dark:bg-${stat.color}-950/20`}>
                          <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Leaderboard */}
              <div className="lg:col-span-2">
                <Card className="border-slate-200 dark:border-slate-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Crown className="w-5 h-5 text-amber-500" />
                      Leaderboard
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {leaderboard.map((agent, index) => {
                        const rankColors = {
                          0: 'from-amber-400 to-yellow-500',
                          1: 'from-slate-300 to-slate-400',
                          2: 'from-orange-400 to-amber-600'
                        };
                        
                        return (
                          <motion.div
                            key={agent.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`p-4 rounded-xl ${
                              index === 0 
                                ? 'bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 border-2 border-amber-300 dark:border-amber-800' 
                                : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                                index < 3 
                                  ? `bg-gradient-to-br ${rankColors[index]} shadow-lg`
                                  : 'bg-slate-300 dark:bg-slate-700'
                              }`}>
                                {index === 0 ? <Crown className="w-5 h-5" /> : index + 1}
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                                    {agent.name}
                                  </span>
                                  {index === 0 && (
                                    <Badge className="bg-amber-500 text-white">Top Performer</Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                  <span>{agent.role}</span>
                                  <span>•</span>
                                  <span>{agent.tasks_completed} tasks</span>
                                  <span>•</span>
                                  <span>{agent.on_time_completion_rate}% on-time</span>
                                </div>
                                <div className="mt-2">
                                  <BadgeDisplay badges={agent.badges} size="small" />
                                </div>
                              </div>
                              
                              <div className="text-right">
                                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                                  {(agent.points || 0).toLocaleString()}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">points</div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Top Performer Spotlight */}
              <div className="space-y-6">
                {topPerformer && (
                  <Card className="border-2 border-amber-300 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Medal className="w-5 h-5 text-amber-600" />
                        Top Performer
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center">
                        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center mb-3 shadow-xl ring-4 ring-amber-200 dark:ring-amber-900">
                          <span className="text-2xl font-bold text-white">
                            {topPerformer.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                          {topPerformer.name}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{topPerformer.role}</p>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-slate-600 dark:text-slate-400">Tasks Completed</span>
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                              {topPerformer.tasks_completed}
                            </span>
                          </div>
                          <Progress value={(topPerformer.tasks_completed / 50) * 100} className="h-2" />
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-slate-600 dark:text-slate-400">On-Time Rate</span>
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                              {topPerformer.on_time_completion_rate}%
                            </span>
                          </div>
                          <Progress value={topPerformer.on_time_completion_rate} className="h-2" />
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-slate-600 dark:text-slate-400">Confidence Score</span>
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                              {topPerformer.avg_confidence_score}%
                            </span>
                          </div>
                          <Progress value={topPerformer.avg_confidence_score} className="h-2" />
                        </div>
                      </div>

                      <div className="pt-3 border-t border-amber-200 dark:border-amber-800">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Badges Earned</p>
                        <BadgeDisplay badges={topPerformer.badges} size="default" />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Recent Achievements */}
                <Card className="border-slate-200 dark:border-slate-800">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-violet-600" />
                      Recent Achievements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="p-3 bg-violet-50 dark:bg-violet-950/20 rounded-lg border border-violet-200 dark:border-violet-800">
                        <div className="flex items-start gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center flex-shrink-0">
                            <Award className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                              Sarah earned "Skill Master"
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">2 hours ago</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                        <div className="flex items-start gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0">
                            <Star className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                              Marcus reached 2,000 points
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">5 hours ago</p>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-start gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center flex-shrink-0">
                            <Trophy className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                              Elena earned "Team Player"
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">1 day ago</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}