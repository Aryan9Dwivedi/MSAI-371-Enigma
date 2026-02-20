import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FlaskConical,
  Play,
  RotateCcw,
  ArrowRight,
  Lightbulb,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Users,
  ListTodo
} from 'lucide-react';
import ConsoleSidebar from '@/components/console/ConsoleSidebar';
import ConsoleHeader from '@/components/console/ConsoleHeader';
import { motion, AnimatePresence } from 'framer-motion';

export default function Scenarios() {
  const [role, setRole] = useState(() => localStorage.getItem('kraft_role') || 'manager');
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState(null);
  
  useEffect(() => {
    localStorage.setItem('kraft_role', role);
  }, [role]);

  const [scenario, setScenario] = useState({
    removeAgent: null,
    addTasks: 0,
    changeCapacity: [100],
    disableConstraint: null
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => base44.entities.Agent.list()
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list()
  });

  const { data: constraints = [] } = useQuery({
    queryKey: ['constraints'],
    queryFn: () => base44.entities.Constraint.list()
  });

  const runScenario = async () => {
    setIsRunning(true);
    setResults(null);
    
    // Simulate scenario analysis
    await new Promise(r => setTimeout(r, 2500));
    
    const availableAgents = agents.filter(a => 
      a.status === 'available' && a.id !== scenario.removeAgent
    );
    const totalTasks = tasks.filter(t => t.status === 'unassigned').length + scenario.addTasks;
    const adjustedCapacity = availableAgents.reduce((sum, a) => 
      sum + ((a.availability_hours || 40) * (scenario.changeCapacity[0] / 100)), 0
    );
    
    const canHandle = adjustedCapacity >= totalTasks * 4; // Assume 4h per task average
    
    setResults({
      feasible: canHandle,
      availableAgents: availableAgents.length,
      totalTasks,
      totalCapacity: Math.round(adjustedCapacity),
      bottlenecks: !canHandle ? [
        'Insufficient capacity for workload',
        scenario.removeAgent ? 'Key agent unavailable' : null,
        scenario.addTasks > 5 ? 'High task influx' : null
      ].filter(Boolean) : [],
      recommendations: [
        !canHandle && scenario.changeCapacity[0] < 100 ? 'Consider increasing team capacity' : null,
        !canHandle && scenario.removeAgent ? 'Redistribute removed agent\'s tasks' : null,
        canHandle ? 'Scenario is feasible with current configuration' : null
      ].filter(Boolean),
      confidenceImpact: scenario.removeAgent || scenario.addTasks > 3 ? -12 : 0
    });
    
    setIsRunning(false);
  };

  const resetScenario = () => {
    setScenario({
      removeAgent: null,
      addTasks: 0,
      changeCapacity: [100],
      disableConstraint: null
    });
    setResults(null);
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <ConsoleSidebar role={role} onRoleChange={setRole} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <ConsoleHeader role={role} onRoleChange={setRole} />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Scenario Testing</h1>
                <p className="text-slate-500 mt-1">"What if" analysis for allocation changes</p>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Scenario Configuration */}
              <Card className="border-slate-100">
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-indigo-600" />
                    Configure Scenario
                  </CardTitle>
                  <CardDescription>Adjust parameters to test different situations</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Remove Agent */}
                  <div className="space-y-3">
                    <Label>What if an agent is unavailable?</Label>
                    <Select 
                      value={scenario.removeAgent || 'none'} 
                      onValueChange={(v) => setScenario(s => ({ ...s, removeAgent: v === 'none' ? null : v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select agent to remove" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No change</SelectItem>
                        {agents.map(agent => (
                          <SelectItem key={agent.id} value={agent.id}>
                            {agent.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Add Tasks */}
                  <div className="space-y-3">
                    <Label>What if we add more tasks?</Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={[scenario.addTasks]}
                        onValueChange={(v) => setScenario(s => ({ ...s, addTasks: v[0] }))}
                        min={0}
                        max={20}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-sm font-medium text-slate-700 w-16">
                        +{scenario.addTasks} tasks
                      </span>
                    </div>
                  </div>

                  {/* Change Capacity */}
                  <div className="space-y-3">
                    <Label>What if team capacity changes?</Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={scenario.changeCapacity}
                        onValueChange={(v) => setScenario(s => ({ ...s, changeCapacity: v }))}
                        min={50}
                        max={150}
                        step={10}
                        className="flex-1"
                      />
                      <span className="text-sm font-medium text-slate-700 w-16">
                        {scenario.changeCapacity[0]}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Adjust overall team availability (100% = current)
                    </p>
                  </div>

                  {/* Disable Constraint */}
                  <div className="space-y-3">
                    <Label>What if we relax a constraint?</Label>
                    <Select 
                      value={scenario.disableConstraint || 'none'} 
                      onValueChange={(v) => setScenario(s => ({ ...s, disableConstraint: v === 'none' ? null : v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select constraint to disable" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No change</SelectItem>
                        {constraints.filter(c => c.is_active).map(constraint => (
                          <SelectItem key={constraint.id} value={constraint.id}>
                            {constraint.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" className="flex-1 gap-2" onClick={resetScenario}>
                      <RotateCcw className="w-4 h-4" />
                      Reset
                    </Button>
                    <Button 
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 gap-2"
                      onClick={runScenario}
                      disabled={isRunning}
                    >
                      {isRunning ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          Run Scenario
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Results */}
              <Card className="border-slate-100">
                <CardHeader>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    Scenario Results
                  </CardTitle>
                  <CardDescription>How the changes would affect allocation</CardDescription>
                </CardHeader>
                <CardContent>
                  <AnimatePresence mode="wait">
                    {isRunning ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center py-16"
                      >
                        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
                        <p className="text-slate-600">Running scenario analysis...</p>
                        <p className="text-sm text-slate-400 mt-1">Evaluating reasoning outcomes</p>
                      </motion.div>
                    ) : results ? (
                      <motion.div
                        key="results"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                      >
                        {/* Feasibility */}
                        <div className={`p-4 rounded-xl ${results.feasible ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                          <div className="flex items-center gap-3">
                            {results.feasible ? (
                              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                            ) : (
                              <AlertTriangle className="w-6 h-6 text-red-600" />
                            )}
                            <div>
                              <p className={`font-semibold ${results.feasible ? 'text-emerald-800' : 'text-red-800'}`}>
                                {results.feasible ? 'Scenario is Feasible' : 'Capacity Issues Detected'}
                              </p>
                              <p className={`text-sm ${results.feasible ? 'text-emerald-600' : 'text-red-600'}`}>
                                {results.feasible 
                                  ? 'All tasks can be allocated with current parameters'
                                  : 'Some tasks may not be assignable'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-slate-50 rounded-xl">
                            <div className="flex items-center gap-2 text-slate-500 mb-1">
                              <Users className="w-4 h-4" />
                              <span className="text-sm">Available Agents</span>
                            </div>
                            <p className="text-2xl font-bold text-slate-800">{results.availableAgents}</p>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-xl">
                            <div className="flex items-center gap-2 text-slate-500 mb-1">
                              <ListTodo className="w-4 h-4" />
                              <span className="text-sm">Total Tasks</span>
                            </div>
                            <p className="text-2xl font-bold text-slate-800">{results.totalTasks}</p>
                          </div>
                        </div>

                        {/* Confidence Impact */}
                        {results.confidenceImpact !== 0 && (
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-sm text-amber-800">
                              <strong>Confidence Impact:</strong> {results.confidenceImpact}% average
                            </p>
                          </div>
                        )}

                        {/* Bottlenecks */}
                        {results.bottlenecks.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-red-600">Bottlenecks Identified</Label>
                            {results.bottlenecks.map((bottleneck, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm text-red-700">
                                <AlertTriangle className="w-3 h-3" />
                                {bottleneck}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Recommendations */}
                        <div className="space-y-2">
                          <Label>Recommendations</Label>
                          {results.recommendations.map((rec, i) => (
                            <div key={i} className="flex items-start gap-2 text-sm text-slate-600">
                              <ArrowRight className="w-3 h-3 mt-1 text-indigo-500" />
                              {rec}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-16 text-slate-400"
                      >
                        <FlaskConical className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                        <p className="text-lg font-medium">Configure and run a scenario</p>
                        <p className="text-sm mt-1">See how changes affect allocation outcomes</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}