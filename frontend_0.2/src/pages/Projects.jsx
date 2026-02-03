import React, { useState, useEffect } from 'react';
import * as mockData from '@/components/mockData';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, FolderKanban, Calendar, Users, CheckCircle2, Clock, LayoutGrid, LayoutList } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ConsoleSidebar from '@/components/console/ConsoleSidebar';
import ConsoleHeader from '@/components/console/ConsoleHeader';
import GanttChart from '@/components/projects/GanttChart';
import { motion } from 'framer-motion';

const statusColors = {
  planning: 'bg-blue-100 text-blue-700',
  active: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-slate-100 text-slate-600',
  on_hold: 'bg-amber-100 text-amber-700'
};

export default function Projects() {
  const [role, setRole] = useState(() => localStorage.getItem('kraft_role') || 'manager');
  const [viewMode, setViewMode] = useState('grid');
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [agents, setAgents] = useState([]);

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
    setProjects(mockData.getAll('projects'));
    setTasks(mockData.getAll('tasks'));
    setAgents(mockData.getAll('agents'));
  };

  const getProjectStats = (projectId) => {
    const projectTasks = tasks.filter(t => t.project_id === projectId);
    const completed = projectTasks.filter(t => t.status === 'completed').length;
    const total = projectTasks.length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { total, completed, progress };
  };

  return (
    <div className="flex h-screen bg-neutral-100 dark:bg-slate-950 transition-colors">
      <ConsoleSidebar role={role} onRoleChange={setRole} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <ConsoleHeader role={role} onRoleChange={handleRoleChange} />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Projects</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Manage and track project progress</p>
              </div>
              <div className="flex items-center gap-2">
                {role === 'manager' && (
                  <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={viewMode === 'grid' ? 'bg-white dark:bg-slate-700' : ''}
                      onClick={() => setViewMode('grid')}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={viewMode === 'timeline' ? 'bg-white dark:bg-slate-700' : ''}
                      onClick={() => setViewMode('timeline')}
                    >
                      <LayoutList className="w-4 h-4" />
                    </Button>
                  </div>
                )}
                <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                  <Plus className="w-4 h-4" />
                  New Project
                </Button>
              </div>
            </div>

            {viewMode === 'timeline' && role === 'manager' ? (
              <GanttChart projects={projects} tasks={tasks} agents={agents} />
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project, index) => {
                const stats = getProjectStats(project.id);
                
                return (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link to={createPageUrl('Tasks') + `?project=${project.id}`}>
                      <Card className="border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all cursor-pointer group h-full">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                                <FolderKanban className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <CardTitle className="text-base font-semibold group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                  {project.name}
                                </CardTitle>
                              </div>
                            </div>
                            <Badge className={statusColors[project.status]}>
                              {project.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {project.description && (
                            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                              {project.description}
                            </p>
                          )}

                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-600 dark:text-slate-400">Progress</span>
                              <span className="font-medium text-slate-900 dark:text-slate-100">
                                {stats.completed} / {stats.total} tasks
                              </span>
                            </div>
                            <Progress value={stats.progress} className="h-2" />
                          </div>

                          <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
                            {project.team_members?.length > 0 && (
                              <div className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5" />
                                <span>{project.team_members.length} members</span>
                              </div>
                            )}
                            {project.end_date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>{new Date(project.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                );
                })}
              </div>
            )}

            {viewMode === 'grid' && projects.length === 0 && (
              <Card className="border-slate-200 dark:border-slate-800">
                <CardContent className="text-center py-12 text-slate-400">
                  <FolderKanban className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p className="text-lg font-medium">No projects yet</p>
                  <p className="text-sm mt-1">Create your first project to get started</p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}