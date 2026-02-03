import React, { useState, useEffect } from 'react';
import * as mockData from '@/components/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  TrendingUp, 
  TrendingDown,
  BarChart3, 
  PieChart, 
  Activity,
  Target,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import ConsoleSidebar from '@/components/console/ConsoleSidebar';
import ConsoleHeader from '@/components/console/ConsoleHeader';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function Analytics() {
  const [role, setRole] = useState(() => localStorage.getItem('kraft_role') || 'manager');
  const [tasks, setTasks] = useState([]);
  const [agents, setAgents] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    localStorage.setItem('kraft_role', role);
  }, [role]);

  const handleRoleChange = (newRole) => {
    setRole(newRole);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setTasks(mockData.getAll('tasks'));
    setAgents(mockData.getAll('agents'));
    setAllocations(mockData.getAll('allocations'));
    setProjects(mockData.getAll('projects'));
  };

  const analytics = {
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.status === 'completed').length,
    inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
    blockedTasks: tasks.filter(t => t.status === 'blocked').length,
    completionRate: tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0,
    
    totalAgents: agents.length,
    activeAgents: agents.filter(a => a.status === 'available' || a.status === 'busy').length,
    avgUtilization: agents.length > 0 ? Math.round(agents.reduce((acc, a) => acc + ((a.current_load || 0) / (a.availability_hours || 40)), 0) / agents.length * 100) : 0,
    
    allocationSuccessRate: allocations.length > 0 ? Math.round((allocations.filter(a => a.status === 'approved').length / allocations.length) * 100) : 0,
    avgConfidence: allocations.length > 0 ? Math.round(allocations.reduce((acc, a) => acc + (a.confidence || 0), 0) / allocations.length) : 0,
    
    criticalTasks: tasks.filter(t => t.priority === 'critical').length,
    overdueTasks: tasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'completed').length,
  };

  const topPerformers = agents
    .map(agent => ({
      ...agent,
      completedTasks: tasks.filter(t => t.assigned_to === agent.id && t.status === 'completed').length,
      utilization: ((agent.current_load || 0) / (agent.availability_hours || 40)) * 100
    }))
    .sort((a, b) => b.completedTasks - a.completedTasks)
    .slice(0, 5);

  const bottlenecks = mockData.analyzeBottlenecks();

  const exportReport = () => {
    const report = {
      generated: new Date().toISOString(),
      summary: analytics,
      topPerformers,
      bottlenecks: bottlenecks.analysis,
      tasks: tasks.map(t => ({
        title: t.title,
        status: t.status,
        priority: t.priority,
        assigned_to: agents.find(a => a.id === t.assigned_to)?.name
      }))
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kraft-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Report exported successfully');
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
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Analytics & Reports</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">AI-driven insights and performance metrics</p>
              </div>
              <Button onClick={exportReport} className="gap-2">
                <Download className="w-4 h-4" />
                Export Report
              </Button>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Completion Rate', value: `${analytics.completionRate}%`, icon: CheckCircle2, color: 'emerald', trend: '+12%' },
                { label: 'Avg Utilization', value: `${analytics.avgUtilization}%`, icon: Activity, color: 'blue', trend: '+5%' },
                { label: 'Allocation Success', value: `${analytics.allocationSuccessRate}%`, icon: Target, color: 'indigo', trend: '+8%' },
                { label: 'Active Projects', value: projects.filter(p => p.status === 'active').length, icon: BarChart3, color: 'violet', trend: '+2' }
              ].map((metric, i) => (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="border-slate-200 dark:border-slate-800">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{metric.label}</p>
                          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{metric.value}</p>
                          <div className="flex items-center gap-1 mt-2">
                            <TrendingUp className="w-3 h-3 text-emerald-600" />
                            <span className="text-xs text-emerald-600">{metric.trend}</span>
                          </div>
                        </div>
                        <div className={`p-2.5 rounded-xl bg-${metric.color}-50 dark:bg-${metric.color}-950/20`}>
                          <metric.icon className={`w-5 h-5 text-${metric.color}-600`} />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Top Performers */}
              <Card className="border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Users className="w-4 h-4 text-indigo-600" />
                    Top Performers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {topPerformers.map((agent, i) => (
                      <div key={agent.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                            <span className="text-sm font-semibold text-white">{i + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-slate-100">{agent.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{agent.role}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-slate-900 dark:text-slate-100">{agent.completedTasks} tasks</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{Math.round(agent.utilization)}% utilized</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Bottleneck Summary */}
              <Card className="border-slate-200 dark:border-slate-800">
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Current Bottlenecks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {bottlenecks.analysis.bottlenecks.map((bottleneck, i) => (
                      <div key={i} className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <Badge className={
                            bottleneck.severity === 'high' ? 'bg-red-100 text-red-700' :
                            bottleneck.severity === 'medium' ? 'bg-amber-100 text-amber-700' :
                            'bg-blue-100 text-blue-700'
                          }>
                            {bottleneck.severity}
                          </Badge>
                          <span className="text-xs text-slate-500">{bottleneck.type}</span>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{bottleneck.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AI Recommendations */}
            <Card className="border-slate-200 dark:border-slate-800 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/20 dark:to-violet-950/20">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Target className="w-4 h-4 text-indigo-600" />
                  AI-Driven Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {bottlenecks.analysis.recommendations.map((rec, i) => (
                    <div key={i} className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-indigo-200 dark:border-indigo-800">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-medium text-slate-900 dark:text-slate-100 text-sm">{rec.action}</p>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{rec.impact}</p>
                        </div>
                        <Badge variant="outline" className={
                          rec.priority === 'high' ? 'border-red-300 text-red-700' :
                          rec.priority === 'medium' ? 'border-amber-300 text-amber-700' :
                          'border-blue-300 text-blue-700'
                        }>
                          {rec.priority}
                        </Badge>
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