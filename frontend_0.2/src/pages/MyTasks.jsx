import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ListTodo,
  Clock,
  Calendar,
  CheckCircle2,
  Circle,
  ArrowRight
} from 'lucide-react';
import ConsoleSidebar from '@/components/console/ConsoleSidebar';
import ConsoleHeader from '@/components/console/ConsoleHeader';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

const priorityColors = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-slate-100 text-slate-600 border-slate-200'
};

export default function MyTasks() {
  const [role, setRole] = useState(() => localStorage.getItem('kraft_role') || 'user');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    localStorage.setItem('kraft_role', role);
  }, [role]);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: allocations = [] } = useQuery({
    queryKey: ['allocations'],
    queryFn: () => base44.entities.Allocation.list()
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list()
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => base44.entities.Agent.list()
  });

  // Get current user's agent profile
  const myAgent = agents.find(a => a.email === currentUser?.email) || agents[0];
  
  // Get tasks assigned to current user
  const myAllocations = allocations.filter(a => 
    a.agent_id === myAgent?.id && a.status === 'approved'
  );
  
  const myTasks = myAllocations.map(allocation => {
    const task = tasks.find(t => t.id === allocation.task_id);
    return { ...task, allocation };
  }).filter(t => t.id);

  const completedTasks = myTasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = myTasks.filter(t => t.status === 'in_progress').length;

  return (
    <div className="flex h-screen bg-slate-50">
      <ConsoleSidebar role={role} onRoleChange={setRole} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <ConsoleHeader role={role} onRoleChange={setRole} />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">My Tasks</h1>
              <p className="text-slate-500 mt-1">Tasks assigned to you by the allocation system</p>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="border-slate-100">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-50">
                      <ListTodo className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{myTasks.length}</p>
                      <p className="text-sm text-slate-500">Total Assigned</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-slate-100">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-50">
                      <Clock className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{inProgressTasks}</p>
                      <p className="text-sm text-slate-500">In Progress</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-slate-100">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-50">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{completedTasks}</p>
                      <p className="text-sm text-slate-500">Completed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Task List */}
            <Card className="border-slate-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Assigned Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {myTasks.length > 0 ? (
                    myTasks.map((task, index) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3">
                            {task.status === 'completed' ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5" />
                            ) : (
                              <Circle className="w-5 h-5 text-slate-300 mt-0.5" />
                            )}
                            <div>
                              <h3 className={`font-medium ${task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                                {task.title}
                              </h3>
                              {task.description && (
                                <p className="text-sm text-slate-500 mt-1 line-clamp-2">{task.description}</p>
                              )}
                            </div>
                          </div>
                          <Badge variant="outline" className={priorityColors[task.priority]}>
                            {task.priority}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-slate-500 ml-8">
                          {task.estimated_hours && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {task.estimated_hours}h estimated
                            </span>
                          )}
                          {task.deadline && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              Due {format(new Date(task.deadline), 'MMM d')}
                            </span>
                          )}
                        </div>

                        {task.required_skills?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3 ml-8">
                            {task.required_skills.map(skill => (
                              <Badge key={skill} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-slate-400">
                      <ListTodo className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                      <p className="text-lg font-medium">No tasks assigned</p>
                      <p className="text-sm mt-1">Tasks will appear here when allocated to you</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}