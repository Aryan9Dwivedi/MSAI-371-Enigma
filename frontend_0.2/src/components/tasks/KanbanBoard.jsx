import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  User, 
  AlertCircle, 
  CheckCircle2,
  Circle,
  Link2,
  Plus
} from 'lucide-react';
import { motion } from 'framer-motion';

const columns = [
  { id: 'unassigned', title: 'Unassigned', icon: Circle, color: 'slate' },
  { id: 'assigned', title: 'Assigned', icon: User, color: 'blue' },
  { id: 'in_progress', title: 'In Progress', icon: Clock, color: 'amber' },
  { id: 'completed', title: 'Completed', icon: CheckCircle2, color: 'emerald' },
  { id: 'blocked', title: 'Blocked', icon: AlertCircle, color: 'red' }
];

const priorityColors = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-500'
};

export default function KanbanBoard({ tasks, agents, onTaskUpdate, onTaskClick }) {
  const getAgentName = (agentId) => {
    const agent = agents.find(a => a.id === agentId);
    return agent?.name || 'Unassigned';
  };

  const getTasksByStatus = (status) => {
    return tasks.filter(task => task.status === status);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const { draggableId, destination } = result;
    const task = tasks.find(t => t.id === draggableId);
    
    if (task && task.status !== destination.droppableId) {
      onTaskUpdate(task.id, { status: destination.droppableId });
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => {
          const columnTasks = getTasksByStatus(column.id);
          const Icon = column.icon;
          
          return (
            <div key={column.id} className="flex-shrink-0 w-80">
              <div className={`mb-3 flex items-center justify-between p-3 bg-${column.color}-50 dark:bg-${column.color}-950/20 rounded-lg border border-${column.color}-200 dark:border-${column.color}-800`}>
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 text-${column.color}-600`} />
                  <span className={`font-semibold text-${column.color}-900 dark:text-${column.color}-100`}>
                    {column.title}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {columnTasks.length}
                  </Badge>
                </div>
              </div>

              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-2 min-h-[500px] p-2 rounded-lg transition-colors ${
                      snapshot.isDraggingOver ? 'bg-slate-100 dark:bg-slate-800' : 'bg-transparent'
                    }`}
                  >
                    {columnTasks.map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <motion.div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <Card
                              className={`cursor-pointer transition-all hover:shadow-md ${
                                snapshot.isDragging ? 'shadow-2xl rotate-2' : ''
                              }`}
                              onClick={() => onTaskClick?.(task)}
                            >
                              <CardContent className="p-4 space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 line-clamp-2">
                                    {task.title}
                                  </h4>
                                  <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${priorityColors[task.priority]}`} />
                                </div>

                                {task.description && (
                                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                                    {task.description}
                                  </p>
                                )}

                                <div className="flex flex-wrap gap-1">
                                  {task.required_skills?.slice(0, 2).map(skill => (
                                    <Badge key={skill} variant="outline" className="text-[10px] px-1.5 py-0">
                                      {skill}
                                    </Badge>
                                  ))}
                                  {task.required_skills?.length > 2 && (
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                      +{task.required_skills.length - 2}
                                    </Badge>
                                  )}
                                </div>

                                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                                  {task.assigned_to && (
                                    <div className="flex items-center gap-1">
                                      <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                                        <span className="text-[10px] font-medium text-indigo-700 dark:text-indigo-300">
                                          {getAgentName(task.assigned_to).charAt(0)}
                                        </span>
                                      </div>
                                      <span>{getAgentName(task.assigned_to).split(' ')[0]}</span>
                                    </div>
                                  )}
                                  
                                  {task.deadline && (
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </div>
                                  )}
                                </div>

                                {(task.dependencies?.length > 0 || task.parent_task_id) && (
                                  <div className="flex items-center gap-2 text-xs text-slate-500">
                                    {task.dependencies?.length > 0 && (
                                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                        <Link2 className="w-2.5 h-2.5 mr-1" />
                                        {task.dependencies.length} deps
                                      </Badge>
                                    )}
                                    {task.parent_task_id && (
                                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                        Subtask
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          </motion.div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}