import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  Users,
  ListTodo,
  Shield,
  ArrowRight,
  Lightbulb,
  Link2
} from 'lucide-react';
import ConsoleSidebar from '@/components/console/ConsoleSidebar';
import ConsoleHeader from '@/components/console/ConsoleHeader';
import { motion } from 'framer-motion';

export default function Insights() {
  const [role, setRole] = useState(() => localStorage.getItem('kraft_role') || 'manager');
  const [selectedNode, setSelectedNode] = useState(null);

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

  const { data: allocations = [] } = useQuery({
    queryKey: ['allocations'],
    queryFn: () => base44.entities.Allocation.list()
  });

  // Calculate skill coverage
  const allRequiredSkills = [...new Set(tasks.flatMap(t => t.required_skills || []))];
  const allAgentSkills = [...new Set(agents.flatMap(a => a.skills || []))];
  const uncoveredSkills = allRequiredSkills.filter(s => !allAgentSkills.includes(s));

  // Calculate agent utilization
  const agentUtilization = agents.map(agent => {
    const assignedTasks = allocations.filter(a => a.agent_id === agent.id && a.status === 'approved');
    return {
      ...agent,
      assignedCount: assignedTasks.length,
      utilization: ((agent.current_load || 0) / (agent.availability_hours || 40)) * 100
    };
  });

  const getNodeInfo = () => {
    if (!selectedNode) return null;
    
    if (selectedNode.type === 'task') {
      const task = tasks.find(t => t.id === selectedNode.id);
      const allocation = allocations.find(a => a.task_id === task?.id);
      const assignedAgent = allocation ? agents.find(a => a.id === allocation.agent_id) : null;
      
      return {
        type: 'Task',
        title: task?.title,
        details: [
          { label: 'Priority', value: task?.priority },
          { label: 'Status', value: task?.status },
          { label: 'Required Skills', value: task?.required_skills?.join(', ') || 'None' },
          { label: 'Assigned To', value: assignedAgent?.name || 'Unassigned' },
          allocation?.reasoning?.summary && { label: 'Reasoning', value: allocation.reasoning.summary }
        ].filter(Boolean)
      };
    }
    
    if (selectedNode.type === 'agent') {
      const agent = agents.find(a => a.id === selectedNode.id);
      const agentAllocations = allocations.filter(a => a.agent_id === agent?.id);
      
      return {
        type: 'Agent',
        title: agent?.name,
        details: [
          { label: 'Role', value: agent?.role || 'Not specified' },
          { label: 'Status', value: agent?.status },
          { label: 'Skills', value: agent?.skills?.join(', ') || 'None' },
          { label: 'Assigned Tasks', value: agentAllocations.length.toString() },
          { label: 'Workload', value: `${agent?.current_load || 0}h / ${agent?.availability_hours || 40}h` }
        ]
      };
    }
    
    if (selectedNode.type === 'constraint') {
      const constraint = constraints.find(c => c.id === selectedNode.id);
      
      return {
        type: 'Constraint',
        title: constraint?.name,
        details: [
          { label: 'Type', value: constraint?.type },
          { label: 'Category', value: constraint?.category },
          { label: 'Weight', value: constraint?.weight?.toString() },
          { label: 'Status', value: constraint?.is_active ? 'Active' : 'Disabled' },
          { label: 'Rule', value: constraint?.rule_expression || 'Not defined' }
        ]
      };
    }
    
    return null;
  };

  const nodeInfo = getNodeInfo();

  return (
    <div className="flex h-screen bg-slate-50">
      <ConsoleSidebar role={role} onRoleChange={setRole} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <ConsoleHeader role={role} onRoleChange={setRole} />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Insights</h1>
              <p className="text-slate-500 mt-1">Knowledge relationships and reasoning context</p>
            </div>

            {/* Overview Stats */}
            <div className="grid grid-cols-4 gap-4">
              <Card className="border-slate-100">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-50">
                      <ListTodo className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{tasks.length}</p>
                      <p className="text-sm text-slate-500">Tasks</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-slate-100">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-50">
                      <Users className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{agents.length}</p>
                      <p className="text-sm text-slate-500">Agents</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-slate-100">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-violet-50">
                      <Shield className="w-4 h-4 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{constraints.filter(c => c.is_active).length}</p>
                      <p className="text-sm text-slate-500">Active Constraints</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-slate-100">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-50">
                      <Link2 className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{allocations.filter(a => a.status === 'approved').length}</p>
                      <p className="text-sm text-slate-500">Active Allocations</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Knowledge Graph */}
              <div className="lg:col-span-2">
                <Card className="border-slate-100 h-full">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-indigo-600" />
                      Knowledge Relationships
                    </CardTitle>
                    <CardDescription>Click on elements to see reasoning context</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Tasks */}
                      <div>
                        <h4 className="text-sm font-medium text-slate-500 mb-3 flex items-center gap-2">
                          <ListTodo className="w-4 h-4" /> Tasks
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {tasks.slice(0, 8).map((task) => (
                            <motion.button
                              key={task.id}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setSelectedNode({ type: 'task', id: task.id })}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                selectedNode?.type === 'task' && selectedNode?.id === task.id
                                  ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              {task.title}
                            </motion.button>
                          ))}
                          {tasks.length > 8 && (
                            <span className="px-3 py-2 text-sm text-slate-400">+{tasks.length - 8} more</span>
                          )}
                        </div>
                      </div>

                      {/* Agents */}
                      <div>
                        <h4 className="text-sm font-medium text-slate-500 mb-3 flex items-center gap-2">
                          <Users className="w-4 h-4" /> Agents
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {agents.map((agent) => (
                            <motion.button
                              key={agent.id}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setSelectedNode({ type: 'agent', id: agent.id })}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                selectedNode?.type === 'agent' && selectedNode?.id === agent.id
                                  ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              {agent.name}
                            </motion.button>
                          ))}
                        </div>
                      </div>

                      {/* Constraints */}
                      <div>
                        <h4 className="text-sm font-medium text-slate-500 mb-3 flex items-center gap-2">
                          <Shield className="w-4 h-4" /> Constraints
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {constraints.filter(c => c.is_active).map((constraint) => (
                            <motion.button
                              key={constraint.id}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setSelectedNode({ type: 'constraint', id: constraint.id })}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                selectedNode?.type === 'constraint' && selectedNode?.id === constraint.id
                                  ? 'bg-violet-100 text-violet-700 ring-2 ring-violet-500'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              {constraint.name}
                            </motion.button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detail Panel */}
              <div>
                <Card className="border-slate-100 bg-gradient-to-br from-indigo-50/50 to-violet-50/50">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-indigo-600" />
                      Reasoning Context
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {nodeInfo ? (
                      <motion.div
                        key={selectedNode?.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        <div className="p-4 bg-white rounded-xl border border-slate-200">
                          <Badge className="mb-2">{nodeInfo.type}</Badge>
                          <h3 className="text-lg font-semibold text-slate-800">{nodeInfo.title}</h3>
                        </div>
                        
                        <div className="space-y-3">
                          {nodeInfo.details.map((detail, i) => (
                            <div key={i} className="p-3 bg-white rounded-lg border border-slate-100">
                              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">
                                {detail.label}
                              </p>
                              <p className="text-sm text-slate-700">{detail.value}</p>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ) : (
                      <div className="text-center py-12 text-slate-400">
                        <Lightbulb className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="text-sm">Click on an element to see details</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Skill Coverage */}
                {uncoveredSkills.length > 0 && (
                  <Card className="border-slate-100 mt-4">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-semibold text-amber-700">Skill Gaps</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1">
                        {uncoveredSkills.map(skill => (
                          <Badge key={skill} variant="outline" className="text-amber-700 border-amber-300">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        Required skills not covered by any agent
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}