import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings,
  Zap,
  Scale,
  Shield,
  Clock,
  Save,
  RotateCcw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import ConsoleSidebar from '@/components/console/ConsoleSidebar';
import ConsoleHeader from '@/components/console/ConsoleHeader';
import { motion } from 'framer-motion';

export default function AdminSettings() {
  const [role, setRole] = useState(() => localStorage.getItem('kraft_role') || 'admin');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  useEffect(() => {
    localStorage.setItem('kraft_role', role);
  }, [role]);

  const [settings, setSettings] = useState({
    defaultStrategy: 'automatic',
    maxIterations: [100],
    timeoutSeconds: [30],
    autoApproveHighConfidence: false,
    highConfidenceThreshold: [85],
    rebalanceOnOverload: true,
    overloadThreshold: [90],
    respectDeadlines: true,
    prioritizeSkillMatch: true
  });

  const strategies = [
    { id: 'automatic', name: 'Automatic (Recommended)', icon: Zap, description: 'Balanced optimization' },
    { id: 'fast', name: 'Fast Assignment', icon: Clock, description: 'Quick with basic matching' },
    { id: 'balanced', name: 'Balanced Workload', icon: Scale, description: 'Even work distribution' },
    { id: 'constraint_focused', name: 'Constraint Focused', icon: Shield, description: 'Strict satisfaction' }
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      <ConsoleSidebar role={role} onRoleChange={setRole} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <ConsoleHeader role={role} onRoleChange={setRole} />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Allocation Settings</h1>
                <p className="text-slate-500 mt-1">Configure default allocation behavior</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="gap-2">
                  <RotateCcw className="w-4 h-4" />
                  Reset to Defaults
                </Button>
                <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </div>
            </div>

            {/* Default Strategy */}
            <Card className="border-slate-100">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Default Strategy</CardTitle>
                <CardDescription>Choose the default reasoning strategy for allocations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {strategies.map((strategy) => (
                    <button
                      key={strategy.id}
                      onClick={() => setSettings(s => ({ ...s, defaultStrategy: strategy.id }))}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        settings.defaultStrategy === strategy.id 
                          ? 'border-indigo-500 bg-indigo-50' 
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <strategy.icon className={`w-5 h-5 mb-2 ${
                        settings.defaultStrategy === strategy.id ? 'text-indigo-600' : 'text-slate-400'
                      }`} />
                      <p className="font-medium text-slate-800">{strategy.name}</p>
                      <p className="text-sm text-slate-500 mt-1">{strategy.description}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Auto Approval */}
            <Card className="border-slate-100">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Auto-Approval</CardTitle>
                <CardDescription>Automatically approve high-confidence allocations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Enable Auto-Approval</Label>
                    <p className="text-sm text-slate-500">Automatically approve assignments above threshold</p>
                  </div>
                  <Switch
                    checked={settings.autoApproveHighConfidence}
                    onCheckedChange={(checked) => 
                      setSettings(s => ({ ...s, autoApproveHighConfidence: checked }))
                    }
                  />
                </div>

                {settings.autoApproveHighConfidence && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-3"
                  >
                    <Label>Confidence Threshold</Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={settings.highConfidenceThreshold}
                        onValueChange={(v) => setSettings(s => ({ ...s, highConfidenceThreshold: v }))}
                        min={50}
                        max={100}
                        step={5}
                        className="flex-1"
                      />
                      <span className="text-sm font-medium text-slate-700 w-12">
                        {settings.highConfidenceThreshold[0]}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Allocations with confidence ≥ {settings.highConfidenceThreshold[0]}% will be auto-approved
                    </p>
                  </motion.div>
                )}
              </CardContent>
            </Card>

            {/* Workload Management */}
            <Card className="border-slate-100">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Workload Management</CardTitle>
                <CardDescription>Configure how workload is balanced across agents</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Rebalance on Overload</Label>
                    <p className="text-sm text-slate-500">Redistribute tasks when agent is overloaded</p>
                  </div>
                  <Switch
                    checked={settings.rebalanceOnOverload}
                    onCheckedChange={(checked) => 
                      setSettings(s => ({ ...s, rebalanceOnOverload: checked }))
                    }
                  />
                </div>

                <div className="space-y-3">
                  <Label>Overload Threshold</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={settings.overloadThreshold}
                      onValueChange={(v) => setSettings(s => ({ ...s, overloadThreshold: v }))}
                      min={70}
                      max={100}
                      step={5}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium text-slate-700 w-12">
                      {settings.overloadThreshold[0]}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Agent is considered overloaded when capacity exceeds {settings.overloadThreshold[0]}%
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Reasoning Preferences */}
            <Card className="border-slate-100">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Reasoning Preferences</CardTitle>
                <CardDescription>Fine-tune how the reasoning engine evaluates assignments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <Label>Respect Deadlines</Label>
                    <p className="text-sm text-slate-500">Prioritize tasks with approaching deadlines</p>
                  </div>
                  <Switch
                    checked={settings.respectDeadlines}
                    onCheckedChange={(checked) => 
                      setSettings(s => ({ ...s, respectDeadlines: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <Label>Prioritize Skill Match</Label>
                    <p className="text-sm text-slate-500">Prefer agents with exact skill matches</p>
                  </div>
                  <Switch
                    checked={settings.prioritizeSkillMatch}
                    onCheckedChange={(checked) => 
                      setSettings(s => ({ ...s, prioritizeSkillMatch: checked }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Advanced Settings */}
            <Card className="border-slate-100">
              <CardHeader className="cursor-pointer" onClick={() => setShowAdvanced(!showAdvanced)}>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">Advanced Settings</CardTitle>
                    <CardDescription>Technical parameters for the reasoning engine</CardDescription>
                  </div>
                  {showAdvanced ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </CardHeader>
              {showAdvanced && (
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label>Max Reasoning Iterations</Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={settings.maxIterations}
                        onValueChange={(v) => setSettings(s => ({ ...s, maxIterations: v }))}
                        min={10}
                        max={500}
                        step={10}
                        className="flex-1"
                      />
                      <span className="text-sm font-medium text-slate-700 w-12">
                        {settings.maxIterations[0]}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Timeout (seconds)</Label>
                    <div className="flex items-center gap-4">
                      <Slider
                        value={settings.timeoutSeconds}
                        onValueChange={(v) => setSettings(s => ({ ...s, timeoutSeconds: v }))}
                        min={5}
                        max={120}
                        step={5}
                        className="flex-1"
                      />
                      <span className="text-sm font-medium text-slate-700 w-12">
                        {settings.timeoutSeconds[0]}s
                      </span>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}