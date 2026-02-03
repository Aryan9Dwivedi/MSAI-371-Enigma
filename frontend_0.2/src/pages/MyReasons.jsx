import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Lightbulb,
  CheckCircle2,
  ArrowRight,
  Target,
  Award,
  Scale,
  Shield
} from 'lucide-react';
import ConsoleSidebar from '@/components/console/ConsoleSidebar';
import ConsoleHeader from '@/components/console/ConsoleHeader';
import { motion } from 'framer-motion';

export default function MyReasons() {
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

  const myAgent = agents.find(a => a.email === currentUser?.email) || agents[0];
  const myAllocations = allocations.filter(a => 
    a.agent_id === myAgent?.id && a.status === 'approved'
  );

  const getTaskById = (id) => tasks.find(t => t.id === id);

  return (
    <div className="flex h-screen bg-slate-50">
      <ConsoleSidebar role={role} onRoleChange={setRole} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <ConsoleHeader role={role} onRoleChange={setRole} />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Assignment Reasoning</h1>
              <p className="text-slate-500 mt-1">Understand why tasks were assigned to you</p>
            </div>

            <Card className="border-slate-100 bg-gradient-to-br from-indigo-50/50 to-violet-50/50">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-indigo-100">
                    <Lightbulb className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-1">How KRAFT assigns tasks</h3>
                    <p className="text-sm text-slate-600">
                      KRAFT considers your skills, availability, and current workload to find the best match for each task. 
                      Below you can see the reasoning behind each assignment.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {myAllocations.length > 0 ? (
                myAllocations.map((allocation, index) => {
                  const task = getTaskById(allocation.task_id);
                  if (!task) return null;

                  return (
                    <motion.div
                      key={allocation.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="border-slate-100">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Target className="w-5 h-5 text-indigo-600" />
                              <CardTitle className="text-base">{task.title}</CardTitle>
                            </div>
                            <Badge className="bg-emerald-100 text-emerald-700">
                              {allocation.confidence}% confidence
                            </Badge>
                          </div>
                          {task.description && (
                            <CardDescription className="mt-2">{task.description}</CardDescription>
                          )}
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {allocation.reasoning?.skill_match && (
                              <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg">
                                <Award className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-xs font-medium text-emerald-700 uppercase tracking-wider mb-1">
                                    Skill Match
                                  </p>
                                  <p className="text-sm text-emerald-800">{allocation.reasoning.skill_match}</p>
                                </div>
                              </div>
                            )}

                            {allocation.reasoning?.constraint_satisfaction && (
                              <div className="flex items-start gap-3 p-3 bg-violet-50 rounded-lg">
                                <Shield className="w-4 h-4 text-violet-600 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-xs font-medium text-violet-700 uppercase tracking-wider mb-1">
                                    Constraints
                                  </p>
                                  <p className="text-sm text-violet-800">{allocation.reasoning.constraint_satisfaction}</p>
                                </div>
                              </div>
                            )}

                            {allocation.reasoning?.load_balance && (
                              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                                <Scale className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="text-xs font-medium text-blue-700 uppercase tracking-wider mb-1">
                                    Workload Balance
                                  </p>
                                  <p className="text-sm text-blue-800">{allocation.reasoning.load_balance}</p>
                                </div>
                              </div>
                            )}

                            {allocation.reasoning?.summary && (
                              <div className="p-3 bg-slate-100 rounded-lg">
                                <p className="text-sm text-slate-700">
                                  <strong>Summary:</strong> {allocation.reasoning.summary}
                                </p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })
              ) : (
                <Card className="border-slate-100">
                  <CardContent className="text-center py-12 text-slate-400">
                    <Lightbulb className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p className="text-lg font-medium">No assignments yet</p>
                    <p className="text-sm mt-1">When tasks are assigned to you, you'll see the reasoning here</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}