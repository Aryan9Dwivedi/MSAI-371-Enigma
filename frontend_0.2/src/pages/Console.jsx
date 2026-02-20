import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import * as mockData from '@/components/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import BadgeDisplay from '@/components/gamification/BadgeDisplay';
import {
  ListTodo,
  Users,
  Target,
  AlertTriangle,
  TrendingUp,
  Clock,
  ArrowRight,
  Play,
  CheckCircle2,
  XCircle,
  Trophy,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import ConsoleSidebar from '@/components/console/ConsoleSidebar';
import ConsoleHeader from '@/components/console/ConsoleHeader';
import BottleneckInsights from '@/components/console/BottleneckInsights';

export default function Console() {
  const [role, setRole] = useState(() => localStorage.getItem('kraft_role') || 'manager');
  const [tasks, setTasks] = useState([]);
  const [agents, setAgents] = useState([]);
  const [allocations, setAllocations] = useState([]);

  useEffect(() => {
    setTasks(mockData.getAll('tasks'));
    setAgents(mockData.getAll('agents'));
    setAllocations(mockData.getAll('allocations'));
  }, []);

  useEffect(() => {
    localStorage.setItem('kraft_role', role);
  }, [role]);

  const unassignedTasks = tasks.filter(t => t.status === 'unassigned');
  const criticalTasks = tasks.filter(t => t.priority === 'critical' && t.status !== 'completed');
  const availableAgents = agents.filter(a => a.status === 'available');
  const overloadedAgents = agents.filter(a => (a.current_load || 0) > (a.availability_hours || 40) * 0.9);

  const stats = [
    { 
      label: 'Unassigned Tasks', 
      value: unassignedTasks.length, 
      total: tasks.length,
      icon: ListTodo, 
      color: 'text-amber-600',
      bgColor: 'bg-amber-50'
    },
    { 
      label: 'Available Agents', 
      value: availableAgents.length, 
      total: agents.length,
      icon: Users, 
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    { 
      label: 'Pending Approvals', 
      value: allocations.filter(a => a.status === 'proposed').length, 
      icon: Target, 
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    { 
      label: 'Bottlenecks', 
      value: overloadedAgents.length, 
      icon: AlertTriangle, 
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  ];

  return (
    <div className="flex h-screen bg-neutral-100 dark:bg-slate-950 transition-colors">
      <ConsoleSidebar role={role} onRoleChange={setRole} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <ConsoleHeader role={role} onRoleChange={setRole} />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Dashboard</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Overview of your team allocation status</p>
              </div>
              <Link to={createPageUrl('Allocation')}>
                <Button className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 gap-2 transition-all hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl">
                  <Play className="w-4 h-4" />
                  Run Allocation
                </Button>
              </Link>
            </div>

            {/* AI Insights */}
            <BottleneckInsights />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                >
                  <Card className="border-slate-100 dark:border-slate-800 dark:bg-slate-900 hover:shadow-lg transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
                          <div className="flex items-baseline gap-1 mt-1">
                            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</span>
                            {stat.total !== undefined && (
                              <span className="text-sm text-slate-400">/ {stat.total}</span>
                            )}
                          </div>
                        </div>
                        <div className={`p-2.5 rounded-xl ${stat.bgColor}`}>
                          <stat.icon className={`w-5 h-5 ${stat.color}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Critical Tasks */}
              <Card className="border-slate-100">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">Critical Tasks</CardTitle>
                    <Link to={createPageUrl('Tasks')}>
                      <Button variant="ghost" size="sm" className="text-indigo-600 gap-1">
                        View All <ArrowRight className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {criticalTasks.length === 0 ? (
                      <div className="text-center py-8 text-slate-400">
                        <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                        <p className="text-sm">No critical tasks pending</p>
                      </div>
                    ) : (
                      criticalTasks.slice(0, 4).map((task, idx) => (
                        <div key={`${task.id}-${idx}`} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                            <div>
                              <p className="text-sm font-medium text-slate-800">{task.title}</p>
                              <p className="text-xs text-slate-400">
                                {task.required_skills?.slice(0, 2).join(', ')}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-red-600 border-red-200">
                            Critical
                          </Badge>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Team Capacity */}
              <Card className="border-slate-100">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">Team Capacity</CardTitle>
                    <Link to={createPageUrl('Team')}>
                      <Button variant="ghost" size="sm" className="text-indigo-600 gap-1">
                        View All <ArrowRight className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {agents.slice(0, 4).map((agent, idx) => {
                      const utilization = ((agent.current_load || 0) / (agent.availability_hours || 40)) * 100;
                      const isOverloaded = utilization > 90;
                      
                      return (
                        <div key={`${agent.id}-${idx}`} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-medium text-indigo-700">
                                {agent.name?.charAt(0)}
                              </div>
                              <span className="text-sm font-medium text-slate-700">{agent.name}</span>
                            </div>
                            <span className={`text-xs font-medium ${isOverloaded ? 'text-red-600' : 'text-slate-500'}`}>
                              {agent.current_load || 0}h / {agent.availability_hours || 40}h
                            </span>
                          </div>
                          <Progress 
                            value={Math.min(utilization, 100)} 
                            className={`h-1.5 ${isOverloaded ? '[&>div]:bg-red-500' : '[&>div]:bg-indigo-500'}`}
                          />
                        </div>
                      );
                    })}
                    {agents.length === 0 && (
                      <div className="text-center py-8 text-slate-400">
                        <Users className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm">No agents configured</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="border-slate-100 dark:border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Recent Allocation Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {allocations.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                      <Target className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">No allocations yet</p>
                      <p className="text-xs mt-1">Run your first allocation to see results here</p>
                    </div>
                  ) : (
                    allocations.slice(0, 5).map((allocation, idx) => (
                      <div key={`${allocation.id}-${idx}`} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        <div className="flex items-center gap-3">
                          {allocation.status === 'approved' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : allocation.status === 'rejected' ? (
                            <XCircle className="w-4 h-4 text-red-500" />
                          ) : (
                            <Clock className="w-4 h-4 text-amber-500" />
                          )}
                          <div>
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                              Task assigned to agent
                            </p>
                            <p className="text-xs text-slate-400">
                              Confidence: {allocation.confidence}%
                            </p>
                          </div>
                        </div>
                        <Badge variant={allocation.status === 'approved' ? 'default' : 'secondary'}>
                          {allocation.status}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top Performers */}
            <Card className="border-slate-200 dark:border-slate-800 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/10 dark:to-yellow-950/10">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-600" />
                    Top Performers This Month
                  </CardTitle>
                  <Link to={createPageUrl('Achievements')}>
                    <Button variant="ghost" size="sm" className="text-amber-600 gap-1">
                      View All <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {agents
                    .sort((a, b) => (b.points || 0) - (a.points || 0))
                    .slice(0, 3)
                    .map((agent, index) => (
                      <div key={agent.id} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-amber-800">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                          index === 0 ? 'bg-gradient-to-br from-amber-400 to-yellow-500' :
                          index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400' :
                          'bg-gradient-to-br from-orange-400 to-amber-600'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{agent.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{agent.tasks_completed} tasks • {agent.on_time_completion_rate}% on-time</p>
                          <div className="mt-1.5">
                            <BadgeDisplay badges={agent.badges} size="small" showTooltip={false} />
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                            <Sparkles className="w-3 h-3" />
                            <span className="font-bold text-sm">{(agent.points || 0).toLocaleString()}</span>
                          </div>
                          <p className="text-[10px] text-slate-500">points</p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}