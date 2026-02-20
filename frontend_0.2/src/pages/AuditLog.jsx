import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  Activity,
  Target,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Settings,
  RefreshCw
} from 'lucide-react';
import ConsoleSidebar from '@/components/console/ConsoleSidebar';
import ConsoleHeader from '@/components/console/ConsoleHeader';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

const actionIcons = {
  allocation_run: Target,
  task_created: Plus,
  task_updated: Edit,
  agent_updated: Edit,
  constraint_changed: Settings,
  approval: CheckCircle,
  rejection: XCircle,
  system_event: Activity
};

const actionColors = {
  allocation_run: 'bg-indigo-100 text-indigo-700',
  task_created: 'bg-emerald-100 text-emerald-700',
  task_updated: 'bg-blue-100 text-blue-700',
  agent_updated: 'bg-violet-100 text-violet-700',
  constraint_changed: 'bg-amber-100 text-amber-700',
  approval: 'bg-green-100 text-green-700',
  rejection: 'bg-red-100 text-red-700',
  system_event: 'bg-slate-100 text-slate-700'
};

export default function AuditLog() {
  const [role, setRole] = useState(() => localStorage.getItem('kraft_role') || 'admin');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState('all');

  useEffect(() => {
    localStorage.setItem('kraft_role', role);
  }, [role]);

  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: () => base44.entities.AuditLog.list('-created_date', 50)
  });

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="flex h-screen bg-slate-50">
      <ConsoleSidebar role={role} onRoleChange={setRole} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <ConsoleHeader role={role} onRoleChange={setRole} />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Audit Log</h1>
                <p className="text-slate-500 mt-1">Timeline of reasoning and allocation events</p>
              </div>
              <Button variant="outline" className="gap-2" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>

            <Card className="border-slate-100">
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-4">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      placeholder="Search events..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={filterAction} onValueChange={setFilterAction}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      <SelectItem value="allocation_run">Allocation Runs</SelectItem>
                      <SelectItem value="task_created">Task Created</SelectItem>
                      <SelectItem value="task_updated">Task Updated</SelectItem>
                      <SelectItem value="agent_updated">Agent Updated</SelectItem>
                      <SelectItem value="constraint_changed">Constraint Changed</SelectItem>
                      <SelectItem value="approval">Approvals</SelectItem>
                      <SelectItem value="rejection">Rejections</SelectItem>
                      <SelectItem value="system_event">System Events</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-100">
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {filteredLogs.map((log, index) => {
                    const Icon = actionIcons[log.action] || Activity;
                    
                    return (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.02 }}
                        className="p-4 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          <div className={`p-2 rounded-lg ${actionColors[log.action] || 'bg-slate-100'}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-slate-800">{log.description}</p>
                              <Badge variant="outline" className="text-xs">
                                {log.action?.replace('_', ' ')}
                              </Badge>
                            </div>
                            {log.details && (
                              <p className="text-sm text-slate-500 mb-2">
                                {typeof log.details === 'object' 
                                  ? JSON.stringify(log.details).slice(0, 100) 
                                  : log.details}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-slate-400">
                              <span>
                                {log.created_date ? format(new Date(log.created_date), 'MMM d, yyyy HH:mm:ss') : ''}
                              </span>
                              {log.performed_by && (
                                <span>by {log.performed_by}</span>
                              )}
                              {log.entity_type && (
                                <span>{log.entity_type}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  
                  {filteredLogs.length === 0 && !isLoading && (
                    <div className="text-center py-12 text-slate-400">
                      <Activity className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                      <p className="text-lg font-medium">No events found</p>
                      <p className="text-sm mt-1">Activity will appear here as it happens</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}