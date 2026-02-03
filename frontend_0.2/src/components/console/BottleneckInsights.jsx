import React, { useState, useEffect } from 'react';
import * as mockData from '@/components/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  TrendingUp,
  Sparkles,
  ArrowUpRight,
  ChevronRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Info,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';

export default function BottleneckInsights() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const refetch = () => {
    setIsLoading(true);
    setTimeout(() => {
      setAnalysis(mockData.analyzeBottlenecks());
      setIsLoading(false);
      toast({
        title: "Analysis updated",
        description: "Bottleneck insights refreshed",
        duration: 2000,
      });
    }, 1000);
  };

  useEffect(() => {
    refetch();
  }, []);

  const handleApplyRecommendation = (recommendation) => {
    toast({
      title: "Recommendation noted",
      description: recommendation.action,
      duration: 3000,
    });
  };

  if (!isExpanded && !isLoading && analysis?.analysis?.bottlenecks?.length > 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Button
          onClick={() => setIsExpanded(true)}
          className="bg-amber-500 hover:bg-amber-600 text-white shadow-lg gap-2 h-12 px-6"
        >
          <Sparkles className="w-5 h-5" />
          {analysis.analysis.bottlenecks.length} Insight{analysis.analysis.bottlenecks.length !== 1 ? 's' : ''}
          <ChevronRight className="w-4 h-4" />
        </Button>
      </motion.div>
    );
  }

  if (!isExpanded) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
      >
        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 dark:border-amber-800 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500 text-white">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-amber-900 dark:text-amber-100">
                    AI Insights & Recommendations
                  </CardTitle>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Proactive bottleneck detection
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => refetch()}
                  disabled={isLoading}
                  className="h-8 text-amber-700 hover:text-amber-900 dark:text-amber-300"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(false)}
                  className="h-8 text-amber-700 hover:text-amber-900 dark:text-amber-300"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-amber-600" />
                  <p className="text-sm text-amber-700 dark:text-amber-300">Analyzing allocation patterns...</p>
                </div>
              </div>
            ) : analysis?.analysis ? (
              <>
                {/* Bottlenecks */}
                {analysis.analysis.bottlenecks?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Current Bottlenecks
                    </h4>
                    {analysis.analysis.bottlenecks.map((bottleneck, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-amber-800"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={
                                bottleneck.severity === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' :
                                bottleneck.severity === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' :
                                'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                              }>
                                {bottleneck.severity}
                              </Badge>
                              <span className="text-xs text-amber-600 dark:text-amber-400">{bottleneck.type}</span>
                            </div>
                            <p className="text-sm text-slate-700 dark:text-slate-300">{bottleneck.description}</p>
                            {bottleneck.affected_count > 0 && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                Affects {bottleneck.affected_count} {bottleneck.type === 'skill_gap' ? 'skills' : 'agents'}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Predictions */}
                {analysis.analysis.predictions?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Future Predictions
                    </h4>
                    {analysis.analysis.predictions.slice(0, 2).map((prediction, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 + 0.3 }}
                        className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-amber-800"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                            {prediction.timeframe}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {Math.round(prediction.confidence * 100)}% confidence
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{prediction.issue}</p>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Top Recommendations */}
                {analysis.analysis.recommendations?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Recommended Actions
                    </h4>
                    {analysis.analysis.recommendations.slice(0, 3).map((rec, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 + 0.5 }}
                        className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-amber-800 hover:border-amber-300 dark:hover:border-amber-700 transition-colors cursor-pointer group"
                        onClick={() => handleApplyRecommendation(rec)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-1">{rec.action}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">{rec.impact}</p>
                          </div>
                          <Badge variant="outline" className={
                            rec.priority === 'high' ? 'border-red-300 text-red-700 dark:border-red-700 dark:text-red-400' :
                            rec.priority === 'medium' ? 'border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400' :
                            'border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-400'
                          }>
                            {rec.priority}
                          </Badge>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Metrics Summary */}
                {analysis.metrics && (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-amber-200 dark:border-amber-800">
                    <div className="text-center p-2 bg-white/50 dark:bg-slate-900/50 rounded">
                      <p className="text-lg font-bold text-amber-900 dark:text-amber-100">
                        {analysis.metrics.unassigned_tasks}
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-300">Unassigned</p>
                    </div>
                    <div className="text-center p-2 bg-white/50 dark:bg-slate-900/50 rounded">
                      <p className="text-lg font-bold text-amber-900 dark:text-amber-100">
                        {Math.round(analysis.metrics.avg_allocation_success_rate * 100)}%
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-300">Success Rate</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-6 text-amber-700 dark:text-amber-300">
                <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No insights available yet</p>
                <p className="text-xs mt-1 opacity-75">Run allocations to generate insights</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}