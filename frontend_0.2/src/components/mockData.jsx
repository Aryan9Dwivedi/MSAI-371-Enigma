// Mock data service for standalone app

const STORAGE_KEY = 'kraft_app_data';

// Initialize default mock data (Scenario B: Course Product Company)
const defaultData = {
  tasks: [
    {
      id: '1',
      title: 'Define learning outcomes for AI Productivity 101',
      description: 'Create measurable outcomes and module-level objectives for a 6-week course.',
      required_skills: ['Instructional Design', 'Learning Science', 'Curriculum Design'],
      priority: 'critical',
      estimated_hours: 18,
      deadline: '2026-03-05',
      status: 'completed',
      assigned_to: '2',
      project_id: '1',
      dependencies: [],
      is_recurring: false,
      created_date: '2026-02-01T10:00:00Z'
    },
    {
      id: '2',
      title: 'Draft lesson scripts for Modules 1-3',
      description: 'Write instructor-ready scripts with examples, transitions, and quiz prompts.',
      required_skills: ['Instructional Writing', 'Curriculum Design', 'AI Tools'],
      priority: 'high',
      estimated_hours: 30,
      deadline: '2026-03-10',
      status: 'in_progress',
      assigned_to: '3',
      project_id: '1',
      dependencies: ['1'],
      is_recurring: false,
      created_date: '2026-02-02T10:00:00Z'
    },
    {
      id: '3',
      title: 'Record instructor videos for Modules 1-3',
      description: 'Studio recording for course core modules with teleprompter support.',
      required_skills: ['Public Speaking', 'On-Camera Teaching', 'Course Delivery'],
      priority: 'high',
      estimated_hours: 24,
      deadline: '2026-03-14',
      status: 'assigned',
      assigned_to: '4',
      project_id: '1',
      dependencies: ['2'],
      is_recurring: false,
      created_date: '2026-02-03T10:00:00Z'
    },
    {
      id: '4',
      title: 'Edit videos and add captions',
      description: 'Post-production for accessibility-ready lessons, intro/outro bumpers, and chapter markers.',
      required_skills: ['Video Editing', 'Motion Graphics', 'Accessibility'],
      priority: 'high',
      estimated_hours: 36,
      deadline: '2026-03-18',
      status: 'unassigned',
      assigned_to: null,
      project_id: '1',
      dependencies: ['3'],
      is_recurring: false,
      ai_suggested_priority: 'high',
      ai_priority_reasoning: 'Critical path for course launch and QA.',
      created_date: '2026-02-04T10:00:00Z'
    },
    {
      id: '5',
      title: 'Build quiz bank for Module 1',
      description: 'Create formative and summative quizzes with answer rationales.',
      required_skills: ['Assessment Design', 'Learning Science', 'Data Analysis'],
      priority: 'medium',
      estimated_hours: 12,
      deadline: '2026-03-12',
      status: 'assigned',
      assigned_to: '8',
      project_id: '1',
      dependencies: ['1'],
      is_recurring: false,
      created_date: '2026-02-04T14:00:00Z'
    },
    {
      id: '6',
      title: 'Create course landing page copy',
      description: 'Write positioning, syllabus highlights, social proof, and CTA copy.',
      required_skills: ['Copywriting', 'SEO', 'Product Marketing'],
      priority: 'high',
      estimated_hours: 10,
      deadline: '2026-03-09',
      status: 'completed',
      assigned_to: '11',
      project_id: '1',
      dependencies: [],
      is_recurring: false,
      created_date: '2026-02-05T10:00:00Z'
    },
    {
      id: '7',
      title: 'Implement LMS course structure',
      description: 'Create modules, lessons, downloads, and progress tracking in LMS.',
      required_skills: ['LMS Administration', 'API', 'Quality Assurance'],
      priority: 'critical',
      estimated_hours: 20,
      deadline: '2026-03-15',
      status: 'in_progress',
      assigned_to: '6',
      project_id: '1',
      dependencies: ['2'],
      is_recurring: false,
      created_date: '2026-02-06T10:00:00Z'
    },
    {
      id: '8',
      title: 'Run pre-launch QA for full learner journey',
      description: 'Validate enrollment, lesson playback, quizzes, completion, and certificate flow.',
      required_skills: ['Quality Assurance', 'LMS Administration', 'Troubleshooting'],
      priority: 'critical',
      estimated_hours: 16,
      deadline: '2026-03-20',
      status: 'unassigned',
      assigned_to: null,
      project_id: '1',
      dependencies: ['4', '5', '7'],
      is_recurring: false,
      ai_suggested_priority: 'critical',
      ai_priority_reasoning: 'Launch blocker if learner journey breaks.',
      created_date: '2026-02-07T10:00:00Z'
    },
    {
      id: '9',
      title: 'Plan cohort kickoff webinar',
      description: 'Create kickoff agenda, host script, and attendee FAQ.',
      required_skills: ['Community Ops', 'Public Speaking', 'Event Planning'],
      priority: 'medium',
      estimated_hours: 8,
      deadline: '2026-03-18',
      status: 'assigned',
      assigned_to: '7',
      project_id: '3',
      dependencies: [],
      is_recurring: false,
      created_date: '2026-02-08T10:00:00Z'
    },
    {
      id: '10',
      title: 'Moderate community discussion threads (Week 1)',
      description: 'Monitor discussion quality, answer common blockers, and escalate unresolved issues.',
      required_skills: ['Community Management', 'Learner Support', 'Communication'],
      priority: 'high',
      estimated_hours: 14,
      deadline: '2026-03-25',
      status: 'in_progress',
      assigned_to: '7',
      project_id: '3',
      dependencies: ['9'],
      is_recurring: true,
      recurrence_pattern: 'weekly',
      created_date: '2026-02-08T14:00:00Z'
    },
    {
      id: '11',
      title: 'Analyze learner drop-off after Module 1',
      description: 'Use funnel and engagement metrics to identify key churn points.',
      required_skills: ['Data Analysis', 'SQL', 'Experiment Design'],
      priority: 'medium',
      estimated_hours: 10,
      deadline: '2026-03-28',
      status: 'unassigned',
      assigned_to: null,
      project_id: '2',
      dependencies: ['7'],
      is_recurring: false,
      created_date: '2026-02-09T10:00:00Z'
    },
    {
      id: '12',
      title: 'Design retention intervention experiment',
      description: 'Propose and define A/B interventions for low-completion learners.',
      required_skills: ['Learning Science', 'Experiment Design', 'Data Analysis'],
      priority: 'high',
      estimated_hours: 12,
      deadline: '2026-03-30',
      status: 'unassigned',
      assigned_to: null,
      project_id: '2',
      dependencies: ['11'],
      is_recurring: false,
      created_date: '2026-02-09T13:00:00Z'
    },
    {
      id: '13',
      title: 'Publish monthly curriculum roadmap update',
      description: 'Share upcoming courses, updates, and timelines with learners and partners.',
      required_skills: ['Product Marketing', 'Copywriting', 'Stakeholder Communication'],
      priority: 'low',
      estimated_hours: 6,
      deadline: '2026-03-31',
      status: 'assigned',
      assigned_to: '10',
      project_id: '2',
      dependencies: [],
      is_recurring: true,
      recurrence_pattern: 'monthly',
      created_date: '2026-02-10T10:00:00Z'
    },
    {
      id: '14',
      title: 'Prepare office-hours support playbook',
      description: 'Create issue triage templates and escalation pathways for course support.',
      required_skills: ['Learner Support', 'Knowledge Base', 'Process Design'],
      priority: 'medium',
      estimated_hours: 9,
      deadline: '2026-03-16',
      status: 'completed',
      assigned_to: '12',
      project_id: '3',
      dependencies: [],
      is_recurring: false,
      created_date: '2026-02-10T15:00:00Z'
    },
    {
      id: '15',
      title: 'Design badge and certification visuals',
      description: 'Create visual assets for completion badges and certificates.',
      required_skills: ['Visual Design', 'Brand Design', 'Figma'],
      priority: 'medium',
      estimated_hours: 11,
      deadline: '2026-03-17',
      status: 'assigned',
      assigned_to: '9',
      project_id: '1',
      dependencies: ['1'],
      is_recurring: false,
      created_date: '2026-02-11T09:30:00Z'
    }
  ],
  projects: [
    {
      id: '1',
      name: 'AI Productivity 101 (Spring Cohort)',
      description: 'End-to-end production and launch of flagship cohort course.',
      status: 'active',
      start_date: '2026-02-01',
      end_date: '2026-03-22',
      team_members: ['2', '3', '4', '6', '8', '9', '11'],
      progress_percentage: 58,
      created_date: '2026-02-01T09:00:00Z'
    },
    {
      id: '2',
      name: 'Curriculum Analytics & Optimization',
      description: 'Improve completion rate and learning outcomes using analytics and experiments.',
      status: 'active',
      start_date: '2026-02-08',
      end_date: '2026-04-15',
      team_members: ['2', '5', '8', '10'],
      progress_percentage: 26,
      created_date: '2026-02-08T09:00:00Z'
    },
    {
      id: '3',
      name: 'Community Growth & Learner Success',
      description: 'Scale cohort engagement, office hours quality, and learner support.',
      status: 'active',
      start_date: '2026-02-08',
      end_date: '2026-04-01',
      team_members: ['7', '12', '10'],
      progress_percentage: 41,
      created_date: '2026-02-08T09:00:00Z'
    }
  ],
  agents: [
    {
      id: '1',
      name: 'Emma Li',
      email: 'emma.li@kraftlearning.com',
      role: 'Head of Product',
      skills: ['Roadmapping', 'Stakeholder Management', 'Product Strategy'],
      availability_hours: 30,
      current_load: 24,
      status: 'busy',
      points: 4200,
      avatar_url: null,
      created_date: '2026-01-05T10:00:00Z'
    },
    {
      id: '2',
      name: 'Noah Patel',
      email: 'noah.patel@kraftlearning.com',
      role: 'Instructional Design Lead',
      skills: ['Instructional Design', 'Learning Science', 'Curriculum Design', 'Experiment Design'],
      availability_hours: 40,
      current_load: 31,
      status: 'available',
      points: 3680,
      avatar_url: null,
      created_date: '2026-01-05T10:00:00Z'
    },
    {
      id: '3',
      name: 'Grace Kim',
      email: 'grace.kim@kraftlearning.com',
      role: 'Senior Instructional Writer',
      skills: ['Instructional Writing', 'Curriculum Design', 'AI Tools', 'Copy Editing'],
      availability_hours: 40,
      current_load: 28,
      status: 'available',
      points: 2950,
      avatar_url: null,
      created_date: '2026-01-05T10:00:00Z'
    },
    {
      id: '4',
      name: 'Lucas Johnson',
      email: 'lucas.johnson@kraftlearning.com',
      role: 'Lead Instructor',
      skills: ['Public Speaking', 'On-Camera Teaching', 'Course Delivery', 'AI Tools'],
      availability_hours: 35,
      current_load: 20,
      status: 'available',
      points: 3320,
      avatar_url: null,
      created_date: '2026-01-05T10:00:00Z'
    },
    {
      id: '5',
      name: 'Mia Robinson',
      email: 'mia.robinson@kraftlearning.com',
      role: 'Learning Data Analyst',
      skills: ['Data Analysis', 'SQL', 'Experiment Design', 'Dashboarding'],
      availability_hours: 40,
      current_load: 26,
      status: 'available',
      points: 2740,
      avatar_url: null,
      created_date: '2026-01-06T10:00:00Z'
    },
    {
      id: '6',
      name: 'Ethan Garcia',
      email: 'ethan.garcia@kraftlearning.com',
      role: 'LMS Engineer',
      skills: ['LMS Administration', 'API', 'JavaScript', 'Quality Assurance'],
      availability_hours: 40,
      current_load: 30,
      status: 'available',
      points: 3100,
      avatar_url: null,
      created_date: '2026-01-06T10:00:00Z'
    },
    {
      id: '7',
      name: 'Sophia Martinez',
      email: 'sophia.martinez@kraftlearning.com',
      role: 'Community Manager',
      skills: ['Community Management', 'Learner Support', 'Communication', 'Event Planning'],
      availability_hours: 40,
      current_load: 34,
      status: 'busy',
      points: 2870,
      avatar_url: null,
      created_date: '2026-01-06T10:00:00Z'
    },
    {
      id: '8',
      name: 'Daniel Wu',
      email: 'daniel.wu@kraftlearning.com',
      role: 'Assessment Specialist',
      skills: ['Assessment Design', 'Learning Science', 'Data Analysis', 'Quality Assurance'],
      availability_hours: 35,
      current_load: 18,
      status: 'available',
      points: 2410,
      avatar_url: null,
      created_date: '2026-01-06T10:00:00Z'
    },
    {
      id: '9',
      name: 'Ava Brown',
      email: 'ava.brown@kraftlearning.com',
      role: 'Visual Designer',
      skills: ['Visual Design', 'Brand Design', 'Figma', 'Motion Graphics'],
      availability_hours: 40,
      current_load: 21,
      status: 'available',
      points: 2600,
      avatar_url: null,
      created_date: '2026-01-06T10:00:00Z'
    },
    {
      id: '10',
      name: 'Henry Davis',
      email: 'henry.davis@kraftlearning.com',
      role: 'Product Marketing Manager',
      skills: ['Product Marketing', 'SEO', 'Copywriting', 'Stakeholder Communication'],
      availability_hours: 40,
      current_load: 29,
      status: 'available',
      points: 2980,
      avatar_url: null,
      created_date: '2026-01-07T10:00:00Z'
    },
    {
      id: '11',
      name: 'Olivia Nguyen',
      email: 'olivia.nguyen@kraftlearning.com',
      role: 'Senior Content Marketer',
      skills: ['Copywriting', 'SEO', 'Instructional Writing', 'Content Strategy'],
      availability_hours: 35,
      current_load: 17,
      status: 'available',
      points: 2550,
      avatar_url: null,
      created_date: '2026-01-07T10:00:00Z'
    },
    {
      id: '12',
      name: 'James Wilson',
      email: 'james.wilson@kraftlearning.com',
      role: 'Learner Success Lead',
      skills: ['Learner Support', 'Knowledge Base', 'Process Design', 'Troubleshooting'],
      availability_hours: 40,
      current_load: 23,
      status: 'available',
      points: 2890,
      avatar_url: null,
      created_date: '2026-01-07T10:00:00Z'
    }
  ],
  allocations: [
    {
      id: '1',
      task_id: '1',
      agent_id: '2',
      status: 'approved',
      confidence: 94,
      reasoning: {
        skill_match: 'Strong match: Instructional Design + Learning Science + Curriculum Design',
        constraint_satisfaction: 'All hard constraints satisfied',
        load_balance: 'Current utilization 77%, still within target range',
        summary: 'Best strategic fit for outcome definition phase.'
      },
      allocation_run_id: 'run_course_1',
      strategy_used: 'automatic',
      created_date: '2026-02-01T11:00:00Z'
    },
    {
      id: '2',
      task_id: '6',
      agent_id: '11',
      status: 'approved',
      confidence: 90,
      reasoning: {
        skill_match: 'Copywriting + SEO + instructional writing experience matched',
        constraint_satisfaction: 'All hard constraints satisfied',
        load_balance: 'Utilization 49%, healthy capacity available',
        summary: 'Highest quality-speed tradeoff for launch copy.'
      },
      allocation_run_id: 'run_course_1',
      strategy_used: 'automatic',
      created_date: '2026-02-05T12:30:00Z'
    },
    {
      id: '3',
      task_id: '14',
      agent_id: '12',
      status: 'approved',
      confidence: 93,
      reasoning: {
        skill_match: 'Direct fit: Learner Support + Process Design + KB operations',
        constraint_satisfaction: 'All hard constraints satisfied',
        load_balance: 'Utilization 57%, can absorb this work',
        summary: 'Most reliable owner for support playbook quality.'
      },
      allocation_run_id: 'run_community_1',
      strategy_used: 'automatic',
      created_date: '2026-02-10T16:00:00Z'
    }
  ],
  constraints: [
    {
      id: '1',
      name: 'Skill Match Required',
      description: 'Assigned owner must cover at least one required skill; critical tasks require 2+.',
      type: 'hard',
      category: 'skill',
      weight: 10,
      is_active: true,
      created_date: '2026-01-01T10:00:00Z'
    },
    {
      id: '2',
      name: 'Capacity Ceiling',
      description: 'Agent utilization cannot exceed 100%, and should stay under 90% for sustainability.',
      type: 'hard',
      category: 'workload',
      weight: 10,
      is_active: true,
      created_date: '2026-01-01T10:00:00Z'
    },
    {
      id: '3',
      name: 'Critical Launch Timeline',
      description: 'Tasks on launch critical path must be staffed 5+ days before deadline.',
      type: 'hard',
      category: 'timeline',
      weight: 9,
      is_active: true,
      created_date: '2026-01-12T10:00:00Z'
    },
    {
      id: '4',
      name: 'Learner Experience Quality',
      description: 'Tasks affecting learner journey (quiz, LMS, support) prioritize QA-trained members.',
      type: 'soft',
      category: 'quality',
      weight: 8,
      is_active: true,
      created_date: '2026-01-15T10:00:00Z'
    },
    {
      id: '5',
      name: 'Community SLA Protection',
      description: 'Community and support workloads must preserve 24h first-response SLA.',
      type: 'soft',
      category: 'service',
      weight: 7,
      is_active: true,
      created_date: '2026-01-18T10:00:00Z'
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