import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  Database,
  Users,
  ListTodo,
  Shield,
  Clock,
  CheckCircle2,
  Server
} from 'lucide-react';
import ConsoleSidebar from '@/components/console/ConsoleSidebar';
import ConsoleHeader from '@/components/console/ConsoleHeader';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

export default function AdminOverview() {
  const [role, setRole] = useState(() => localStorage.getItem('kraft_role') || 'admin');

  useEffect(() => {
    localStorage.setItem('kraft_role', role);
  }, [role]);

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list()
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => base44.entities.Agent.list()
  });

  const { data: constraints = [] } = useQuery({
    queryKey: ['constraints'],
    queryFn: () => base44.entities.Constraint.list()
  });

  const { data: allocationRuns = [] } = useQuery({
    queryKey: ['allocationRuns'],
    queryFn: () => base44.entities.AllocationRun.list('-created_date', 5)
  });

  const stats = [
    { label: 'Total Tasks', value: tasks.length, icon: ListTodo, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Agents', value: agents.length, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Active Constraints', value: constraints.filter(c => c.is_active).length, icon: Shield, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Allocation Runs', value: allocationRuns.length, icon: Activity, color: 'text-amber-600', bg: 'bg-amber-50' }
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      <ConsoleSidebar role={role} onRoleChange={setRole} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <ConsoleHeader role={role} onRoleChange={setRole} />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Admin Overview</h1>
              <p className="text-slate-500 mt-1">System status and knowledge summary</p>
            </div>

            {/* System Status */}
            <Card className="border-slate-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Server className="w-4 h-4 text-slate-500" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm font-medium text-slate-700">Backend Online</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm text-slate-500">Database Connected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm text-slate-500">Reasoning Engine Ready</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Knowledge Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="border-slate-100">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-500">{stat.label}</p>
                          <p className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</p>
                        </div>
                        <div className={`p-3 rounded-xl ${stat.bg}`}>
                          <stat.icon className={`w-5 h-5 ${stat.color}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Recent Allocation Runs */}
            <Card className="border-slate-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  Recent Allocation Runs
                </CardTitle>
              </CardHeader>
              <CardContent>
                {allocationRuns.length > 0 ? (
                  <div className="space-y-3">
                    {allocationRuns.map((run) => (
                      <div key={run.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className={`w-2 h-2 rounded-full ${
                            run.status === 'completed' ? 'bg-emerald-500' :
                            run.status === 'failed' ? 'bg-red-500' : 'bg-amber-500'
                          }`} />
                          <div>
                            <p className="font-medium text-slate-800">
                              {run.strategy?.replace('_', ' ')} strategy
                            </p>
                            <p className="text-sm text-slate-500">
                              {run.tasks_processed} tasks • {run.successful_allocations} successful
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={
                            run.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                            run.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                          }>
                            {run.status}
                          </Badge>
                          <p className="text-xs text-slate-400 mt-1">
                            {run.created_date ? format(new Date(run.created_date), 'MMM d, HH:mm') : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <Activity className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm">No allocation runs yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Knowledge Breakdown */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-slate-100">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Tasks by Priority</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {['critical', 'high', 'medium', 'low'].map((priority) => {
                      const count = tasks.filter(t => t.priority === priority).length;
                      const percentage = tasks.length > 0 ? (count / tasks.length) * 100 : 0;
                      const colors = {
                        critical: 'bg-red-500',
                        high: 'bg-orange-500',
                        medium: 'bg-amber-500',
                        low: 'bg-slate-400'
                      };
                      
                      return (
                        <div key={priority} className="flex items-center gap-3">
                          <span className="text-sm text-slate-600 capitalize w-20">{priority}</span>
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${colors[priority]} rounded-full transition-all`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-slate-700 w-8">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-100">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">Agents by Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {['available', 'busy', 'away', 'offline'].map((status) => {
                      const count = agents.filter(a => a.status === status).length;
                      const percentage = agents.length > 0 ? (count / agents.length) * 100 : 0;
                      const colors = {
                        available: 'bg-emerald-500',
                        busy: 'bg-amber-500',
                        away: 'bg-slate-400',
                        offline: 'bg-red-500'
                      };
                      
                      return (
                        <div key={status} className="flex items-center gap-3">
                          <span className="text-sm text-slate-600 capitalize w-20">{status}</span>
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${colors[status]} rounded-full transition-all`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-slate-700 w-8">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}