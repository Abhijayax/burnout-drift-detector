import React, { useState, useMemo } from 'react';
import { LineChart, Line, ScatterChart, Scatter, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Calendar, TrendingUp, AlertTriangle, Clock, Award, Brain } from 'lucide-react';

// Generate realistic sample data for 8 weeks
const generateSampleData = () => {
  const data = [];
  const subjects = ['Mathematics', 'Physics', 'Programming', 'Chemistry'];
  const timeSlots = ['Morning', 'Afternoon', 'Evening', 'Night'];
  const startDate = new Date('2024-10-01');
  
  for (let i = 0; i < 56; i++) { // 8 weeks
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Realistic patterns
    const baseHours = isWeekend ? 1 + Math.random() * 2 : 2 + Math.random() * 3;
    const timeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];
    const focusBase = timeSlot === 'Evening' ? 4 : 3;
    const focus = Math.max(1, Math.min(5, Math.round(focusBase + (Math.random() - 0.5) * 2)));
    const breaks = Math.floor(baseHours / 1.5) + Math.floor(Math.random() * 2);
    
    data.push({
      date: date.toISOString().split('T')[0],
      dayOfWeek: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayOfWeek],
      week: Math.floor(i / 7) + 1,
      subject: subjects[Math.floor(Math.random() * subjects.length)],
      studyHours: parseFloat(baseHours.toFixed(1)),
      breaks: breaks,
      timeSlot: timeSlot,
      focus: focus,
      quizScore: Math.round(65 + focus * 5 + (Math.random() - 0.5) * 15)
    });
  }
  return data;
};

