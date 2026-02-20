// Mock data service for standalone app

const STORAGE_KEY = 'kraft_app_data';

// Initialize default mock data
const defaultData = {
  tasks: [
    {
      id: '1',
      title: 'Design System Overhaul',
      description: 'Redesign the entire component library',
      required_skills: ['UI/UX', 'React', 'TypeScript'],
      priority: 'critical',
      estimated_hours: 40,
      deadline: '2026-03-15',
      status: 'unassigned',
      assigned_to: null,
      project_id: '1',
      dependencies: [],
      is_recurring: false,
      ai_suggested_priority: 'critical',
      ai_priority_reasoning: 'Critical deadline approaching with high skill requirements',
      created_date: '2026-01-15T10:00:00Z'
    },
    {
      id: '2',
      title: 'API Integration',
      description: 'Connect frontend with REST API',
      required_skills: ['JavaScript', 'API', 'Node.js'],
      priority: 'high',
      estimated_hours: 24,
      deadline: '2026-02-28',
      status: 'assigned',
      assigned_to: '2',
      project_id: '1',
      dependencies: [],
      is_recurring: false,
      created_date: '2026-01-16T10:00:00Z'
    },
    {
      id: '3',
      title: 'Database Optimization',
      description: 'Optimize query performance',
      required_skills: ['SQL', 'Database', 'Performance'],
      priority: 'medium',
      estimated_hours: 16,
      deadline: '2026-03-01',
      status: 'in_progress',
      assigned_to: '3',
      project_id: '2',
      dependencies: ['2'],
      is_recurring: false,
      created_date: '2026-01-17T10:00:00Z'
    },
    {
      id: '4',
      title: 'Mobile Responsiveness',
      description: 'Make app fully responsive',
      required_skills: ['CSS', 'UI/UX', 'React'],
      priority: 'high',
      estimated_hours: 20,
      deadline: '2026-02-20',
      status: 'unassigned',
      assigned_to: null,
      project_id: '1',
      dependencies: ['1'],
      is_recurring: false,
      ai_suggested_priority: 'high',
      ai_priority_reasoning: 'Dependent on design system completion',
      created_date: '2026-01-18T10:00:00Z'
    },
    {
      id: '5',
      title: 'User Authentication',
      description: 'Implement secure auth flow',
      required_skills: ['Security', 'Node.js', 'JavaScript'],
      priority: 'critical',
      estimated_hours: 32,
      deadline: '2026-02-25',
      status: 'unassigned',
      assigned_to: null,
      project_id: '2',
      dependencies: [],
      is_recurring: false,
      created_date: '2026-01-19T10:00:00Z'
    },
    {
      id: '6',
      title: 'Daily Standup',
      description: 'Team daily sync meeting',
      required_skills: [],
      priority: 'low',
      estimated_hours: 0.5,
      deadline: null,
      status: 'in_progress',
      assigned_to: null,
      project_id: null,
      dependencies: [],
      is_recurring: true,
      recurrence_pattern: 'daily',
      created_date: '2026-01-20T10:00:00Z'
    }
  ],
  projects: [
    {
      id: '1',
      name: 'Website Redesign',
      description: 'Complete overhaul of company website',
      status: 'active',
      start_date: '2026-01-01',
      end_date: '2026-03-31',
      team_members: ['1', '2', '4'],
      progress_percentage: 35,
      created_date: '2026-01-01T10:00:00Z'
    },
    {
      id: '2',
      name: 'Backend Infrastructure',
      description: 'Build scalable backend services',
      status: 'active',
      start_date: '2026-01-15',
      end_date: '2026-04-15',
      team_members: ['2', '3', '4'],
      progress_percentage: 20,
      created_date: '2026-01-15T10:00:00Z'
    }
  ],
  agents: [
    {
      id: '1',
      name: 'Sarah Chen',
      email: 'sarah@example.com',
      role: 'Senior Frontend Developer',
      skills: ['React', 'TypeScript', 'UI/UX', 'CSS'],
      availability_hours: 40,
      current_load: 30,
      status: 'available',
      avatar_url: null,
      created_date: '2026-01-01T10:00:00Z'
    },
    {
      id: '2',
      name: 'Marcus Johnson',
      email: 'marcus@example.com',
      role: 'Full Stack Developer',
      skills: ['JavaScript', 'Node.js', 'API', 'React'],
      availability_hours: 40,
      current_load: 24,
      status: 'available',
      avatar_url: null,
      created_date: '2026-01-01T10:00:00Z'
    },
    {
      id: '3',
      name: 'Elena Rodriguez',
      email: 'elena@example.com',
      role: 'Database Engineer',
      skills: ['SQL', 'Database', 'Performance', 'Python'],
      availability_hours: 35,
      current_load: 16,
      status: 'available',
      avatar_url: null,
      created_date: '2026-01-01T10:00:00Z'
    },
    {
      id: '4',
      name: 'David Kim',
      email: 'david@example.com',
      role: 'Security Specialist',
      skills: ['Security', 'Node.js', 'JavaScript', 'DevOps'],
      availability_hours: 40,
      current_load: 38,
      status: 'busy',
      avatar_url: null,
      created_date: '2026-01-01T10:00:00Z'
    }
  ],
  allocations: [
    {
      id: '1',
      task_id: '2',
      agent_id: '2',
      status: 'approved',
      confidence: 92,
      reasoning: {
        skill_match: 'Matched 3 skills: JavaScript, API, Node.js',
        constraint_satisfaction: 'All hard constraints satisfied',
        load_balance: 'Agent at 60% capacity',
        summary: 'Best available match based on automatic strategy'
      },
      allocation_run_id: 'run_1',
      strategy_used: 'automatic',
      created_date: '2026-01-20T10:00:00Z'
    },
    {
      id: '2',
      task_id: '3',
      agent_id: '3',
      status: 'approved',
      confidence: 95,
      reasoning: {
        skill_match: 'Matched 3 skills: SQL, Database, Performance',
        constraint_satisfaction: 'All hard constraints satisfied',
        load_balance: 'Agent at 46% capacity',
        summary: 'Perfect skill match'
      },
      allocation_run_id: 'run_1',
      strategy_used: 'automatic',
      created_date: '2026-01-20T10:30:00Z'
    }
  ],
  constraints: [
    {
      id: '1',
      name: 'Skill Match Required',
      description: 'Agent must have at least one required skill',
      type: 'hard',
      category: 'skill',
      weight: 10,
      is_active: true,
      created_date: '2026-01-01T10:00:00Z'
    },
    {
      id: '2',
      name: 'Max Capacity',
      description: 'Agent cannot exceed 100% capacity',
      type: 'hard',
      category: 'workload',
      weight: 10,
      is_active: true,
      created_date: '2026-01-01T10:00:00Z'
    }
  ]
};

