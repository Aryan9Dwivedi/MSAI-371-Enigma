import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Brain, 
  Lightbulb, 
  MessageSquareText, 
  ArrowRight, 
  Database,
  Cpu,
  Target,
  FileText,
  ChevronRight,
  CheckCircle2,
  Users,
  ListTodo,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  const features = [
    {
      icon: Database,
      title: "Knowledge Modeling",
      description: "Define your team's knowledge base",
      points: ["Tasks & requirements", "Agent skills & availability", "Constraints & priorities"]
    },
    {
      icon: Cpu,
      title: "Reasoning Engine",
      description: "Intelligent evaluation of options",
      points: ["Constraint satisfaction", "Skill-task matching", "Workload optimization"]
    },
    {
      icon: MessageSquareText,
      title: "Explainable Decisions",
      description: "Transparent allocation reasoning",
      points: ["Clear assignment rationale", "Confidence scoring", "Audit-ready explanations"]
    }
  ];

  const pipelineSteps = [
    { 
      icon: Database, 
      title: "Model", 
      description: "Define tasks, agents, skills, and constraints",
      color: "bg-indigo-50 text-indigo-600 border-indigo-200"
    },
    { 
      icon: Cpu, 
      title: "Reason", 
      description: "KRAFT evaluates feasible assignments",
      color: "bg-violet-50 text-violet-600 border-violet-200"
    },
    { 
      icon: Target, 
      title: "Allocate", 
      description: "Tasks assigned automatically",
      color: "bg-purple-50 text-purple-600 border-purple-200"
    },
    { 
      icon: FileText, 
      title: "Explain", 
      description: "See why each decision was made",
      color: "bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-100 to-neutral-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-neutral-50/80 backdrop-blur-md border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">KRAFT</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">How It Works</a>
            <a href="#preview" className="text-sm text-slate-600 hover:text-slate-900 transition-colors">Preview</a>
          </nav>
          <Link to={createPageUrl('Console')}>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
              Open Console <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Knowledge-Reasoned Allocation for Teams
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-slate-900 tracking-tight mb-6">
              KRAFT
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              KRAFT models your team and tasks, reasons over constraints, 
              assigns work, and explains every decision.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={createPageUrl('Console')}>
                <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 px-8 h-12">
                  Open Console <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button size="lg" variant="outline" className="gap-2 px-8 h-12 border-slate-200">
                  See How It Works <ChevronRight className="w-4 h-4" />
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6 bg-neutral-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">What Makes KRAFT Different</h2>
            <p className="text-slate-600 max-w-xl mx-auto">
              A reasoning-first approach to task allocation
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-8">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 flex items-center justify-center mb-6">
                      <feature.icon className="w-7 h-7 text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">{feature.title}</h3>
                    <p className="text-slate-500 mb-6">{feature.description}</p>
                    <ul className="space-y-3">
                      {feature.points.map((point) => (
                        <li key={point} className="flex items-center gap-3 text-sm text-slate-600">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6 bg-gradient-to-b from-neutral-100 to-neutral-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">How KRAFT Works</h2>
            <p className="text-slate-600 max-w-xl mx-auto">
              A clear pipeline from knowledge to intelligent decisions
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {pipelineSteps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                <Card className={`h-full border ${step.color.split(' ')[2]} bg-neutral-50`}>
                  <CardContent className="p-6 text-center">
                    <div className="text-xs font-semibold text-slate-400 mb-4">STEP {index + 1}</div>
                    <div className={`w-16 h-16 rounded-2xl ${step.color.split(' ')[0]} flex items-center justify-center mx-auto mb-4`}>
                      <step.icon className={`w-8 h-8 ${step.color.split(' ')[1]}`} />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">{step.title}</h3>
                    <p className="text-sm text-slate-500">{step.description}</p>
                  </CardContent>
                </Card>
                {index < pipelineSteps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                    <ArrowRight className="w-6 h-6 text-slate-300" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Preview */}
      <section id="preview" className="py-20 px-6 bg-neutral-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Product Preview</h2>
            <p className="text-slate-600 max-w-xl mx-auto">
              A real tool for real teams
            </p>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-slate-900 rounded-2xl p-2 shadow-2xl"
          >
            <div className="bg-slate-800 rounded-xl overflow-hidden">
              {/* Mock header */}
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-800 border-b border-slate-700">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-1 bg-slate-700 rounded-md text-xs text-slate-400">
                    console.kraft.io/allocation
                  </div>
                </div>
              </div>
              
              {/* Mock content */}
              <div className="grid md:grid-cols-3 gap-0 bg-neutral-100">
                {/* Tasks Panel */}
                <div className="p-6 border-r border-neutral-200">
                  <div className="flex items-center gap-2 mb-4">
                    <ListTodo className="w-4 h-4 text-slate-500" />
                    <span className="font-medium text-slate-700 text-sm">Tasks</span>
                  </div>
                  <div className="space-y-2">
                    {['API Integration', 'UI Dashboard', 'Database Schema'].map((task, i) => (
                      <div key={task} className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                        <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-red-400' : i === 1 ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                        <span className="text-sm text-slate-700">{task}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Allocation Panel */}
                <div className="p-6 border-r border-neutral-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-4 h-4 text-slate-500" />
                    <span className="font-medium text-slate-700 text-sm">Allocation Results</span>
                  </div>
                  <div className="space-y-2">
                    {[
                      { task: 'API Integration', agent: 'Sarah Chen', confidence: 94 },
                      { task: 'UI Dashboard', agent: 'Mike Johnson', confidence: 87 },
                      { task: 'Database Schema', agent: 'Alex Park', confidence: 91 }
                    ].map((item) => (
                      <div key={item.task} className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-slate-700">{item.task}</span>
                          <span className="text-xs text-emerald-600 font-medium">{item.confidence}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center">
                            <Users className="w-3 h-3 text-indigo-600" />
                          </div>
                          <span className="text-xs text-slate-500">{item.agent}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Explanation Panel */}
                <div className="p-6 bg-neutral-100">
                  <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className="w-4 h-4 text-indigo-600" />
                    <span className="font-medium text-slate-700 text-sm">Why this assignment?</span>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                      <div className="text-sm font-medium text-slate-800 mb-3">API Integration → Sarah Chen</div>
                      <div className="space-y-2 text-xs text-slate-600">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <span><strong>Skill match:</strong> Expert in REST APIs, Node.js</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <span><strong>Constraints:</strong> All satisfied</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <span><strong>Workload:</strong> 24h assigned / 40h capacity</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-br from-indigo-600 to-violet-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to transform your team allocation?</h2>
          <p className="text-indigo-100 mb-8 text-lg">
            Let KRAFT handle the reasoning. You make the final call.
          </p>
          <Link to={createPageUrl('Console')}>
            <Button size="lg" className="bg-white text-indigo-600 hover:bg-indigo-50 gap-2 px-8 h-12">
              Open Console <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 bg-slate-900">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-semibold">KRAFT</span>
          </div>
          <p className="text-slate-400 text-sm">
            Knowledge-Reasoned Allocation for Teams
          </p>
        </div>
      </footer>
    </div>
  );
}