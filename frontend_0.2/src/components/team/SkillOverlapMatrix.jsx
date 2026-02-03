import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  Users,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Sparkles
} from 'lucide-react';

export default function SkillOverlapMatrix({ agents = [], tasks = [] }) {
  const [viewMode, setViewMode] = useState('coverage'); // 'coverage' or 'gaps'

  // Extract all unique skills from agents and tasks
  const agentSkills = new Set();
  agents.forEach(agent => {
    (agent.skills || []).forEach(skill => agentSkills.add(skill));
  });

  const requiredSkills = new Set();
  tasks.forEach(task => {
    (task.required_skills || []).forEach(skill => requiredSkills.add(skill));
  });

  // Identify skill gaps and overlaps
  const allSkills = new Set([...agentSkills, ...requiredSkills]);
  const skillData = Array.from(allSkills).map(skill => {
    const agentsWithSkill = agents.filter(a => (a.skills || []).includes(skill));
    const tasksRequiringSkill = tasks.filter(t => (t.required_skills || []).includes(skill));
    const isCovered = agentsWithSkill.length > 0;
    const isNeeded = tasksRequiringSkill.length > 0;
    
    return {
      skill,
      agentCount: agentsWithSkill.length,
      taskCount: tasksRequiringSkill.length,
      agents: agentsWithSkill,
      tasks: tasksRequiringSkill,
      isCovered,
      isNeeded,
      isGap: isNeeded && !isCovered,
      coverage: tasksRequiringSkill.length > 0 ? agentsWithSkill.length / tasksRequiringSkill.length : 0
    };
  });

  const skillGaps = skillData.filter(s => s.isGap);
  const wellCovered = skillData.filter(s => s.isCovered && s.isNeeded && s.agentCount >= 2);
  const atRisk = skillData.filter(s => s.isCovered && s.isNeeded && s.agentCount === 1);

  const filteredSkills = viewMode === 'coverage' 
    ? skillData.filter(s => s.isCovered && s.isNeeded).sort((a, b) => b.agentCount - a.agentCount)
    : skillData.filter(s => s.isGap || (s.agentCount === 1 && s.isNeeded)).sort((a, b) => b.taskCount - a.taskCount);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-700 dark:text-emerald-300">Well Covered</p>
                <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{wellCovered.length}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-700 dark:text-amber-300">At Risk</p>
                <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">{atRisk.length}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700 dark:text-red-300">Skill Gaps</p>
                <p className="text-2xl font-bold text-red-900 dark:text-red-100">{skillGaps.length}</p>
              </div>
              <Target className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Skill Matrix */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              Skill Overlap Analysis
            </CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={viewMode === 'coverage' ? 'default' : 'outline'}
                onClick={() => setViewMode('coverage')}
                className="h-8"
              >
                Coverage
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'gaps' ? 'default' : 'outline'}
                onClick={() => setViewMode('gaps')}
                className="h-8"
              >
                Gaps & Risks
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              {filteredSkills.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">
                    {viewMode === 'coverage' ? 'No skills with coverage yet' : 'No gaps or risks identified!'}
                  </p>
                </div>
              ) : (
                filteredSkills.map((skillItem, index) => (
                  <motion.div
                    key={skillItem.skill}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">{skillItem.skill}</span>
                          {skillItem.isGap && (
                            <Badge className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">Gap</Badge>
                          )}
                          {skillItem.agentCount === 1 && skillItem.isNeeded && (
                            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">At Risk</Badge>
                          )}
                          {skillItem.agentCount >= 2 && skillItem.isNeeded && (
                            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">Good</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                          <div className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            <span>{skillItem.agentCount} agent{skillItem.agentCount !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Target className="w-3.5 h-3.5" />
                            <span>{skillItem.taskCount} task{skillItem.taskCount !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Agents with this skill */}
                    {skillItem.agents.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Team Members</p>
                        <div className="flex flex-wrap gap-2">
                          {skillItem.agents.map(agent => (
                            <div key={agent.id} className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                              <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-[10px] font-medium text-indigo-700 dark:text-indigo-300">
                                {agent.name?.charAt(0)}
                              </div>
                              <span className="text-xs text-slate-700 dark:text-slate-300">{agent.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tasks requiring this skill */}
                    {skillItem.tasks.length > 0 && viewMode === 'gaps' && (
                      <div className="space-y-1 mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Required For</p>
                        <div className="space-y-1">
                          {skillItem.tasks.slice(0, 3).map(task => (
                            <div key={task.id} className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
                              <div className={`w-1.5 h-1.5 rounded-full ${
                                task.priority === 'critical' ? 'bg-red-500' :
                                task.priority === 'high' ? 'bg-orange-500' :
                                task.priority === 'medium' ? 'bg-yellow-500' :
                                'bg-blue-500'
                              }`} />
                              {task.title}
                            </div>
                          ))}
                          {skillItem.tasks.length > 3 && (
                            <p className="text-xs text-slate-400 dark:text-slate-500">+{skillItem.tasks.length - 3} more</p>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}