// Load data from localStorage or use defaults
export const loadData = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Error loading data:', e);
    }
  }
  saveData(defaultData);
  return defaultData;
};

// Save data to localStorage
export const saveData = (data) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

// Get all entities of a type
export const getAll = (entityType) => {
  const data = loadData();
  return data[entityType] || [];
};

// Get by ID
export const getById = (entityType, id) => {
  const data = loadData();
  return data[entityType]?.find(item => item.id === id);
};

// Filter entities
export const filter = (entityType, filterFn) => {
  const data = loadData();
  return (data[entityType] || []).filter(filterFn);
};

// Create entity
export const create = (entityType, newItem) => {
  const data = loadData();
  const id = Date.now().toString();
  const created_date = new Date().toISOString();
  const item = { ...newItem, id, created_date };
  
  if (!data[entityType]) data[entityType] = [];
  data[entityType].push(item);
  saveData(data);
  return item;
};

// Update entity
export const update = (entityType, id, updates) => {
  const data = loadData();
  const index = data[entityType]?.findIndex(item => item.id === id);
  
  if (index !== -1) {
    data[entityType][index] = { ...data[entityType][index], ...updates, updated_date: new Date().toISOString() };
    saveData(data);
    return data[entityType][index];
  }
  return null;
};

// Delete entity
export const remove = (entityType, id) => {
  const data = loadData();
  if (data[entityType]) {
    data[entityType] = data[entityType].filter(item => item.id !== id);
    saveData(data);
  }
};

// Reset to defaults
export const resetData = () => {
  saveData(defaultData);
  return defaultData;
};

// Mock bottleneck analysis
export const analyzeBottlenecks = () => {
  const data = loadData();
  const tasks = data.tasks || [];
  const agents = data.agents || [];
  
  const unassignedTasks = tasks.filter(t => t.status === 'unassigned');
  const overloadedAgents = agents.filter(a => (a.current_load / a.availability_hours) > 0.9);
  
  // Skill gap analysis
  const requiredSkills = new Set();
  tasks.forEach(task => {
    (task.required_skills || []).forEach(skill => requiredSkills.add(skill));
  });
  
  const availableSkills = new Set();
  agents.forEach(agent => {
    (agent.skills || []).forEach(skill => availableSkills.add(skill));
  });
  
  const missingSkills = [...requiredSkills].filter(skill => !availableSkills.has(skill));
  
  return {
    analysis: {
      bottlenecks: [
        ...(unassignedTasks.length > 2 ? [{
          type: 'capacity',
          severity: 'high',
          description: `${unassignedTasks.length} tasks are unassigned`,
          affected_count: unassignedTasks.length
        }] : []),
        ...(overloadedAgents.length > 0 ? [{
          type: 'overload',
          severity: 'medium',
          description: `${overloadedAgents.length} agents are overloaded`,
          affected_count: overloadedAgents.length
        }] : []),
        ...(missingSkills.length > 0 ? [{
          type: 'skill_gap',
          severity: 'medium',
          description: `${missingSkills.length} required skills are missing from the team`,
          affected_count: missingSkills.length
        }] : [])
      ],
      predictions: [
        {
          timeframe: 'Next Week',
          issue: 'Capacity shortage expected for React tasks',
          confidence: 0.75
        },
        {
          timeframe: 'Next Month',
          issue: 'High-priority tasks may exceed team capacity',
          confidence: 0.65
        }
      ],
      recommendations: [
        {
          action: 'Hire a React specialist',
          impact: 'Reduce React task backlog by 40%',
          priority: 'high'
        },
        {
          action: 'Redistribute workload from overloaded agents',
          impact: 'Balance team capacity and prevent burnout',
          priority: 'medium'
        },
        {
          action: 'Cross-train team members on missing skills',
          impact: 'Improve skill coverage by 25%',
          priority: 'medium'
        }
      ]
    },
    metrics: {
      unassigned_tasks: unassignedTasks.length,
      avg_allocation_success_rate: 0.82
    }
  };
};