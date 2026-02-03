import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  User,
  Mail,
  Briefcase,
  Clock,
  Target,
  Award
} from 'lucide-react';
import ConsoleSidebar from '@/components/console/ConsoleSidebar';
import ConsoleHeader from '@/components/console/ConsoleHeader';

export default function MyProfile() {
  const [role, setRole] = useState(() => localStorage.getItem('kraft_role') || 'user');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    localStorage.setItem('kraft_role', role);
  }, [role]);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => base44.entities.Agent.list()
  });

  const { data: allocations = [] } = useQuery({
    queryKey: ['allocations'],
    queryFn: () => base44.entities.Allocation.list()
  });

  // Get current user's agent profile
  const myAgent = agents.find(a => a.email === currentUser?.email) || agents[0];
  const myAllocations = allocations.filter(a => a.agent_id === myAgent?.id);
  const approvedAllocations = myAllocations.filter(a => a.status === 'approved');
  const utilization = myAgent ? ((myAgent.current_load || 0) / (myAgent.availability_hours || 40)) * 100 : 0;

  return (
    <div className="flex h-screen bg-slate-50">
      <ConsoleSidebar role={role} onRoleChange={setRole} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <ConsoleHeader role={role} onRoleChange={setRole} />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
              <p className="text-slate-500 mt-1">Your allocation profile and settings</p>
            </div>

            {/* Profile Card */}
            <Card className="border-slate-100">
              <CardContent className="p-6">
                <div className="flex items-start gap-6">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center">
                    <span className="text-3xl font-bold text-indigo-700">
                      {myAgent?.name?.charAt(0) || currentUser?.full_name?.charAt(0) || '?'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-slate-900">
                      {myAgent?.name || currentUser?.full_name || 'User'}
                    </h2>
                    <p className="text-slate-500">{myAgent?.role || 'Team Member'}</p>
                    
                    <div className="flex items-center gap-4 mt-4 text-sm text-slate-600">
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4 text-slate-400" />
                        {myAgent?.email || currentUser?.email || 'No email'}
                      </span>
                      <Badge className={
                        myAgent?.status === 'available' ? 'bg-emerald-100 text-emerald-700' :
                        myAgent?.status === 'busy' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-600'
                      }>
                        {myAgent?.status || 'available'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-slate-100">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-indigo-50">
                      <Target className="w-4 h-4 text-indigo-600" />
                    </div>
                    <span className="text-sm text-slate-500">Assigned Tasks</span>
                  </div>
                  <p className="text-3xl font-bold text-slate-900">{approvedAllocations.length}</p>
                </CardContent>
              </Card>
              
              <Card className="border-slate-100">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-amber-50">
                      <Clock className="w-4 h-4 text-amber-600" />
                    </div>
                    <span className="text-sm text-slate-500">Weekly Hours</span>
                  </div>
                  <p className="text-3xl font-bold text-slate-900">{myAgent?.availability_hours || 40}h</p>
                </CardContent>
              </Card>
            </div>

            {/* Workload */}
            <Card className="border-slate-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Current Workload</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Capacity Utilization</span>
                    <span className={`text-sm font-medium ${utilization > 90 ? 'text-red-600' : 'text-slate-700'}`}>
                      {myAgent?.current_load || 0}h / {myAgent?.availability_hours || 40}h
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(utilization, 100)} 
                    className={`h-3 ${utilization > 90 ? '[&>div]:bg-red-500' : '[&>div]:bg-indigo-500'}`}
                  />
                  <p className="text-xs text-slate-400">
                    {utilization > 90 
                      ? 'You are near or at full capacity'
                      : `You have ${Math.round((myAgent?.availability_hours || 40) - (myAgent?.current_load || 0))}h available`}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Skills */}
            <Card className="border-slate-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-600" />
                  My Skills
                </CardTitle>
              </CardHeader>
              <CardContent>
                {myAgent?.skills?.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {myAgent.skills.map(skill => (
                      <Badge 
                        key={skill} 
                        className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm">No skills defined. Contact your admin to update your profile.</p>
                )}
              </CardContent>
            </Card>

            {/* Constraints */}
            {myAgent?.constraints?.length > 0 && (
              <Card className="border-slate-100">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">My Constraints</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {myAgent.constraints.map((constraint, i) => (
                      <div key={i} className="p-3 bg-slate-50 rounded-lg text-sm text-slate-600">
                        {constraint}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}