const StudyHabitAnalyzer = () => {
  const [data] = useState(generateSampleData());
  const [selectedWeek, setSelectedWeek] = useState('all');

  // Filter data by week
  const filteredData = useMemo(() => {
    if (selectedWeek === 'all') return data;
    return data.filter(d => d.week === parseInt(selectedWeek));
  }, [data, selectedWeek]);

  // Calculate consistency score
  const consistencyScore = useMemo(() => {
    const weeklyStats = {};
    data.forEach(d => {
      if (!weeklyStats[d.week]) weeklyStats[d.week] = [];
      weeklyStats[d.week].push(d.studyHours);
    });

    const weeklyScores = Object.entries(weeklyStats).map(([week, hours]) => {
      const avg = hours.reduce((a, b) => a + b, 0) / hours.length;
      const variance = hours.reduce((sum, h) => sum + Math.pow(h - avg, 2), 0) / hours.length;
      const stdDev = Math.sqrt(variance);
      const score = Math.max(0, Math.min(100, 100 - stdDev * 15));
      return { week: `Week ${week}`, score: Math.round(score) };
    });

    return weeklyScores;
  }, [data]);

  // Detect burnout risk
  const burnoutRisk = useMemo(() => {
    let riskDays = 0;
    for (let i = 0; i < data.length - 2; i++) {
      const streak = data.slice(i, i + 3);
      const isBurnout = streak.every(d => d.focus <= 2 && d.studyHours > 4);
      if (isBurnout) riskDays++;
    }
    return riskDays > 0 ? 'High' : riskDays === 0 && data.some(d => d.focus <= 2) ? 'Medium' : 'Low';
  }, [data]);

  // Find optimal time slot
  const optimalTime = useMemo(() => {
    const timeSlotStats = {};
    data.forEach(d => {
      if (!timeSlotStats[d.timeSlot]) {
        timeSlotStats[d.timeSlot] = { focus: [], quiz: [] };
      }
      timeSlotStats[d.timeSlot].focus.push(d.focus);
      timeSlotStats[d.timeSlot].quiz.push(d.quizScore);
    });

    const avgStats = Object.entries(timeSlotStats).map(([slot, stats]) => ({
      slot,
      avgFocus: (stats.focus.reduce((a, b) => a + b, 0) / stats.focus.length).toFixed(1),
      avgQuiz: (stats.quiz.reduce((a, b) => a + b, 0) / stats.quiz.length).toFixed(0)
    }));

    avgStats.sort((a, b) => b.avgFocus - a.avgFocus);
    return avgStats[0];
  }, [data]);

  // Weekly trends
  const weeklyTrends = useMemo(() => {
    const weekly = {};
    data.forEach(d => {
      if (!weekly[d.week]) {
        weekly[d.week] = { hours: [], focus: [], quiz: [] };
      }
      weekly[d.week].hours.push(d.studyHours);
      weekly[d.week].focus.push(d.focus);
      weekly[d.week].quiz.push(d.quizScore);
    });

    return Object.entries(weekly).map(([week, stats]) => ({
      week: `W${week}`,
      avgHours: (stats.hours.reduce((a, b) => a + b, 0) / stats.hours.length).toFixed(1),
      avgFocus: (stats.focus.reduce((a, b) => a + b, 0) / stats.focus.length).toFixed(1),
      avgQuiz: (stats.quiz.reduce((a, b) => a + b, 0) / stats.quiz.length).toFixed(0)
    }));
  }, [data]);

  // Focus vs Hours correlation
  const focusHoursData = useMemo(() => {
    return filteredData.map(d => ({
      hours: d.studyHours,
      focus: d.focus,
      quiz: d.quizScore
    }));
  }, [filteredData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <Brain className="text-indigo-600" size={36} />
                Smart Study Habit Analyzer
              </h1>
              <p className="text-gray-600 mt-2">Understanding your learning patterns • 8 weeks of data</p>
            </div>
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="px-4 py-2 border-2 border-indigo-200 rounded-lg focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Weeks</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map(w => (
                <option key={w} value={w}>Week {w}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="text-green-600" size={24} />
              </div>
              <h3 className="font-semibold text-gray-700">Avg Consistency</h3>
            </div>
            <p className="text-3xl font-bold text-gray-800">
              {Math.round(consistencyScore.reduce((a, b) => a + b.score, 0) / consistencyScore.length)}%
            </p>
            <p className="text-sm text-gray-500 mt-2">Lower std deviation = better consistency</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-3 rounded-lg ${burnoutRisk === 'High' ? 'bg-red-100' : burnoutRisk === 'Medium' ? 'bg-yellow-100' : 'bg-green-100'}`}>
                <AlertTriangle className={burnoutRisk === 'High' ? 'text-red-600' : burnoutRisk === 'Medium' ? 'text-yellow-600' : 'text-green-600'} size={24} />
              </div>
              <h3 className="font-semibold text-gray-700">Burnout Risk</h3>
            </div>
            <p className={`text-3xl font-bold ${burnoutRisk === 'High' ? 'text-red-600' : burnoutRisk === 'Medium' ? 'text-yellow-600' : 'text-green-600'}`}>
              {burnoutRisk}
            </p>
            <p className="text-sm text-gray-500 mt-2">3+ days of high hours + low focus</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Clock className="text-purple-600" size={24} />
              </div>
              <h3 className="font-semibold text-gray-700">Best Time Slot</h3>
            </div>
            <p className="text-3xl font-bold text-gray-800">{optimalTime.slot}</p>
            <p className="text-sm text-gray-500 mt-2">Focus: {optimalTime.avgFocus}/5 • Quiz: {optimalTime.avgQuiz}%</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Weekly Consistency Trend */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-indigo-600" />
              Weekly Consistency Score
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={consistencyScore}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="week" stroke="#666" />
                <YAxis stroke="#666" domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1', r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-sm text-gray-500 mt-3">Higher score = more consistent study pattern</p>
          </div>

          {/* Focus vs Study Hours */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-indigo-600" />
              Focus vs Study Hours
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="hours" name="Hours" stroke="#666" />
                <YAxis dataKey="focus" name="Focus" stroke="#666" domain={[0, 5]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="Study Sessions" data={focusHoursData} fill="#8b5cf6" />
              </ScatterChart>
            </ResponsiveContainer>
            <p className="text-sm text-gray-500 mt-3">Spot the sweet spot: optimal hours for peak focus</p>
          </div>

          {/* Weekly Trends */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Award size={20} className="text-indigo-600" />
              Weekly Performance Trends
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={weeklyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="week" stroke="#666" />
                <YAxis yAxisId="left" stroke="#666" />
                <YAxis yAxisId="right" orientation="right" stroke="#666" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="avgHours" stroke="#3b82f6" strokeWidth={2} name="Avg Hours" />
                <Line yAxisId="left" type="monotone" dataKey="avgFocus" stroke="#8b5cf6" strokeWidth={2} name="Avg Focus" />
                <Line yAxisId="right" type="monotone" dataKey="avgQuiz" stroke="#10b981" strokeWidth={2} name="Avg Quiz %" />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-sm text-gray-500 mt-3">Track how hours, focus, and performance evolve</p>
          </div>

          {/* Time Slot Performance */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Clock size={20} className="text-indigo-600" />
              Performance by Time Slot
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.reduce((acc, d) => {
                const existing = acc.find(a => a.slot === d.timeSlot);
                if (existing) {
                  existing.focus += d.focus;
                  existing.count += 1;
                } else {
                  acc.push({ slot: d.timeSlot, focus: d.focus, count: 1 });
                }
                return acc;
              }, []).map(d => ({ slot: d.slot, avgFocus: (d.focus / d.count).toFixed(1) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="slot" stroke="#666" />
                <YAxis stroke="#666" domain={[0, 5]} />
                <Tooltip />
                <Bar dataKey="avgFocus" name="Avg Focus Rating">
                  {data.reduce((acc, d) => {
                    const existing = acc.find(a => a.slot === d.timeSlot);
                    if (existing) {
                      existing.focus += d.focus;
                      existing.count += 1;
                    } else {
                      acc.push({ slot: d.timeSlot, focus: d.focus, count: 1 });
                    }
                    return acc;
                  }, []).map(d => ({ slot: d.slot, avgFocus: (d.focus / d.count).toFixed(1) })).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'][index % 4]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-sm text-gray-500 mt-3">Identify your peak productivity windows</p>
          </div>
        </div>

        {/* Insights Panel */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Brain size={20} className="text-indigo-600" />
            Key Insights & Recommendations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <h4 className="font-semibold text-blue-800 mb-2">📊 Consistency Pattern</h4>
              <p className="text-sm text-gray-700">
                Your study consistency is {consistencyScore[consistencyScore.length - 1]?.score > 75 ? 'excellent' : consistencyScore[consistencyScore.length - 1]?.score > 50 ? 'good' : 'needs improvement'}. 
                {consistencyScore[consistencyScore.length - 1]?.score < 70 && ' Try maintaining similar daily study hours for better retention.'}
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
              <h4 className="font-semibold text-purple-800 mb-2">⏰ Optimal Study Window</h4>
              <p className="text-sm text-gray-700">
                Your focus peaks during {optimalTime.slot.toLowerCase()} sessions. Schedule challenging subjects during this time for maximum effectiveness.
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
              <h4 className="font-semibold text-green-800 mb-2">💪 Study Endurance</h4>
              <p className="text-sm text-gray-700">
                Your average session length is {(data.reduce((a, b) => a + b.studyHours, 0) / data.length).toFixed(1)} hours. 
                {data.reduce((a, b) => a + b.studyHours, 0) / data.length > 4 ? ' Consider shorter, more frequent sessions to maintain focus.' : ' This is a healthy duration for sustained attention.'}
              </p>
            </div>
            <div className={`p-4 rounded-lg border-l-4 ${burnoutRisk === 'High' ? 'bg-red-50 border-red-500' : 'bg-yellow-50 border-yellow-500'}`}>
              <h4 className={`font-semibold mb-2 ${burnoutRisk === 'High' ? 'text-red-800' : 'text-yellow-800'}`}>⚠️ Burnout Alert</h4>
              <p className="text-sm text-gray-700">
                {burnoutRisk === 'High' ? 'High risk detected! Take more breaks and reduce marathon study sessions.' : burnoutRisk === 'Medium' ? 'Watch for signs of fatigue. Prioritize quality over quantity.' : 'Low risk - you\'re managing your study load well!'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>📚 Built with React & Recharts • Track your habits, improve your learning</p>
          <p className="mt-1">Data collected over 8 weeks • {data.length} study sessions analyzed</p>
        </div>
      </div>
    </div>
  );
};

export default StudyHabitAnalyzer;