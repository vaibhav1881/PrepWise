'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Header } from '@/components/header';
import { Clock, Download, FileJson, TrendingUp, Pause } from 'lucide-react';

export default function InterviewReportPage() {
  const params = useParams();
  const router = useRouter();
  const interview_id = params.id as string;

  const [interview, setInterview] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadInterview();
  }, [interview_id]);

  const loadInterview = async () => {
    try {
      const response = await fetch(`/api/interview/get?interview_id=${interview_id}`);
      const data = await response.json();
      
      if (response.ok) {
        setInterview(data.interview);
        
        if (data.interview.final_report) {
          setReport(data.interview.final_report);
        }
      } else {
        setError(data.message);
      }
    } catch (err: any) {
      setError('Failed to load interview');
    }
  };

  const generateReport = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/interview/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interview_id }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setReport(data.report);
        await loadInterview(); // Reload to get updated status
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const downloadReport = () => {
    if (!report || !interview) return;

    // Create a comprehensive text report
    let reportText = `INTERVIEW REPORT\n`;
    reportText += `${'='.repeat(80)}\n\n`;
    reportText += `Role: ${interview.role_block.role_name}\n`;
    reportText += `Date: ${new Date(interview.created_at).toLocaleString()}\n`;
    reportText += `Questions Answered: ${interview.qa_history.length}\n`;
    reportText += `Overall Performance: ${report.overall_performance}/10\n\n`;

    // Add time statistics
    if (interview.total_time_seconds) {
      reportText += `TIME STATISTICS\n${'-'.repeat(80)}\n`;
      reportText += `Total Time: ${formatTime(interview.total_time_seconds)}\n`;
      reportText += `Average Time per Question: ${formatTime(Math.floor(interview.total_time_seconds / interview.qa_history.length))}\n`;
      if (interview.pause_count > 0) {
        reportText += `Pauses: ${interview.pause_count}\n`;
        reportText += `Total Pause Duration: ${formatTime(interview.pause_duration_seconds || 0)}\n`;
      }
      reportText += `\n`;
    }

    reportText += `SUMMARY\n${'-'.repeat(80)}\n${report.summary}\n\n`;

    reportText += `STRENGTHS\n${'-'.repeat(80)}\n`;
    report.strengths.forEach((s: string, i: number) => {
      reportText += `${i + 1}. ${s}\n`;
    });

    reportText += `\nAREAS TO IMPROVE\n${'-'.repeat(80)}\n`;
    report.weak_areas.forEach((w: string, i: number) => {
      reportText += `${i + 1}. ${w}\n`;
    });

    reportText += `\nSKILL BREAKDOWN\n${'-'.repeat(80)}\n`;
    Object.entries(report.skill_scores).forEach(([skill, score]) => {
      reportText += `${skill}: ${score}/10\n`;
    });

    reportText += `\nRECOMMENDATIONS\n${'-'.repeat(80)}\n`;
    report.recommendations.forEach((r: string, i: number) => {
      reportText += `${i + 1}. ${r}\n`;
    });

    reportText += `\nQUESTION HISTORY\n${'='.repeat(80)}\n`;
    interview.qa_history.forEach((qa: any) => {
      reportText += `\nQ${qa.question_number}: ${qa.question.question}\n`;
      reportText += `Category: ${qa.question.category} | Difficulty: ${qa.question.difficulty}\n`;
      reportText += `Score: ${qa.evaluation.overall_score}/10\n`;
      if (qa.time_spent_seconds) {
        reportText += `Time Spent: ${formatTime(qa.time_spent_seconds)}\n`;
      }
      reportText += `Answer: ${qa.answer_text}\n`;
      if (qa.feedback) {
        reportText += `Ideal Answer: ${qa.feedback.ideal_answer}\n`;
      }
      reportText += `${'-'.repeat(80)}\n`;
    });

    // Create downloadable file
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Interview_Report_${interview.role_block.role_name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadPDF = () => {
    if (!report || !interview) return;

    // Create detailed HTML content for PDF
    let htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Interview Report - ${interview.role_block.role_name}</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    h1 {
      text-align: center;
      color: #2563eb;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 10px;
      margin-bottom: 30px;
    }
    h2 {
      color: #1e40af;
      margin-top: 30px;
      border-bottom: 2px solid #ddd;
      padding-bottom: 5px;
    }
    h3 {
      color: #3b82f6;
      margin-top: 20px;
    }
    .header-info {
      background: #f3f4f6;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .score-box {
      text-align: center;
      background: #dbeafe;
      padding: 20px;
      border-radius: 10px;
      margin: 20px 0;
    }
    .score-box .score {
      font-size: 48px;
      font-weight: bold;
      color: #2563eb;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin: 20px 0;
    }
    .stat-item {
      background: #f9fafb;
      padding: 10px;
      border-left: 4px solid #3b82f6;
    }
    .question-block {
      background: #f9fafb;
      padding: 15px;
      margin: 15px 0;
      border-radius: 8px;
      border-left: 4px solid #3b82f6;
      page-break-inside: avoid;
    }
    .question-header {
      font-weight: bold;
      color: #1e40af;
      margin-bottom: 10px;
      font-size: 16px;
    }
    .question-meta {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 10px;
    }
    .answer-section {
      background: white;
      padding: 12px;
      margin: 10px 0;
      border-radius: 5px;
    }
    .score-badge {
      display: inline-block;
      background: #3b82f6;
      color: white;
      padding: 5px 15px;
      border-radius: 20px;
      font-weight: bold;
    }
    .feedback-section {
      background: #fef3c7;
      padding: 12px;
      margin: 10px 0;
      border-radius: 5px;
      border-left: 4px solid #f59e0b;
    }
    ul {
      margin: 10px 0;
      padding-left: 25px;
    }
    li {
      margin: 5px 0;
    }
    .section {
      margin: 25px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    th {
      background: #f3f4f6;
      font-weight: bold;
      color: #1e40af;
    }
    .page-break {
      page-break-after: always;
    }
    @media print {
      body {
        padding: 10px;
      }
      .question-block {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <h1>📋 Interview Report</h1>
  
  <div class="header-info">
    <strong>Role:</strong> ${interview.role_block.role_name}<br>
    <strong>Date:</strong> ${new Date(interview.created_at).toLocaleString()}<br>
    <strong>Questions Answered:</strong> ${interview.qa_history.length}
  </div>

  <div class="score-box">
    <div class="score">${report.overall_performance}/10</div>
    <div>Overall Performance</div>
  </div>
`;

    // Time Statistics
    if (interview.total_time_seconds) {
      htmlContent += `
  <h2>⏱️ Time Analytics</h2>
  <div class="stats-grid">
    <div class="stat-item">
      <strong>Total Time:</strong> ${formatTime(interview.total_time_seconds)}
    </div>
    <div class="stat-item">
      <strong>Avg/Question:</strong> ${formatTime(Math.floor(interview.total_time_seconds / interview.qa_history.length))}
    </div>`;
    
      if (interview.pause_count > 0) {
        htmlContent += `
    <div class="stat-item">
      <strong>Pauses:</strong> ${interview.pause_count}
    </div>
    <div class="stat-item">
      <strong>Pause Duration:</strong> ${formatTime(interview.pause_duration_seconds || 0)}
    </div>`;
      }
      
      htmlContent += `
  </div>`;
    }

    // Summary
    htmlContent += `
  <h2>📝 Summary</h2>
  <p>${report.summary}</p>
`;

    // Strengths
    htmlContent += `
  <h2>💪 Strengths</h2>
  <ul>
${report.strengths.map((s: string) => `    <li>${s}</li>`).join('\n')}
  </ul>
`;

    // Weak Areas
    htmlContent += `
  <h2>⚠️ Areas to Improve</h2>
  <ul>
${report.weak_areas.map((w: string) => `    <li>${w}</li>`).join('\n')}
  </ul>
`;

    // Skill Breakdown
    htmlContent += `
  <h2>📊 Skill Breakdown</h2>
  <table>
    <thead>
      <tr>
        <th>Skill</th>
        <th>Score</th>
      </tr>
    </thead>
    <tbody>
${Object.entries(report.skill_scores).map(([skill, score]) => `      <tr><td>${skill}</td><td><strong>${score}/10</strong></td></tr>`).join('\n')}
    </tbody>
  </table>
`;

    // Recommendations
    htmlContent += `
  <h2>💡 Recommendations</h2>
  <ul>
${report.recommendations.map((r: string) => `    <li>${r}</li>`).join('\n')}
  </ul>
`;

    // Question History - DETAILED
    htmlContent += `
  <div class="page-break"></div>
  <h2>📚 Detailed Question History</h2>
`;

    interview.qa_history.forEach((qa: any) => {
      htmlContent += `
  <div class="question-block">
    <div class="question-header">Question ${qa.question_number}: ${qa.question.question}</div>
    <div class="question-meta">
      Category: ${qa.question.category} | Difficulty: ${qa.question.difficulty} | Skill: ${qa.question.skill}
      ${qa.time_spent_seconds ? ` | Time: ${formatTime(qa.time_spent_seconds)}` : ''}
    </div>
    
    <h3>Your Answer:</h3>
    <div class="answer-section">
      ${qa.answer_text}
    </div>
    
    <div style="margin: 15px 0;">
      <span class="score-badge">Score: ${qa.evaluation.overall_score}/10</span>
    </div>
    
    <h3>Evaluation Breakdown:</h3>
    <table>
      <tr><td>Correctness</td><td><strong>${qa.evaluation.scores.correctness}/${interview.role_block.evaluation_rubric.correctness}</strong></td></tr>
      <tr><td>Clarity</td><td><strong>${qa.evaluation.scores.clarity}/${interview.role_block.evaluation_rubric.clarity}</strong></td></tr>
      <tr><td>Depth</td><td><strong>${qa.evaluation.scores.depth}/${interview.role_block.evaluation_rubric.depth}</strong></td></tr>
      <tr><td>Relevance</td><td><strong>${qa.evaluation.scores.relevance}/${interview.role_block.evaluation_rubric.relevance}</strong></td></tr>
    </table>
    
    ${qa.evaluation.notes ? `<p><strong>Notes:</strong> ${qa.evaluation.notes}</p>` : ''}
    
    ${qa.evaluation.weaknesses && qa.evaluation.weaknesses.length > 0 ? `
    <p><strong>Weaknesses:</strong></p>
    <ul>
      ${qa.evaluation.weaknesses.map((w: string) => `<li>${w}</li>`).join('\n      ')}
    </ul>` : ''}
`;

      if (qa.feedback) {
        htmlContent += `
    <div class="feedback-section">
      <h3>💡 Feedback</h3>
      <p><strong>Ideal Answer:</strong></p>
      <p>${qa.feedback.ideal_answer}</p>
      
      ${qa.feedback.improvement_tips && qa.feedback.improvement_tips.length > 0 ? `
      <p><strong>Improvement Tips:</strong></p>
      <ul>
        ${qa.feedback.improvement_tips.map((tip: string) => `<li>${tip}</li>`).join('\n        ')}
      </ul>` : ''}
    </div>`;
      }
      
      htmlContent += `
  </div>`;
    });

    htmlContent += `
  
  <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #6b7280;">
    <p>Generated on ${new Date().toLocaleString()}</p>
  </div>
</body>
</html>`;

    // Open in new window and trigger print
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Wait for content to load, then print
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const exportJSON = async () => {
    try {
      const response = await fetch(`/api/interview/${interview_id}/export`);
      const data = await response.json();
      
      if (response.ok) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Interview_${interview.role_block.role_name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Failed to export JSON:', err);
    }
  };

  if (!interview) {
    return (
      <div className="flex flex-col h-screen">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading report...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col h-screen">
        <Header />
        <main className="flex-1 overflow-auto">
          <div className="container max-w-5xl mx-auto py-8 px-4">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-3xl">Generate Final Report</CardTitle>
                <CardDescription>
                  You've completed {interview.qa_history.length} questions. 
                  Generate your comprehensive interview report now.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                {error && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={generateReport}
                  disabled={loading}
                  size="lg"
                >
                  {loading ? 'Generating Report...' : 'Generate Report'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <Header />
      
      <main className="flex-1 overflow-auto">
        <div className="container max-w-5xl mx-auto py-8 px-4">
          <div className="space-y-6">
            {/* Header */}
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-4xl">Interview Report</CardTitle>
                <CardDescription className="text-xl">{interview.role_block.role_name}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center items-center gap-8 mb-6">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-primary">{report.overall_performance}/10</div>
                    <div className="text-muted-foreground">Overall Score</div>
                  </div>
                  <Separator orientation="vertical" className="h-16" />
                  <div className="text-center">
                    <div className="text-3xl font-bold">{interview.qa_history.length}</div>
                    <div className="text-muted-foreground">Questions</div>
                  </div>
                </div>
                
                <div className="text-center">
                  <Badge variant={
                    report.overall_performance >= 8 ? 'default' :
                    report.overall_performance >= 6 ? 'secondary' :
                    report.overall_performance >= 4 ? 'outline' :
                    'destructive'
                  } className="text-base px-4 py-2">
                    {report.overall_performance >= 8 ? '✓ Excellent! Ready to go' :
                     report.overall_performance >= 6 ? '↗ Good performance, minor improvements needed' :
                     report.overall_performance >= 4 ? '⚠ Needs more practice' :
                     '✗ Very low performance, significant improvement required'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Time Statistics */}
            {interview.total_time_seconds > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Time Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {formatTime(interview.total_time_seconds)}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Time</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {formatTime(Math.floor(interview.total_time_seconds / interview.qa_history.length))}
                      </div>
                      <div className="text-sm text-muted-foreground">Avg/Question</div>
                    </div>
                    {interview.pause_count > 0 && (
                      <>
                        <div className="text-center p-4 bg-muted rounded-lg">
                          <div className="text-2xl font-bold text-primary flex items-center justify-center gap-1">
                            <Pause className="h-5 w-5" />
                            {interview.pause_count}
                          </div>
                          <div className="text-sm text-muted-foreground">Pauses</div>
                        </div>
                        <div className="text-center p-4 bg-muted rounded-lg">
                          <div className="text-2xl font-bold text-primary">
                            {formatTime(interview.pause_duration_seconds || 0)}
                          </div>
                          <div className="text-sm text-muted-foreground">Pause Time</div>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  {report.summary.split('\n').map((para: string, i: number) => (
                    <p key={i} className="mb-4">{para}</p>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Strengths and Weak Areas */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-700">💪 Strengths</CardTitle>
                </CardHeader>
                <CardContent>
                  {report.strengths && report.strengths.length > 0 ? (
                    <ul className="space-y-3">
                      {report.strengths.map((strength: string, i: number) => (
                        <li key={i} className="flex items-start">
                          <span className="text-green-500 mr-2">✓</span>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground italic">No significant strengths identified</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-orange-700">📈 Areas to Improve</CardTitle>
                </CardHeader>
                <CardContent>
                  {report.weak_areas && report.weak_areas.length > 0 ? (
                    <ul className="space-y-3">
                      {report.weak_areas.map((area: string, i: number) => (
                        <li key={i} className="flex items-start">
                          <span className="text-orange-500 mr-2">→</span>
                          <span>{area}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground italic">No improvement needed - excellent performance!</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Skill Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Skill Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(report.skill_scores).map(([skill, score]: [string, any]) => (
                    <div key={skill}>
                      <div className="flex justify-between mb-2">
                        <span className="font-medium">{skill}</span>
                        <span className="text-primary font-bold">{score}/10</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3">
                        <div
                          className="bg-primary rounded-full h-3 transition-all duration-500"
                          style={{ width: `${(score / 10) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>📝 Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {report.recommendations.map((rec: string, i: number) => (
                    <li key={i} className="flex items-start">
                      <span className="text-blue-500 mr-2 mt-1">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Question History */}
            <Card>
              <CardHeader>
                <CardTitle>Question History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {interview.qa_history.map((qa: any, index: number) => (
                    <div key={index} className="border-l-4 border-primary pl-6 pb-6">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">Q{qa.question_number}</Badge>
                            <Badge>{qa.question.difficulty}</Badge>
                            {qa.time_spent_seconds && (
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTime(qa.time_spent_seconds)}
                              </Badge>
                            )}
                          </div>
                          <div className="font-semibold">{qa.question.question}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            {qa.question.skill}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-2xl font-bold text-primary">{qa.evaluation.overall_score}/10</div>
                        </div>
                      </div>
                      
                      <div className="bg-muted rounded-lg p-4 mb-3">
                        <div className="text-sm font-semibold mb-2">Your Answer:</div>
                        <div className="text-sm">{qa.answer_text}</div>
                      </div>

                      {qa.feedback && (
                        <details className="mt-3">
                          <summary className="cursor-pointer text-sm text-primary hover:underline">
                            View Feedback
                          </summary>
                          <div className="mt-3 space-y-2 text-sm">
                            <div>
                              <span className="font-semibold">Ideal Answer:</span>
                              <p className="mt-1">{qa.feedback.ideal_answer}</p>
                            </div>
                            {qa.feedback.improvement_tips.length > 0 && (
                              <div>
                                <span className="font-semibold">Tips:</span>
                                <ul className="list-disc list-inside mt-1">
                                  {qa.feedback.improvement_tips.map((tip: string, i: number) => (
                                    <li key={i}>{tip}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button
                onClick={downloadPDF}
                variant="default"
                size="lg"
              >
                <Download className="h-5 w-5 mr-2" />
                Download PDF
              </Button>
              <Button
                onClick={downloadReport}
                variant="secondary"
                size="lg"
              >
                <Download className="h-5 w-5 mr-2" />
                Download TXT
              </Button>
              <Button
                onClick={exportJSON}
                variant="secondary"
                size="lg"
              >
                <FileJson className="h-5 w-5 mr-2" />
                Export JSON
              </Button>
              <Button
                onClick={() => router.push('/interview/start')}
                size="lg"
              >
                Start New Interview
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
