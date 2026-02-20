import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit2,
  Trash2,
  Shield,
  AlertCircle,
  Zap
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ConsoleSidebar from '@/components/console/ConsoleSidebar';
import ConsoleHeader from '@/components/console/ConsoleHeader';
import { motion } from 'framer-motion';

const categoryIcons = {
  skill: '🎯',
  availability: '⏰',
  workload: '⚖️',
  priority: '🔥',
  dependency: '🔗',
  custom: '⚙️'
};

export default function AdminConstraints() {
  const [role, setRole] = useState(() => localStorage.getItem('kraft_role') || 'admin');
  const [searchQuery, setSearchQuery] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingConstraint, setEditingConstraint] = useState(null);
  const [weight, setWeight] = useState([5]);

  useEffect(() => {
    localStorage.setItem('kraft_role', role);
  }, [role]);

  const queryClient = useQueryClient();

  const { data: constraints = [], isLoading } = useQuery({
    queryKey: ['constraints'],
    queryFn: () => base44.entities.Constraint.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Constraint.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['constraints'] });
      setSheetOpen(false);
      setEditingConstraint(null);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Constraint.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['constraints'] });
      setSheetOpen(false);
      setEditingConstraint(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Constraint.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['constraints'] })
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.Constraint.update(id, { is_active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['constraints'] })
  });

  const filteredConstraints = constraints.filter(c => 
    c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      name: formData.get('name'),
      description: formData.get('description'),
      type: formData.get('type'),
      category: formData.get('category'),
      weight: weight[0],
      rule_expression: formData.get('rule_expression'),
      is_active: true
    };

    if (editingConstraint) {
      updateMutation.mutate({ id: editingConstraint.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openSheet = (constraint = null) => {
    setEditingConstraint(constraint);
    setWeight([constraint?.weight || 5]);
    setSheetOpen(true);
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <ConsoleSidebar role={role} onRoleChange={setRole} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <ConsoleHeader role={role} onRoleChange={setRole} />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Constraints</h1>
                <p className="text-slate-500 mt-1">Define rules that govern task allocation</p>
              </div>
              <Button 
                className="bg-indigo-600 hover:bg-indigo-700 gap-2"
                onClick={() => openSheet()}
              >
                <Plus className="w-4 h-4" />
                Add Constraint
              </Button>
            </div>

            <Card className="border-slate-100">
              <CardContent className="p-4">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    placeholder="Search constraints..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-4">
              {filteredConstraints.map((constraint, index) => (
                <motion.div
                  key={constraint.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={`border-slate-100 ${!constraint.is_active ? 'opacity-60' : ''}`}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{categoryIcons[constraint.category] || '⚙️'}</span>
                          <div>
                            <h3 className="font-semibold text-slate-800">{constraint.name}</h3>
                            <p className="text-sm text-slate-500">{constraint.category}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={constraint.is_active}
                            onCheckedChange={(checked) => 
                              toggleMutation.mutate({ id: constraint.id, is_active: checked })
                            }
                          />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openSheet(constraint)}>
                                <Edit2 className="w-4 h-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => deleteMutation.mutate(constraint.id)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      <p className="text-sm text-slate-600 mb-4">{constraint.description}</p>

                      <div className="flex items-center justify-between">
                        <Badge className={
                          constraint.type === 'hard' 
                            ? 'bg-red-100 text-red-700 border-red-200' 
                            : 'bg-amber-100 text-amber-700 border-amber-200'
                        }>
                          {constraint.type === 'hard' ? (
                            <><AlertCircle className="w-3 h-3 mr-1" /> Hard</>
                          ) : (
                            <><Zap className="w-3 h-3 mr-1" /> Soft</>
                          )}
                        </Badge>
                        
                        {constraint.type === 'soft' && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">Weight:</span>
                            <span className="text-sm font-medium text-slate-700">{constraint.weight}/10</span>
                          </div>
                        )}
                      </div>

                      {constraint.rule_expression && (
                        <div className="mt-3 p-2 bg-slate-50 rounded-lg">
                          <code className="text-xs text-slate-600">{constraint.rule_expression}</code>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {filteredConstraints.length === 0 && !isLoading && (
              <Card className="border-slate-100">
                <CardContent className="text-center py-12 text-slate-400">
                  <Shield className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p className="text-lg font-medium">No constraints defined</p>
                  <p className="text-sm mt-1">Add constraints to guide the allocation reasoning</p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{editingConstraint ? 'Edit Constraint' : 'Add Constraint'}</SheetTitle>
            <SheetDescription>Define allocation rules and priorities</SheetDescription>
          </SheetHeader>
          
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={editingConstraint?.name} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                name="description" 
                defaultValue={editingConstraint?.description}
                placeholder="What does this constraint enforce?"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select name="type" defaultValue={editingConstraint?.type || 'hard'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hard">Hard (Must satisfy)</SelectItem>
                    <SelectItem value="soft">Soft (Preference)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select name="category" defaultValue={editingConstraint?.category || 'custom'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="skill">Skill</SelectItem>
                    <SelectItem value="availability">Availability</SelectItem>
                    <SelectItem value="workload">Workload</SelectItem>
                    <SelectItem value="priority">Priority</SelectItem>
                    <SelectItem value="dependency">Dependency</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Weight (for soft constraints)</Label>
              <div className="flex items-center gap-4">
                <Slider
                  value={weight}
                  onValueChange={setWeight}
                  min={1}
                  max={10}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm font-medium text-slate-700 w-8">{weight[0]}/10</span>
              </div>
              <p className="text-xs text-slate-400">Higher weight = higher priority during reasoning</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rule_expression">Rule Expression (optional)</Label>
              <Textarea 
                id="rule_expression" 
                name="rule_expression" 
                defaultValue={editingConstraint?.rule_expression}
                placeholder="agent.skills CONTAINS task.required_skills"
                rows={2}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setSheetOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                {editingConstraint ? 'Update' : 'Add'} Constraint
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}