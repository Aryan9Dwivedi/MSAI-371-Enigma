import React, { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, differenceInDays, addDays, startOfWeek, endOfWeek, isToday, isFuture, isPast } from 'date-fns';

const priorityColors = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-amber-500',
  low: 'bg-slate-400'
};

const statusColors = {
  unassigned: 'bg-slate-300',
  assigned: 'bg-blue-400',
  in_progress: 'bg-indigo-500',
  completed: 'bg-emerald-500',
  blocked: 'bg-red-500'
};

export default function GanttChart({ projects, tasks, agents }) {
  const [viewMode, setViewMode] = useState('week');
  const [selectedProject, setSelectedProject] = useState(null);
  
  const timeline = useMemo(() => {
    if (!tasks.length) return null;

    // Get date range - include tasks without deadlines using created_date
    const allDates = tasks
      .map(t => {
        if (t.deadline) return new Date(t.deadline);
        if (t.created_date) return addDays(new Date(t.created_date), 7); // Default 1 week from creation
        return new Date();
      });
    
    if (!allDates.length) return null;

    const today = new Date();
    const minDate = startOfWeek(new Date(Math.min(...allDates, today)));
    const maxDate = endOfWeek(addDays(new Date(Math.max(...allDates)), 14)); // Add 2 weeks buffer
    const totalDays = Math.max(differenceInDays(maxDate, minDate), 28); // Minimum 4 weeks
    
    // Generate time markers based on view mode
    const markers = [];
    let currentDate = minDate;
    let increment = 7; // default to week
    
    switch(viewMode) {
      case 'day':
        increment = 1;
        break;
      case 'week':
        increment = 7;
        break;
      case 'month':
        increment = 30;
        break;
      case 'year':
        increment = 365;
        break;
    }
    
    while (currentDate <= maxDate) {
      markers.push(new Date(currentDate));
      currentDate = addDays(currentDate, increment);
    }

    return { minDate, maxDate, totalDays, markers, today, viewMode };
  }, [tasks, viewMode]);

  const getTaskPosition = (task) => {
    if (!timeline) return null;

    const taskDate = task.deadline ? new Date(task.deadline) : addDays(new Date(task.created_date || new Date()), 7);
    
    // Calculate width based on estimated hours (assume 1 day = 8 hours)
    const duration = task.estimated_hours || 8;
    const durationDays = Math.max(1, Math.ceil(duration / 8));
    
    const endDate = taskDate;
    const startDate = addDays(endDate, -durationDays);
    
    const daysFromStart = differenceInDays(startDate, timeline.minDate);
    const left = Math.max(0, (daysFromStart / timeline.totalDays) * 100);
    const width = Math.min((durationDays / timeline.totalDays) * 100, 100 - left);
    
    return { 
      left: `${left}%`, 
      width: `${width}%`,
      startDate,
      endDate
    };
  };

  const getAgentName = (agentId) => {
    const agent = agents.find(a => a.id === agentId);
    return agent?.name || 'Unassigned';
  };

  const getDependencyLine = (task, dependencyId) => {
    const depTask = tasks.find(t => t.id === dependencyId);
    if (!depTask?.deadline || !task.deadline) return null;
    
    const depPos = getTaskPosition(depTask);
    const taskPos = getTaskPosition(task);
    if (!depPos || !taskPos) return null;
    
    return { depPos, taskPos };
  };

  if (!timeline) {
    return (
      <Card className="border-slate-200 dark:border-slate-800">
        <CardContent className="p-8 text-center text-slate-400">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p>No timeline data available</p>
          <p className="text-sm mt-1">Tasks need deadlines to display on the timeline</p>
        </CardContent>
      </Card>
    );
  }

  const projectGroups = projects.map(project => ({
    ...project,
    tasks: tasks.filter(t => t.project_id === project.id)
  })).filter(p => p.tasks.length > 0);

  const filteredProjectGroups = selectedProject 
    ? projectGroups.filter(p => p.id === selectedProject)
    : projectGroups;

  const getTodayPosition = () => {
    if (!timeline) return null;
    const daysFromStart = differenceInDays(timeline.today, timeline.minDate);
    return (daysFromStart / timeline.totalDays) * 100;
  };

  const todayPosition = getTodayPosition();

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-lg">
      <CardHeader className="bg-gradient-to-br from-neutral-200 to-neutral-100 dark:from-slate-900 dark:to-slate-950 border-b-2 border-neutral-300 dark:border-slate-700">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-600 flex items-center justify-center shadow-lg">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <div>Project Timeline</div>
                <div className="text-sm font-normal text-slate-500 dark:text-slate-400">
                  {filteredProjectGroups.reduce((sum, p) => sum + p.tasks.length, 0)} tasks across {filteredProjectGroups.length} project(s)
                </div>
              </div>
            </CardTitle>
            <div className="flex items-center gap-2">
              {['week', 'month'].map((mode) => (
                <Button
                  key={mode}
                  variant={viewMode === mode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode(mode)}
                  className={`h-9 px-4 text-sm font-semibold transition-all ${
                    viewMode === mode 
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md hover:shadow-lg' 
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Project Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Filter:</span>
            <Button
              variant={selectedProject === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedProject(null)}
              className={`h-8 px-3 text-xs ${
                selectedProject === null 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              All Projects
            </Button>
            {projectGroups.map(project => (
              <Button
                key={project.id}
                variant={selectedProject === project.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedProject(project.id)}
                className={`h-8 px-3 text-xs ${
                  selectedProject === project.id 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {project.name} ({project.tasks.length})
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <div className="min-w-full inline-block">
            <div className="space-y-0">
              {/* Timeline Header */}
              <div className="sticky top-0 z-30 bg-gradient-to-b from-neutral-100 to-neutral-200 dark:from-slate-900 dark:to-slate-950 shadow-md">
                <div className="flex border-b-2 border-indigo-200 dark:border-indigo-900">
                  <div className="w-72 flex-shrink-0 px-6 py-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-900 dark:to-slate-950 border-r-2 border-indigo-200 dark:border-indigo-900">
                    <div className="text-base font-bold text-slate-900 dark:text-slate-100">Task Details</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
                      Agent • Duration • Priority
                    </div>
                  </div>
                  <div className="flex-1 relative bg-gradient-to-b from-neutral-200 to-neutral-100 dark:from-slate-950 dark:to-slate-900">
                    <div className="flex text-sm font-bold text-slate-800 dark:text-slate-200">
                      {timeline.markers.map((marker, i) => {
                        const isCurrent = isToday(marker) || 
                          (viewMode === 'week' && [0,1,2,3,4,5,6].some(d => isToday(addDays(marker, d))));
                        
                        let primaryLabel, secondaryLabel;
                        switch(viewMode) {
                          case 'day':
                            primaryLabel = format(marker, 'EEE d');
                            secondaryLabel = format(marker, 'MMM');
                            break;
                          case 'week':
                            primaryLabel = format(marker, 'MMM d');
                            secondaryLabel = format(marker, 'yyyy');
                            break;
                          case 'month':
                            primaryLabel = format(marker, 'MMMM');
                            secondaryLabel = format(marker, 'yyyy');
                            break;
                          case 'year':
                            primaryLabel = format(marker, 'yyyy');
                            secondaryLabel = 'Year';
                            break;
                        }
                        
                        return (
                          <div 
                            key={i} 
                            className={`flex-1 text-center py-3 border-r-2 last:border-r-0 transition-all ${
                              isCurrent 
                                ? 'bg-gradient-to-b from-indigo-100 to-indigo-50 dark:from-indigo-950 dark:to-indigo-900 border-indigo-300 dark:border-indigo-700' 
                                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                            }`}
                          >
                            <div className={`text-sm font-bold ${isCurrent ? 'text-indigo-700 dark:text-indigo-300' : ''}`}>
                              {primaryLabel}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                              {secondaryLabel}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Project Groups */}
              <div className="divide-y-2 divide-slate-200 dark:divide-slate-800">
                {filteredProjectGroups.map((project, idx) => (
                  <div key={project.id} className="bg-gradient-to-r from-neutral-100 to-neutral-200 dark:from-slate-900 dark:to-slate-950">
                    <div className="flex items-center gap-4 px-6 py-4 bg-gradient-to-r from-indigo-100/70 via-purple-50/40 to-transparent dark:from-indigo-950/40 dark:via-purple-950/20 dark:to-transparent border-b-2 border-indigo-200 dark:border-indigo-900 shadow-sm">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg ring-2 ring-indigo-200 dark:ring-indigo-800" />
                      <span className="font-bold text-base text-slate-900 dark:text-slate-100">
                        {project.name}
                      </span>
                      <Badge className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold px-3 py-1 shadow-md">
                        {project.tasks.length} Tasks
                      </Badge>
                      <div className="ml-auto text-xs text-slate-600 dark:text-slate-400 font-medium">
                        {project.status}
                      </div>
                    </div>

                    {/* Tasks */}
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {project.tasks.map((task, taskIdx) => {
                        const position = getTaskPosition(task);
                        if (!position) return null;
                        
                        const isOverdue = task.deadline && isPast(new Date(task.deadline)) && task.status !== 'completed';

                        return (
                          <div key={task.id} className="relative group hover:bg-gradient-to-r hover:from-indigo-50/30 hover:to-transparent dark:hover:from-indigo-950/20 transition-all">
                            <div className="flex items-center">
                              <div className="w-72 flex-shrink-0 px-6 py-4 border-r-2 border-slate-200 dark:border-slate-700">
                                <div className={`text-sm font-bold truncate mb-1.5 ${
                                  isOverdue ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'
                                }`}>
                                  {task.title}
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                  <span className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md font-medium text-slate-700 dark:text-slate-300">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                    {getAgentName(task.assigned_to)}
                                  </span>
                                  {task.estimated_hours && (
                                    <span className="flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-md font-semibold">
                                      <Clock className="w-3 h-3" />
                                      {task.estimated_hours}h
                                    </span>
                                  )}
                                  <Badge className={`${priorityColors[task.priority]} text-white text-xs font-bold`}>
                                    {task.priority}
                                  </Badge>
                                </div>
                              </div>
                              
                              <div className="flex-1 relative h-20 min-h-20">
                                {/* Vertical grid lines */}
                                <div className="absolute inset-0 flex pointer-events-none">
                                  {timeline.markers.map((marker, i) => {
                                    const isCurrent = isToday(marker) || 
                                      (viewMode === 'week' && [1,2,3,4,5,6].some(d => isToday(addDays(marker, d))));
                                    return (
                                      <div 
                                        key={i} 
                                        className={`flex-1 border-r-2 ${
                                          isCurrent 
                                            ? 'border-indigo-300 dark:border-indigo-700 bg-gradient-to-b from-indigo-100/50 to-indigo-50/20 dark:from-indigo-950/30 dark:to-indigo-950/10' 
                                            : 'border-slate-150 dark:border-slate-800'
                                        }`}
                                      />
                                    );
                                  })}
                                </div>
                                
                                {/* Today indicator */}
                                {todayPosition !== null && todayPosition >= 0 && todayPosition <= 100 && taskIdx === 0 && (
                                  <div 
                                    className="absolute -top-6 bottom-0 w-1 bg-gradient-to-b from-red-500 to-red-600 z-20 shadow-xl"
                                    style={{ left: `${todayPosition}%` }}
                                  >
                                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-extrabold rounded-lg shadow-2xl whitespace-nowrap uppercase tracking-wider">
                                      TODAY
                                    </div>
                                  </div>
                                )}

                          {/* Dependency lines */}
                          {task.dependencies?.map(depId => {
                            const line = getDependencyLine(task, depId);
                            if (!line) return null;
                            return (
                              <div
                                key={depId}
                                className="absolute top-1/2 h-px bg-slate-300 dark:bg-slate-600 pointer-events-none"
                                style={{
                                  left: line.depPos.left,
                                  width: `calc(${parseFloat(line.taskPos.left) - parseFloat(line.depPos.left) - parseFloat(line.depPos.width)}%)`
                                }}
                              >
                                <ArrowRight className="w-3 h-3 text-slate-400 absolute right-0 -top-1.5" />
                              </div>
                            );
                          })}

                                {/* Enhanced Task Bar */}
                                <div
                                  className="absolute top-1/2 -translate-y-1/2 h-12 rounded-xl transition-all cursor-pointer overflow-hidden shadow-lg hover:shadow-2xl border-2 border-white/30"
                                  style={{
                                    left: position.left,
                                    width: position.width,
                                    background: `linear-gradient(135deg, ${statusColors[task.status]} 0%, ${statusColors[task.status]}dd 50%, ${statusColors[task.status]}bb 100%)`,
                                    transform: 'translateY(-50%)',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)';
                                    e.currentTarget.style.zIndex = '30';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-50%)';
                                    e.currentTarget.style.zIndex = '10';
                                  }}
                                >
                                  {/* Shimmer effect */}
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />

                                  {/* Priority stripe */}
                                  <div className={`absolute left-0 top-0 bottom-0 w-2 ${priorityColors[task.priority]} shadow-lg`} />

                                  <div className="relative flex items-center justify-between h-full pl-4 pr-3 gap-3">
                                    {/* Task info */}
                                    <div className="flex-1 min-w-0">
                                      <div className="text-xs font-bold text-white truncate drop-shadow-sm">
                                        {task.title}
                                      </div>
                                      <div className="text-[10px] text-white/80 mt-0.5 flex items-center gap-1">
                                        <span>{Math.ceil((task.estimated_hours || 8) / 8)}d</span>
                                        {isOverdue && <span className="text-red-200 font-bold">• OVERDUE</span>}
                                      </div>
                                    </div>

                                    {/* Status badge */}
                                    <div className="px-2.5 py-1 bg-white/30 backdrop-blur-sm rounded-lg text-[10px] font-bold text-white shadow-md">
                                      {task.status === 'completed' && '✓'}
                                      {task.status === 'in_progress' && '▶'}
                                      {task.status === 'blocked' && '⚠'}
                                      {task.status === 'assigned' && '→'}
                                    </div>
                                  </div>
                                </div>

                                {/* Tooltip on hover */}
                                <div className="absolute left-0 top-full mt-4 w-80 p-5 bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 text-white text-xs rounded-xl shadow-2xl z-40 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none border border-slate-600 backdrop-blur-sm"
                                  style={{
                                    transform: 'translateY(-4px)',
                                    transition: 'opacity 0.2s ease, transform 0.2s ease'
                                  }}>
                                  <div className="flex items-start justify-between mb-3 pb-3 border-b border-slate-700">
                                    <div className="font-bold text-sm text-white pr-2">{task.title}</div>
                                    {isOverdue && (
                                      <Badge className="bg-red-500/90 text-white text-[9px] font-bold uppercase">
                                        Overdue
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="space-y-2.5 text-slate-300">
                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="space-y-1">
                                        <div className="text-[10px] uppercase tracking-wider text-slate-500">Priority</div>
                                        <Badge className={`${priorityColors[task.priority]} text-white text-[10px] font-bold`}>
                                          {task.priority}
                                        </Badge>
                                      </div>
                                      <div className="space-y-1">
                                        <div className="text-[10px] uppercase tracking-wider text-slate-500">Status</div>
                                        <Badge className={`${statusColors[task.status]} text-white text-[10px] font-bold`}>
                                          {task.status.replace('_', ' ')}
                                        </Badge>
                                      </div>
                                    </div>
                                    
                                    <div className="pt-2 space-y-2 border-t border-slate-700/50">
                                      {task.estimated_hours && (
                                        <div className="flex items-center justify-between py-1.5 bg-slate-800/50 rounded px-2">
                                          <span className="text-slate-400 flex items-center gap-1.5">
                                            <Clock className="w-3 h-3" />
                                            Duration
                                          </span>
                                          <span className="font-semibold text-white">{task.estimated_hours}h <span className="text-slate-400 font-normal">({Math.ceil(task.estimated_hours / 8)}d)</span></span>
                                        </div>
                                      )}
                                      <div className="flex items-center justify-between py-1.5 bg-slate-800/50 rounded px-2">
                                        <span className="text-slate-400 flex items-center gap-1.5">
                                          <Calendar className="w-3 h-3" />
                                          Timeline
                                        </span>
                                        <span className="font-semibold text-white">
                                          {format(position.startDate, 'MMM d')} → {format(position.endDate, 'MMM d')}
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between py-1.5 bg-slate-800/50 rounded px-2">
                                        <span className="text-slate-400">Assigned to</span>
                                        <span className="font-semibold text-white">{getAgentName(task.assigned_to)}</span>
                                      </div>
                                      {task.dependencies?.length > 0 && (
                                        <div className="flex items-center justify-between py-1.5 bg-amber-900/20 border border-amber-700/30 rounded px-2">
                                          <span className="text-amber-200 flex items-center gap-1.5">
                                            <ArrowRight className="w-3 h-3" />
                                            Dependencies
                                          </span>
                                          <span className="font-semibold text-amber-100">{task.dependencies.length} task(s)</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              </div>
                              </div>
                              );
                              })}
                              </div>
                              </div>
                              ))}
                              </div>

                              {/* Legend */}
                              <div className="px-6 py-5 bg-gradient-to-br from-neutral-200 to-neutral-100 dark:from-slate-900 dark:to-slate-950 border-t-2 border-neutral-300 dark:border-slate-700">
                                <div className="flex flex-wrap gap-8 items-center justify-center">
                                  <div className="flex items-center gap-4">
                                    <div className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Status:</div>
                                    <div className="flex gap-2">
                                      {Object.entries(statusColors).map(([status, color]) => (
                                        <div key={status} className="flex items-center gap-2 px-3 py-2 bg-neutral-100 dark:bg-slate-800 rounded-lg border-2 border-neutral-300 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                                          <div className={`w-4 h-4 rounded ${color} shadow-md`} />
                                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 capitalize">
                                            {status.replace('_', ' ')}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Priority:</div>
                                    <div className="flex gap-2">
                                      {Object.entries(priorityColors).map(([priority, color]) => (
                                        <div key={priority} className="flex items-center gap-2 px-3 py-2 bg-neutral-100 dark:bg-slate-800 rounded-lg border-2 border-neutral-300 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                                          <div className={`w-4 h-4 rounded-full ${color} shadow-md`} />
                                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 capitalize">{priority}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              </div>
                              </div>
                              </div>
                              </CardContent>
                              </Card>
  );
}