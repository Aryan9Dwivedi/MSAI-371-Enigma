import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch data for analysis
    const [tasks, agents, allocations, allocationRuns] = await Promise.all([
      base44.entities.Task.list(),
      base44.entities.Agent.list(),
      base44.entities.Allocation.list(),
      base44.entities.AllocationRun.list('-created_date', 20)
    ]);

    // Use AI to analyze and detect bottlenecks
    const analysisPrompt = `Analyze this team allocation data and identify bottlenecks and provide recommendations:

AGENTS (${agents.length} total):
${agents.map(a => `- ${a.name}: ${a.status}, ${a.current_load || 0}h/${a.availability_hours || 40}h capacity, Skills: ${(a.skills || []).join(', ')}`).join('\n')}

TASKS (${tasks.length} total, ${tasks.filter(t => t.status === 'unassigned').length} unassigned):
${tasks.slice(0, 10).map(t => `- ${t.title}: ${t.priority} priority, ${t.status}, Skills needed: ${(t.required_skills || []).join(', ')}`).join('\n')}

RECENT ALLOCATION RUNS (${allocationRuns.length} completed):
${allocationRuns.slice(0, 5).map(r => `- ${r.strategy}: ${r.successful_allocations}/${r.tasks_processed} successful`).join('\n')}

Identify:
1. Current bottlenecks (overloaded agents, skill gaps, capacity issues)
2. Predicted future issues based on trends
3. Recommended task re-prioritization
4. Suggested actions to optimize allocation

Output as JSON with this structure:
{
  "bottlenecks": [{"type": "string", "severity": "high|medium|low", "description": "string", "affected_count": number}],
  "predictions": [{"timeframe": "string", "issue": "string", "confidence": number}],
  "recommendations": [{"action": "string", "impact": "string", "priority": "high|medium|low"}],
  "task_reprioritization": [{"task_title": "string", "current_priority": "string", "suggested_priority": "string", "reason": "string"}]
}`;

    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: analysisPrompt,
      response_json_schema: {
        type: "object",
        properties: {
          bottlenecks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                type: { type: "string" },
                severity: { type: "string" },
                description: { type: "string" },
                affected_count: { type: "number" }
              }
            }
          },
          predictions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                timeframe: { type: "string" },
                issue: { type: "string" },
                confidence: { type: "number" }
              }
            }
          },
          recommendations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                action: { type: "string" },
                impact: { type: "string" },
                priority: { type: "string" }
              }
            }
          },
          task_reprioritization: {
            type: "array",
            items: {
              type: "object",
              properties: {
                task_title: { type: "string" },
                current_priority: { type: "string" },
                suggested_priority: { type: "string" },
                reason: { type: "string" }
              }
            }
          }
        }
      }
    });

    // Calculate some real metrics
    const overloadedAgents = agents.filter(a => 
      (a.current_load || 0) / (a.availability_hours || 40) > 0.9
    );
    
    const allRequiredSkills = [...new Set(tasks.flatMap(t => t.required_skills || []))];
    const allAgentSkills = [...new Set(agents.flatMap(a => a.skills || []))];
    const skillGaps = allRequiredSkills.filter(s => !allAgentSkills.includes(s));

    return Response.json({
      success: true,
      analysis,
      metrics: {
        overloaded_agents: overloadedAgents.length,
        skill_gaps: skillGaps.length,
        unassigned_tasks: tasks.filter(t => t.status === 'unassigned').length,
        avg_allocation_success_rate: allocationRuns.length > 0
          ? allocationRuns.reduce((sum, r) => sum + (r.successful_allocations / (r.tasks_processed || 1)), 0) / allocationRuns.length
          : 0
      },
      skill_gaps: skillGaps,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return Response.json({ 
      error: error.message,
      success: false
    }, { status: 500 });
  }
});