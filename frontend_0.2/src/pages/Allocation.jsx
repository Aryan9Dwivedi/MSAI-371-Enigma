import React, { useState, useEffect } from 'react';
import * as mockData from '@/components/mockData';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Lightbulb,
  Target,
  Zap,
  Scale,
  Shield,
  ArrowRight,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import ConsoleSidebar from '@/components/console/ConsoleSidebar';
import ConsoleHeader from '@/components/console/ConsoleHeader';
import { motion, AnimatePresence } from 'framer-motion';

const strategies = [
  { 
    id: 'automatic', 
    name: 'Automatic (Recommended)', 
    description: 'Balanced optimization across all factors',
    icon: Zap
  },
  { 
    id: 'fast', 
    name: 'Fast Assignment', 
    description: 'Quick allocation with basic matching',
    icon: Clock
  },
  { 
    id: 'balanced', 
    name: 'Balanced Workload', 
    description: 'Prioritize even distribution of work',
    icon: Scale
  },
  { 
    id: 'constraint_focused', 
    name: 'Constraint Focused', 
    description: 'Strict constraint satisfaction',
    icon: Shield
  }
];

export default function Allocation() {
  const [role, setRole] = useState(() => localStorage.getItem('kraft_role') || 'manager');
  const [strategy, setStrategy] = useState('automatic');
  const [isRunning, setIsRunning] = useState(false);
  const [selectedAllocation, setSelectedAllocation] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [agents, setAgents] = useState([]);
  const [allocations, setAllocations] = useState([]);

  useEffect(() => {
    localStorage.setItem('kraft_role', role);
  }, [role]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setTasks(mockData.getAll('tasks'));
    setAgents(mockData.getAll('agents'));
    setAllocations(mockData.getAll('allocations'));
  };

  const unassignedTasks = tasks.filter(t => t.status === 'unassigned');

  const runAllocation = async () => {
    setIsRunning(true);
    
    await new Promise(r => setTimeout(r, 2000));
    
    const availableAgents = agents.filter(a => a.status === 'available');
    
    for (const task of unassignedTasks) {
      const matchedAgent = availableAgents.find(agent => {
        const taskSkills = task.required_skills || [];
        const agentSkills = agent.skills || [];
        return taskSkills.some(skill => agentSkills.includes(skill));
      }) || availableAgents[Math.floor(Math.random() * availableAgents.length)];
      
      if (matchedAgent) {
        const matchedSkills = (task.required_skills || []).filter(s => 
          (matchedAgent.skills || []).includes(s)
        );
        
        const confidence = Math.min(95, 70 + matchedSkills.length * 10);
        
        mockData.create('allocations', {
          task_id: task.id,
          agent_id: matchedAgent.id,
          status: 'proposed',
          confidence,
          strategy_used: strategy,
          reasoning: {
            skill_match: matchedSkills.length > 0 
              ? `Matched ${matchedSkills.length} skill(s): ${matchedSkills.join(', ')}`
              : 'General availability match',
            constraint_satisfaction: 'All hard constraints satisfied',
            load_balance: `Agent at ${Math.round(((matchedAgent.current_load || 0) / (matchedAgent.availability_hours || 40)) * 100)}% capacity`,
            summary: `Best available match based on ${strategy} strategy`
          }
        });
      }
    }
    
    loadData();
    setIsRunning(false);
    toast.success('Allocation completed');
  };

  const updateAllocationStatus = (id, status) => {
    mockData.update('allocations', id, { status });
    loadData();
    toast.success(`Allocation ${status}`);
  };

  const getTaskById = (id) => tasks.find(t => t.id === id);
  const getAgentById = (id) => agents.find(a => a.id === id);

  const proposedAllocations = allocations.filter(a => a.status === 'proposed');

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 transition-colors">
      <ConsoleSidebar role={role} onRoleChange={setRole} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <ConsoleHeader role={role} onRoleChange={setRole} />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Allocation</h1>
                <p className="text-slate-500 mt-1">Run reasoning and assign tasks automatically</p>
              </div>
            </div>

            {/* Strategy Selection & Run */}
            <Card className="border-slate-100">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Target className="w-4 h-4 text-indigo-600" />
                  Allocation Strategy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4 mb-6">
                  {strategies.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setStrategy(s.id)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        strategy === s.id 
                          ? 'border-indigo-500 bg-indigo-50' 
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <s.icon className={`w-5 h-5 mb-2 ${strategy === s.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <p className="font-medium text-slate-800 text-sm">{s.name}</p>
                      <p className="text-xs text-slate-500 mt-1">{s.description}</p>
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div>
                    <p className="font-medium text-slate-800">
                      {unassignedTasks.length} unassigned task{unassignedTasks.length !== 1 ? 's' : ''} ready for allocation
                    </p>
                    <p className="text-sm text-slate-500">
                      {agents.filter(a => a.status === 'available').length} agents available
                    </p>
                  </div>
                  <Button 
                    className="bg-indigo-600 hover:bg-indigo-700 gap-2"
                    disabled={isRunning || unassignedTasks.length === 0}
                    onClick={runAllocation}
                  >
                    {isRunning ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Reasoning...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Run Allocation
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Results Table */}
              <div className="lg:col-span-2">
                <Card className="border-slate-100">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">
                      Allocation Results
                      {proposedAllocations.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {proposedAllocations.length} pending
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Task</TableHead>
                          <TableHead>Agent</TableHead>
                          <TableHead>Confidence</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-24">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <AnimatePresence>
                          {allocations.slice(0, 10).map((allocation) => {
                            const task = getTaskById(allocation.task_id);
                            const agent = getAgentById(allocation.agent_id);
                            
                            return (
                              <motion.tr
                                key={allocation.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className={`cursor-pointer hover:bg-slate-50 transition-colors ${
                                  selectedAllocation?.id === allocation.id ? 'bg-indigo-50' : ''
                                }`}
                                onClick={() => setSelectedAllocation(allocation)}
                              >
                                <TableCell>
                                  <div>
                                    <p className="font-medium text-slate-800">{task?.title || 'Unknown Task'}</p>
                                    <p className="text-xs text-slate-400">{task?.priority}</p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-medium text-indigo-700">
                                      {agent?.name?.charAt(0) || '?'}
                                    </div>
                                    <span className="text-sm text-slate-700">{agent?.name || 'Unknown'}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Progress 
                                      value={allocation.confidence} 
                                      className="w-16 h-1.5 [&>div]:bg-emerald-500"
                                    />
                                    <span className="text-sm font-medium text-emerald-600">
                                      {allocation.confidence}%
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge className={
                                    allocation.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                                    allocation.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                    'bg-amber-100 text-amber-700'
                                  }>
                                    {allocation.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {allocation.status === 'proposed' && (
                                    <div className="flex gap-1">
                                      <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          updateAllocationStatus(allocation.id, 'approved');
                                        }}
                                      >
                                        <CheckCircle2 className="w-4 h-4" />
                                      </Button>
                                      <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          updateAllocationStatus(allocation.id, 'rejected');
                                        }}
                                      >
                                        <XCircle className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  )}
                                </TableCell>
                              </motion.tr>
                            );
                          })}
                        </AnimatePresence>
                        {allocations.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-12 text-slate-400">
                              <Target className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                              <p>No allocations yet</p>
                              <p className="text-xs mt-1">Run an allocation to see results</p>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>

              {/* Explanation Panel */}
              <div className="lg:col-span-1">
                <Card className="border-slate-100 bg-gradient-to-br from-indigo-50/50 to-violet-50/50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-indigo-600" />
                      Why this assignment?
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedAllocation ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-4"
                      >
                        <div className="p-4 bg-white rounded-xl border border-indigo-100">
                          <div className="flex items-center gap-2 mb-3">
                            <ArrowRight className="w-4 h-4 text-indigo-500" />
                            <span className="font-medium text-slate-800">
                              {getTaskById(selectedAllocation.task_id)?.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-medium text-indigo-700">
                              {getAgentById(selectedAllocation.agent_id)?.name?.charAt(0)}
                            </div>
                            {getAgentById(selectedAllocation.agent_id)?.name}
                          </div>
                        </div>

                        <div className="space-y-3">
                          {selectedAllocation.reasoning?.skill_match && (
                            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-slate-100">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Skill Match</p>
                                <p className="text-sm text-slate-700 mt-1">{selectedAllocation.reasoning.skill_match}</p>
                              </div>
                            </div>
                          )}

                          {selectedAllocation.reasoning?.constraint_satisfaction && (
                            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-slate-100">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Constraints</p>
                                <p className="text-sm text-slate-700 mt-1">{selectedAllocation.reasoning.constraint_satisfaction}</p>
                              </div>
                            </div>
                          )}

                          {selectedAllocation.reasoning?.load_balance && (
                            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-slate-100">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Workload</p>
                                <p className="text-sm text-slate-700 mt-1">{selectedAllocation.reasoning.load_balance}</p>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="p-3 bg-indigo-100 rounded-lg">
                          <p className="text-sm text-indigo-800">
                            <strong>Summary:</strong> {selectedAllocation.reasoning?.summary}
                          </p>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="text-center py-8 text-slate-400">
                        <Lightbulb className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="text-sm">Select an allocation to see the reasoning</p>
                      </div>
                    )}
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