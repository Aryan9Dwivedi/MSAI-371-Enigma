import React, { useState, useEffect } from 'react';
import * as mockData from '@/components/mockData';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import BadgeDisplay from '@/components/gamification/BadgeDisplay';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit2,
  Trash2,
  User,
  Mail,
  Briefcase,
  Clock,
  Sparkles
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ConsoleSidebar from '@/components/console/ConsoleSidebar';
import ConsoleHeader from '@/components/console/ConsoleHeader';
import SkillOverlapMatrix from '@/components/team/SkillOverlapMatrix';
import { motion } from 'framer-motion';

const statusColors = {
  available: 'bg-emerald-100 text-emerald-700',
  busy: 'bg-amber-100 text-amber-700',
  away: 'bg-slate-100 text-slate-600',
  offline: 'bg-red-100 text-red-700'
};

export default function Team() {
  const [role, setRole] = useState(() => localStorage.getItem('kraft_role') || 'manager');
  const [searchQuery, setSearchQuery] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [agents, setAgents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem('kraft_role', role);
  }, [role]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setAgents(mockData.getAll('agents'));
    setTasks(mockData.getAll('tasks'));
  };

  const handleCreate = (data) => {
    mockData.create('agents', { ...data, current_load: 0 });
    loadData();
    setSheetOpen(false);
    setEditingAgent(null);
    toast.success('Agent added successfully');
  };

  const handleUpdate = (id, data) => {
    mockData.update('agents', id, data);
    loadData();
    setSheetOpen(false);
    setEditingAgent(null);
    toast.success('Agent updated successfully');
  };

  const handleDelete = (id) => {
    mockData.remove('agents', id);
    loadData();
    toast.success('Agent removed');
  };

  const filteredAgents = agents.filter(agent => 
    agent.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      role: formData.get('role'),
      availability_hours: parseFloat(formData.get('availability_hours')) || 40,
      status: formData.get('status'),
      skills: formData.get('skills')?.split(',').map(s => s.trim()).filter(Boolean) || []
    };

    if (editingAgent) {
      handleUpdate(editingAgent.id, data);
    } else {
      handleCreate(data);
    }
  };

  return (
    <div className="flex h-screen bg-neutral-100 dark:bg-slate-950 transition-colors">
      <ConsoleSidebar role={role} onRoleChange={setRole} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <ConsoleHeader role={role} onRoleChange={setRole} />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Team</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">Manage team members and their capacity</p>
              </div>
              <Button 
                className="bg-indigo-600 hover:bg-indigo-700 gap-2"
                onClick={() => { setEditingAgent(null); setSheetOpen(true); }}
              >
                <Plus className="w-4 h-4" />
                Add Agent
              </Button>
            </div>

            {/* Skill Overlap Analysis */}
            <SkillOverlapMatrix agents={agents} tasks={tasks} />

            {/* Search */}
            <Card className="border-slate-100 dark:border-slate-800">
              <CardContent className="p-4">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    placeholder="Search team members..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Agent Cards */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAgents.map((agent, index) => {
                const utilization = ((agent.current_load || 0) / (agent.availability_hours || 40)) * 100;
                const isOverloaded = utilization > 90;

                return (
                  <motion.div
                    key={agent.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="border-slate-100 dark:border-slate-800 hover:shadow-md transition-shadow">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900 dark:to-violet-900 flex items-center justify-center">
                              <span className="text-lg font-semibold text-indigo-700 dark:text-indigo-300">
                                {agent.name?.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-800 dark:text-slate-200">{agent.name}</h3>
                              <p className="text-sm text-slate-500 dark:text-slate-400">{agent.role || 'Team Member'}</p>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setEditingAgent(agent); setSheetOpen(true); }}>
                                <Edit2 className="w-4 h-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => handleDelete(agent.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {agent.points > 0 && (
                          <div className="mb-3 p-2.5 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                                <span className="text-xs font-medium text-amber-900 dark:text-amber-100">
                                  {agent.points?.toLocaleString()} points
                                </span>
                              </div>
                              <span className="text-[10px] text-amber-700 dark:text-amber-300">
                                {agent.on_time_completion_rate}% on-time
                              </span>
                            </div>
                            {agent.badges?.length > 0 && (
                              <BadgeDisplay badges={agent.badges} size="small" showTooltip={false} />
                            )}
                          </div>
                        )}

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-500 dark:text-slate-400">Status</span>
                            <Badge className={statusColors[agent.status || 'available']}>
                              {agent.status || 'available'}
                            </Badge>
                          </div>

                          <div>
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="text-slate-500 dark:text-slate-400">Workload</span>
                              <span className={isOverloaded ? 'text-red-600 font-medium' : 'text-slate-600 dark:text-slate-300'}>
                                {agent.current_load || 0}h / {agent.availability_hours || 40}h
                              </span>
                            </div>
                            <Progress 
                              value={Math.min(utilization, 100)} 
                              className={`h-2 ${isOverloaded ? '[&>div]:bg-red-500' : '[&>div]:bg-indigo-500'}`}
                            />
                          </div>

                          <div>
                            <span className="text-sm text-slate-500 dark:text-slate-400 block mb-2">Skills</span>
                            <div className="flex flex-wrap gap-1">
                              {agent.skills?.slice(0, 3).map((skill) => (
                                <Badge key={skill} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {(agent.skills?.length || 0) > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{agent.skills.length - 3}
                                </Badge>
                              )}
                              {!agent.skills?.length && (
                                <span className="text-xs text-slate-300">No skills defined</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {filteredAgents.length === 0 && !isLoading && (
              <Card className="border-slate-100">
                <CardContent className="text-center py-12 text-slate-400">
                  <User className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p className="text-lg font-medium">No team members found</p>
                  <p className="text-sm mt-1">Add agents to start allocating tasks</p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>

      {/* Agent Form Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{editingAgent ? 'Edit Agent' : 'Add Agent'}</SheetTitle>
            <SheetDescription>
              {editingAgent ? 'Update agent details' : 'Add a new team member'}
            </SheetDescription>
          </SheetHeader>
          
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name" 
                name="name" 
                defaultValue={editingAgent?.name}
                placeholder="Full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                name="email" 
                type="email"
                defaultValue={editingAgent?.email}
                placeholder="email@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input 
                id="role" 
                name="role" 
                defaultValue={editingAgent?.role}
                placeholder="Job title"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="availability_hours">Weekly Hours</Label>
                <Input 
                  id="availability_hours" 
                  name="availability_hours" 
                  type="number"
                  defaultValue={editingAgent?.availability_hours || 40}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select name="status" defaultValue={editingAgent?.status || 'available'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="busy">Busy</SelectItem>
                    <SelectItem value="away">Away</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills">Skills (comma-separated)</Label>
              <Input 
                id="skills" 
                name="skills" 
                defaultValue={editingAgent?.skills?.join(', ')}
                placeholder="React, Node.js, SQL, Python"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setSheetOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                {editingAgent ? 'Update' : 'Add'} Agent
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}