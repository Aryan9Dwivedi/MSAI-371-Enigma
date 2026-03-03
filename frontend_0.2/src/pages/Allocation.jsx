// @ts-nocheck — UI components (Card, Button, etc.) use forwardRef; checker does not infer children.
import React, { useState, useEffect } from 'react';
import * as mockData from '@/components/mockData';
import { kraftApi } from '@/api/kraftApi';
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
  Loader2,
  AlertTriangle,
  GitCompare,
  ChevronDown,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  const [preStats, setPreStats] = useState(null);
  const [runExplanation, setRunExplanation] = useState('');
  const [runUnassignedTasks, setRunUnassignedTasks] = useState([]);
  const [taskExplanation, setTaskExplanation] = useState('');
  const [taskExplainLoading, setTaskExplainLoading] = useState(false);
  const [showTechDetails, setShowTechDetails] = useState(false);

  useEffect(() => {
    localStorage.setItem('kraft_role', role);
  }, [role]);

  useEffect(() => {
    loadData();
    loadPreAllocationStats();
  }, []);

  const loadData = () => {
    setTasks(mockData.getAll('tasks'));
    setAgents(mockData.getAll('agents'));
    // Don't load mock allocations — we use backend only; avoids mixing mock + backend
    setAllocations([]);
  };

  const loadPreAllocationStats = async () => {
    try {
      const stats = await kraftApi.preAllocationStats();
      setPreStats(stats);
    } catch {
      // Keep UI usable even if stats endpoint is temporarily unavailable.
      setPreStats(null);
    }
  };

  const unassignedTasks = tasks.filter(t => t.status === 'unassigned');

  const runAllocation = async () => {
    setIsRunning(true);
    try {
      const res = await kraftApi.allocate({ apply: false });
      const overallExplanation = res.overall_explanation || res.summary || '';
      setRunUnassignedTasks(res.unassigned_tasks || []);
      const mapped = (res.assignments || []).map((a) => ({
        id: `backend-${a.task_id}`,
        task_id: a.task_id,
        agent_id: a.team_member_id,
        task_name: a.task_name,
        team_member_name: a.team_member_name,
        status: 'proposed',
        confidence: Math.round((a.score ?? 0) * 100),
        source: 'backend',
        force_assigned: a.force_assigned ?? false,
        reasoning: {
          skill_match: a.constraints_satisfied?.join('; ') || '',
          constraint_satisfaction: a.constraints_satisfied?.join('; ') || '',
          summary: overallExplanation,
          inference_trace: a.inference_trace,
          candidate_explanations: a.candidate_explanations,
          explanation: a.explanation,
        },
      }));
      setAllocations(mapped);
      setRunExplanation(overallExplanation);
      setSelectedAllocation(mapped[0] || null);
      setTaskExplanation('');
      if (mapped.length > 0) {
        toast.success(res.summary || `Allocation completed (${mapped.length} assignment${mapped.length !== 1 ? 's' : ''})`);
      } else {
        toast.info(res.summary || 'No assignments. The database may have no unassigned tasks. Run `python seed.py` in the backend to add sample data.');
      }
      await loadPreAllocationStats();
    } catch (err) {
      const msg =
        err.name === 'AbortError'
          ? 'Request timed out. Is the backend running at http://localhost:8000?'
          : err.message || 'Allocation failed. Is the backend running at http://localhost:8000?';
      toast.error(msg);
    } finally {
      setIsRunning(false);
    }
  };

  const runForceRound = async () => {
    if (!runUnassignedTasks?.length) return;
    setIsRunning(true);
    try {
      const priorAssignments = allocations.map((a) => ({ task_id: a.task_id, team_member_id: a.agent_id }));
      const res = await kraftApi.allocate({
        taskIds: runUnassignedTasks.map((t) => t.task_id),
        apply: false,
        forceRound: true,
        priorAssignments,
      });
      const overallExplanation = res.overall_explanation || res.summary || '';
      setRunUnassignedTasks(res.unassigned_tasks || []);
      const mapped = (res.assignments || []).map((a) => ({
        id: `backend-${a.task_id}`,
        task_id: a.task_id,
        agent_id: a.team_member_id,
        task_name: a.task_name,
        team_member_name: a.team_member_name,
        status: 'proposed',
        confidence: Math.round((a.score ?? 0) * 100),
        source: 'backend',
        force_assigned: true,
        reasoning: {
          skill_match: a.constraints_satisfied?.join('; ') || '',
          constraint_satisfaction: a.constraints_satisfied?.join('; ') || '',
          summary: overallExplanation,
          inference_trace: a.inference_trace || [],
          candidate_explanations: a.candidate_explanations || [],
          explanation: a.explanation,
        },
      }));
      setAllocations((prev) => [...prev, ...mapped]);
      setRunExplanation((prev) => `${prev}\n\n${overallExplanation}`);
      if (mapped.length > 0) {
        setSelectedAllocation(mapped[0]);
        setTaskExplanation('');
        toast.success(res.summary || `Second round: ${mapped.length} task(s) force-assigned`);
      } else {
        toast.info(res.summary || 'Second round completed. No additional tasks could be assigned.');
      }
      await loadPreAllocationStats();
    } catch (err) {
      const msg = err.name === 'AbortError' ? 'Request timed out.' : err.message || 'Second round failed.';
      toast.error(msg);
    } finally {
      setIsRunning(false);
    }
  };

  const loadTaskExplanation = async (allocation) => {
    if (!allocation) return;
    setTaskExplainLoading(true);
    try {
      if (allocation.force_assigned && allocation.reasoning?.explanation) {
        setTaskExplanation(allocation.reasoning.explanation);
        setTaskExplainLoading(false);
        return;
      }
      const chosen = allocation.reasoning?.candidate_explanations?.find((c) => c.chosen);
      const eligible = (allocation.reasoning?.candidate_explanations || []).filter((c) => typeof c.score === 'number');
      const bestAlt = eligible
        .filter((c) => !c.chosen)
        .slice()
        .sort((a, b) => (b.score || 0) - (a.score || 0))[0];
      const topRejections = (allocation.reasoning?.candidate_explanations || [])
        .flatMap((c) => c.rejection_reasons || [])
        .slice(0, 5);

      const payload = {
        task_id: allocation.task_id,
        task_name: getDisplayName(allocation),
        team_member_id: allocation.agent_id,
        team_member_name: getMemberName(allocation),
        constraints_satisfied: allocation.reasoning?.constraint_satisfaction
          ? allocation.reasoning.constraint_satisfaction.split(';').map((s) => s.trim()).filter(Boolean)
          : [],
        chosen_score: chosen?.score ?? null,
        chosen_reasons: chosen?.reasons || [],
        best_alternative: bestAlt ? { member_name: bestAlt.member_name, score: `${(bestAlt.score ?? 0).toFixed(3)}` } : null,
        best_alternative_gap:
          typeof chosen?.score === 'number' && typeof bestAlt?.score === 'number' ? +(chosen.score - bestAlt.score).toFixed(4) : null,
        best_alternative_reasons: bestAlt?.reasons || [],
        scoring_factors: [
          'workload_fairness',
          'experience',
          'availability_richness',
          'skill_breadth',
          'delivery_speed',
        ],
        hard_rules: [
          'All required skills must be present (AND match).',
          'Calendar availability must be present.',
          'Not overloaded (workload <= 3 tasks per run).',
        ],
        top_rejection_reasons: topRejections,
        chosen_years_of_experience: chosen?.years_of_experience ?? null,
        chosen_current_workload: chosen?.current_workload ?? null,
        chosen_predicted_hours: chosen?.predicted_hours ?? null,
        chosen_availability_slots: chosen?.availability_slots ?? null,
        runner_up_years_of_experience: bestAlt?.years_of_experience ?? null,
        runner_up_current_workload: bestAlt?.current_workload ?? null,
        runner_up_predicted_hours: bestAlt?.predicted_hours ?? null,
        runner_up_availability_slots: bestAlt?.availability_slots ?? null,
      };

      const res = await kraftApi.explainTask(payload);
      setTaskExplanation(res.explanation || '');
    } catch (e) {
      setTaskExplanation('');
    } finally {
      setTaskExplainLoading(false);
    }
  };

  const updateAllocationStatus = (id, status) => {
    const alloc = allocations.find((a) => a.id === id);
    if (alloc?.source === 'backend') {
      setAllocations((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a))
      );
    } else {
      mockData.update('allocations', id, { status });
      loadData();
    }
    toast.success(`Allocation ${status}`);
  };

  const getTaskById = (id) => tasks.find((t) => String(t.id) === String(id));
  const getAgentById = (id) => agents.find((a) => String(a.id) === String(id));
  const getDisplayName = (allocation) =>
    allocation.task_name ?? getTaskById(allocation.task_id)?.title ?? 'Unknown Task';
  const getMemberName = (allocation) =>
    allocation.team_member_name ?? getAgentById(allocation.agent_id)?.name ?? 'Unknown';

  const proposedAllocations = allocations.filter(a => a.status === 'proposed');

  /** Get top 2 eligible candidates for comparison (chosen + runner-up). */
  const getTop2Candidates = (allocation) => {
    const candidates = (allocation?.reasoning?.candidate_explanations || [])
      .filter((c) => typeof c.score === 'number')
      .sort((a, b) => (b.score || 0) - (a.score || 0));
    const chosen = candidates.find((c) => c.chosen) || candidates[0];
    const runnerUp = candidates.find((c) => !c.chosen) || candidates[1];
    return { chosen, runnerUp };
  };

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
                      {(preStats?.unassigned_tasks ?? unassignedTasks.length)} unassigned task{(preStats?.unassigned_tasks ?? unassignedTasks.length) !== 1 ? 's' : ''} ready for allocation
                    </p>
                    <p className="text-sm text-slate-500">
                      {(preStats?.available_members ?? agents.filter(a => a.status === 'available').length)} agents available
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Total: {preStats?.total_members ?? agents.length} members, {preStats?.total_tasks ?? tasks.length} tasks
                    </p>
                  </div>
                  <Button 
                    className="bg-indigo-600 hover:bg-indigo-700 gap-2"
                    disabled={isRunning}
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
              {/* Results Table + Top 2 Comparison (left, wide area) */}
              <div className="lg:col-span-2 space-y-6">
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
                          {allocations.slice(0, 10).map((allocation) => (
                              <motion.tr
                                key={allocation.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className={`cursor-pointer hover:bg-slate-50 transition-colors ${
                                  selectedAllocation?.id === allocation.id ? 'bg-indigo-50' : ''
                                }`}
                                onClick={() => {
                                  setSelectedAllocation(allocation);
                                  loadTaskExplanation(allocation);
                                }}
                              >
                                <TableCell>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium text-slate-800">{getDisplayName(allocation)}</p>
                                      {allocation.force_assigned && (
                                        <Badge className="bg-amber-100 text-amber-800 text-[10px] font-medium">2nd round</Badge>
                                      )}
                                    </div>
                                    <p className="text-xs text-slate-400">{getTaskById(allocation.task_id)?.priority}</p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-medium text-indigo-700">
                                      {getMemberName(allocation).charAt(0)}
                                    </div>
                                    <span className="text-sm text-slate-700">{getMemberName(allocation)}</span>
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
                          ))}
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

                {/* Top 2 Candidates Comparison — refined, investor-ready */}
                {selectedAllocation && (() => {
                  const { chosen, runnerUp } = getTop2Candidates(selectedAllocation);
                  const isForceRound = selectedAllocation.force_assigned;
                  const hasTwoEligible = chosen && runnerUp && chosen.member_id !== runnerUp.member_id;
                  if (!chosen) return null;
                  const chosenScore = (chosen?.score ?? 0) * 100;
                  const runnerUpScore = runnerUp ? (runnerUp?.score ?? 0) * 100 : 0;
                  const runnerNames = selectedAllocation.reasoning?.candidate_explanations
                    ?.filter((c) => !c.chosen)
                    .map((c) => c.member_name)
                    .join(' and ') || runnerUp?.member_name;
                  return (
                    <Card className={`border overflow-hidden shadow-sm bg-white ${isForceRound ? 'border-amber-200/80' : 'border-slate-200/80'}`}>
                      <div className="p-5">
                        <div className="flex items-center gap-2.5 mb-4">
                          <GitCompare className={`w-4 h-4 ${isForceRound ? 'text-amber-600' : 'text-slate-500'}`} />
                          <h3 className="text-sm font-medium text-slate-700 tracking-tight">
                            {isForceRound ? 'Second round' : 'Top 2 Candidates'}
                          </h3>
                          {isForceRound && <Badge className="bg-amber-100 text-amber-800 text-[10px]">Partial match</Badge>}
                          <span className="text-slate-400 text-sm">·</span>
                          <p className="text-sm text-slate-500 truncate">{getDisplayName(selectedAllocation)}</p>
                        </div>
                        {hasTwoEligible ? (
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className={`relative p-4 rounded-lg border ${isForceRound ? 'bg-amber-50/70 border-amber-100' : 'bg-emerald-50/70 border-emerald-100'}`}>
                              <span className={`absolute top-3 right-3 text-[10px] font-medium uppercase tracking-wider ${isForceRound ? 'text-amber-600' : 'text-emerald-600'}`}>Selected</span>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-medium text-emerald-700">
                                  {chosen?.member_name?.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-slate-800">{chosen?.member_name}</p>
                                  <p className={`text-lg font-semibold ${isForceRound ? 'text-amber-600' : 'text-emerald-600'}`}>
                                  {chosenScore.toFixed(0)}%{isForceRound ? ' overlap' : ''}
                                </p>
                                {isForceRound && chosen && (
                                  <p className="text-xs text-slate-500 mt-0.5">
                                    {chosen.current_workload ?? 0} task(s) · {chosen.years_of_experience ?? 0} yrs
                                  </p>
                                )}
                                </div>
                              </div>
                              <Progress value={Math.round(chosenScore)} className="h-1.5 mt-2 [&>div]:bg-emerald-500" />
                            </div>
                            <div className="relative p-4 rounded-lg bg-slate-50 border border-slate-100">
                              <span className="absolute top-3 right-3 text-[10px] font-medium uppercase tracking-wider text-slate-500">2nd</span>
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-sm font-medium text-slate-600">
                                  {runnerUp?.member_name?.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-slate-700">{runnerUp?.member_name}</p>
                                  <p className="text-lg font-semibold text-slate-600">
                                    {runnerUpScore.toFixed(0)}%{isForceRound ? ' overlap' : ''}
                                  </p>
                                  {isForceRound && runnerUp && (
                                    <p className="text-xs text-slate-500 mt-0.5">
                                      {runnerUp.current_workload ?? 0} task(s) · {runnerUp.years_of_experience ?? 0} yrs
                                    </p>
                                  )}
                                </div>
                              </div>
                              <Progress value={Math.round(runnerUpScore)} className="h-1.5 mt-2 [&>div]:bg-slate-400" />
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 rounded-lg bg-emerald-50/70 border border-emerald-100">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-medium text-emerald-700">
                                {chosen?.member_name?.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-slate-800">{chosen?.member_name}</p>
                                <p className="text-base font-semibold text-emerald-600">{chosenScore.toFixed(1)}%</p>
                              </div>
                            </div>
                            <p className="mt-2 text-xs text-slate-500">Only 1 eligible candidate for this task.</p>
                          </div>
                        )}
                        <div className={`mt-4 pl-4 border-l-2 rounded-r-lg py-2.5 pr-3 ${isForceRound ? 'border-amber-200 bg-gradient-to-r from-amber-50/60 to-transparent' : 'border-indigo-200 bg-gradient-to-r from-indigo-50/60 to-transparent'}`}>
                          <p className={`text-[11px] font-medium uppercase tracking-wider mb-2 ${isForceRound ? 'text-amber-600/80' : 'text-indigo-600/80'}`}>
                            {hasTwoEligible ? `Why ${chosen?.member_name} over ${runnerNames || runnerUp?.member_name}` : 'Explanation'}
                          </p>
                          {taskExplainLoading ? (
                            <p className="text-sm text-slate-400">Generating...</p>
                          ) : (
                            <div className="text-sm text-slate-700 leading-relaxed space-y-2.5">
                              {(taskExplanation || 'Click a task to load the rationale.').split('\n').filter(Boolean).map((para, i) => (
                                <p key={i} className={i === 0 ? 'font-medium text-slate-800' : 'text-slate-600'}>
                                  {para}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })()}
              </div>

              {/* Explanation Panel — investor-ready */}
              <div className="lg:col-span-1">
                <Card className="border-slate-200/80 shadow-sm overflow-hidden bg-white">
                  <CardHeader className="pb-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                    <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-800">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                        <Lightbulb className="w-4 h-4 text-indigo-600" />
                      </div>
                      Run Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {runExplanation ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-4"
                      >
                        <div className="relative pl-4 border-l-2 border-indigo-400/60 rounded-r-xl py-3 pr-4 bg-gradient-to-r from-indigo-50/80 via-indigo-50/40 to-transparent">
                          <div className="text-sm text-slate-700 leading-relaxed space-y-2.5">
                            {runExplanation.split('\n').filter(Boolean).map((para, i) => (
                              <p key={i} className={i === 0 ? 'font-semibold text-slate-800 text-[15px]' : 'text-slate-600'}>
                                {para}
                              </p>
                            ))}
                          </div>
                        </div>

                        {runUnassignedTasks?.length > 0 && (
                          <div className="rounded-xl border border-amber-200/70 bg-gradient-to-br from-amber-50/80 to-orange-50/50 px-4 py-4">
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-xs font-semibold text-amber-800/90 uppercase tracking-wider">Unassigned tasks</p>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-amber-300 bg-white hover:bg-amber-50 hover:border-amber-400 text-amber-800 font-medium gap-1.5 shadow-sm"
                                disabled={isRunning}
                                onClick={runForceRound}
                              >
                                {isRunning ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <RefreshCw className="w-4 h-4" />
                                )}
                                Second round
                              </Button>
                            </div>
                            <p className="text-xs text-amber-700/80 mb-2">
                              Force-assign to best partial match (skill overlap + workload + experience)
                            </p>
                            <ul className="space-y-2">
                              {runUnassignedTasks.slice(0, 6).map((t) => (
                                <li key={t.task_id} className="text-sm">
                                  <p className="font-medium text-slate-800">{t.task_name}</p>
                                  {t.reason && (
                                    <p className="text-xs text-amber-700/90 mt-0.5">{t.reason}</p>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {selectedAllocation && (() => {
                          const hasTechDetails = selectedAllocation.reasoning?.skill_match
                            || selectedAllocation.reasoning?.constraint_satisfaction
                            || selectedAllocation.reasoning?.load_balance
                            || (selectedAllocation.reasoning?.inference_trace?.length ?? 0) > 0;
                          return hasTechDetails ? (
                            <Collapsible open={showTechDetails} onOpenChange={setShowTechDetails} className="mt-2">
                              <CollapsibleTrigger className="flex items-center gap-2 w-full text-left text-xs font-medium text-slate-500 hover:text-slate-700 py-1.5 px-2 rounded-md hover:bg-slate-100/80 transition-colors">
                                {showTechDetails ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                Technical details (Skill match, constraints, inference trace)
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <div className="space-y-3 mt-2 pl-1">
                                  {selectedAllocation.reasoning?.skill_match && (
                                    <div className="flex items-start gap-3 p-3 bg-slate-50/80 rounded-lg border border-slate-100">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                      <div>
                                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Skill Match</p>
                                        <p className="text-sm text-slate-700 mt-1">{selectedAllocation.reasoning.skill_match}</p>
                                      </div>
                                    </div>
                                  )}
                                  {selectedAllocation.reasoning?.constraint_satisfaction && (
                                    <div className="flex items-start gap-3 p-3 bg-slate-50/80 rounded-lg border border-slate-100">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                      <div>
                                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Constraints</p>
                                        <p className="text-sm text-slate-700 mt-1">{selectedAllocation.reasoning.constraint_satisfaction}</p>
                                      </div>
                                    </div>
                                  )}
                                  {selectedAllocation.reasoning?.load_balance && (
                                    <div className="flex items-start gap-3 p-3 bg-slate-50/80 rounded-lg border border-slate-100">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                      <div>
                                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Workload</p>
                                        <p className="text-sm text-slate-700 mt-1">{selectedAllocation.reasoning.load_balance}</p>
                                      </div>
                                    </div>
                                  )}
                                  {selectedAllocation.reasoning?.inference_trace?.length > 0 && (
                                    <div className="flex items-start gap-3 p-3 bg-slate-50/80 rounded-lg border border-slate-100">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Inference trace</p>
                                        <ol className="text-xs text-slate-700 mt-1 space-y-0.5 font-mono">
                                          {selectedAllocation.reasoning.inference_trace.map((s) => (
                                            <li key={s.step}>
                                              {s.step}. {s.fact_or_derived}
                                              {s.rule && <span className="block text-slate-500 pl-3">{s.rule}</span>}
                                            </li>
                                          ))}
                                        </ol>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          ) : null;
                        })()}
                      </motion.div>
                    ) : (
                      <div className="text-center py-8 text-slate-400">
                        <Lightbulb className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="text-sm">Run allocation to see the reasoning summary</p>
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