import React, { useState, useMemo } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, AlertCircle, Clock, Activity, Brain, Target } from 'lucide-react';

// Generate realistic behavioral data with drift patterns
const generateBehavioralData = () => {
  const data = [];
  const startDate = new Date('2024-09-01');
  
  for (let i = 0; i < 84; i++) { // 12 weeks
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const week = Math.floor(i / 7) + 1;
    
    // Simulate gradual drift after week 6
    const isDrifting = i >= 42;
    const driftFactor = isDrifting ? (i - 42) / 42 : 0;
    
    // Base patterns
    let baseHours = 4 + Math.random() * 2;
    let sessionCount = 2 + Math.floor(Math.random() * 2);
    let startHour = 9 + Math.random() * 2; // 9-11 AM normally
    let focusScore = 4 + Math.random();
    
    // Apply drift effects
    if (isDrifting) {
      // Hours become more variable
      baseHours = baseHours * (1 - driftFactor * 0.3) + (Math.random() - 0.5) * driftFactor * 4;
      
      // Start time shifts later
      startHour = startHour + driftFactor * 6; // Shifts toward evening/night
      
      // Focus decreases
      focusScore = focusScore * (1 - driftFactor * 0.4);
      
      // More fragmented sessions
      sessionCount = sessionCount + Math.floor(driftFactor * 3);
    }
    
    // Add weekend variation
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    if (isWeekend) {
      baseHours *= 0.6;
      sessionCount = Math.max(1, sessionCount - 1);
    }
    
    const sessionLength = baseHours / sessionCount;
    const endHour = startHour + baseHours;
    
    data.push({
      date: date.toISOString().split('T')[0],
      day: i + 1,
      week: week,
      activityHours: parseFloat(baseHours.toFixed(1)),
      sessionCount: sessionCount,
      sessionLength: parseFloat(sessionLength.toFixed(1)),
      startHour: parseFloat(startHour.toFixed(1)),
      endHour: parseFloat(endHour.toFixed(1)),
      focusScore: Math.max(1, Math.min(5, parseFloat(focusScore.toFixed(1)))),
      isWeekend: isWeekend
    });
  }
  
  return data;
};

const BurnoutDriftDetector = () => {
  const [data] = useState(generateBehavioralData());
  const [windowSize, setWindowSize] = useState(7);

  // Calculate rolling statistics
  const driftMetrics = useMemo(() => {
    const metrics = [];
    
    for (let i = windowSize - 1; i < data.length; i++) {
      const window = data.slice(i - windowSize + 1, i + 1);
      
      // Calculate statistics
      const hours = window.map(d => d.activityHours);
      const starts = window.map(d => d.startHour);
      const focus = window.map(d => d.focusScore);
      const sessions = window.map(d => d.sessionLength);
      
      const mean = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
      const variance = arr => {
        const avg = mean(arr);
        return arr.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / arr.length;
      };
      const stdDev = arr => Math.sqrt(variance(arr));
      
      const hoursMean = mean(hours);
      const hoursStd = stdDev(hours);
      const startsMean = mean(starts);
      const startsStd = stdDev(starts);
      const focusMean = mean(focus);
      const sessionMean = mean(sessions);
      
      // Coefficient of variation (consistency measure)
      const cv = (hoursStd / hoursMean) * 100;
      
      // Night shift indicator (activity starting after 6 PM)
      const nightRatio = window.filter(d => d.startHour >= 18).length / window.length * 100;
      
      // Drift score calculation (simple heuristic)
      let driftScore = 0;
      if (cv > 40) driftScore += 30; // High variability
      if (startsStd > 3) driftScore += 25; // Inconsistent timing
      if (focusMean < 3) driftScore += 25; // Low focus
      if (nightRatio > 40) driftScore += 20; // Late shifts
      
      // Risk level
      let riskLevel = 'Low';
      let riskColor = '#10b981';
      if (driftScore >= 60) {
        riskLevel = 'High';
        riskColor = '#ef4444';
      } else if (driftScore >= 40) {
        riskLevel = 'Medium';
        riskColor = '#f59e0b';
      }
      
      metrics.push({
        date: data[i].date,
        day: data[i].day,
        week: data[i].week,
        hoursMean: parseFloat(hoursMean.toFixed(2)),
        hoursStd: parseFloat(hoursStd.toFixed(2)),
        cv: parseFloat(cv.toFixed(1)),
        startsMean: parseFloat(startsMean.toFixed(1)),
        startsStd: parseFloat(startsStd.toFixed(2)),
        focusMean: parseFloat(focusMean.toFixed(2)),
        sessionMean: parseFloat(sessionMean.toFixed(2)),
        nightRatio: parseFloat(nightRatio.toFixed(1)),
        driftScore: Math.round(driftScore),
        riskLevel: riskLevel,
        riskColor: riskColor
      });
    }
    
    return metrics;
  }, [data, windowSize]);

  // Detect change points (simple threshold-based)
  const changePoints = useMemo(() => {
    const points = [];
    for (let i = 1; i < driftMetrics.length; i++) {
      const prev = driftMetrics[i - 1];
      const curr = driftMetrics[i];
      
      // Significant change in drift score
      if (Math.abs(curr.driftScore - prev.driftScore) > 20) {
        points.push({
          day: curr.day,
          week: curr.week,
          date: curr.date,
          change: curr.driftScore - prev.driftScore,
          type: curr.driftScore > prev.driftScore ? 'increase' : 'decrease'
        });
      }
    }
    return points;
  }, [driftMetrics]);

  // Weekly aggregations
  const weeklyTrends = useMemo(() => {
    const weekly = {};
    data.forEach(d => {
      if (!weekly[d.week]) {
        weekly[d.week] = { hours: [], focus: [], sessions: [], starts: [] };
      }
      weekly[d.week].hours.push(d.activityHours);
      weekly[d.week].focus.push(d.focusScore);
      weekly[d.week].sessions.push(d.sessionLength);
      weekly[d.week].starts.push(d.startHour);
    });

    return Object.entries(weekly).map(([week, stats]) => {
      const mean = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
      const stdDev = arr => {
        const avg = mean(arr);
        return Math.sqrt(arr.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / arr.length);
      };

      return {
        week: `W${week}`,
        avgHours: parseFloat(mean(stats.hours).toFixed(1)),
        hoursVariability: parseFloat(stdDev(stats.hours).toFixed(2)),
        avgFocus: parseFloat(mean(stats.focus).toFixed(2)),
        avgStart: parseFloat(mean(stats.starts).toFixed(1)),
        startVariability: parseFloat(stdDev(stats.starts).toFixed(2))
      };
    });
  }, [data]);

  // Current status
  const currentStatus = useMemo(() => {
    if (driftMetrics.length === 0) return null;
    const latest = driftMetrics[driftMetrics.length - 1];
    const weekAgo = driftMetrics[Math.max(0, driftMetrics.length - 8)];
    
    return {
      current: latest,
      trend: latest.driftScore - weekAgo.driftScore,
      alerts: [
        latest.cv > 40 && "High activity variability detected",
        latest.startsStd > 3 && "Inconsistent start times",
        latest.focusMean < 3 && "Declining focus scores",
        latest.nightRatio > 40 && "Increased late-night activity"
      ].filter(Boolean)
    };
  }, [driftMetrics]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                <Brain className="text-blue-600" size={36} />
                Early Burnout Detection via Behavioral Drift
              </h1>
              <p className="text-gray-600 mt-2">Detecting early warning signs through temporal pattern analysis • 12 weeks tracked</p>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Rolling Window:</label>
              <select
                value={windowSize}
                onChange={(e) => setWindowSize(Number(e.target.value))}
                className="px-4 py-2 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value={7}>7 days</option>
                <option value={14}>14 days</option>
                <option value={21}>21 days</option>
              </select>
            </div>
          </div>
        </div>

        {/* Current Status Cards */}
        {currentStatus && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-3 rounded-lg`} style={{ backgroundColor: `${currentStatus.current.riskColor}20` }}>
                  <AlertCircle style={{ color: currentStatus.current.riskColor }} size={24} />
                </div>
                <h3 className="font-semibold text-gray-700">Risk Level</h3>
              </div>
              <p className="text-3xl font-bold" style={{ color: currentStatus.current.riskColor }}>
                {currentStatus.current.riskLevel}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Drift Score: {currentStatus.current.driftScore}/100
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Activity className="text-purple-600" size={24} />
                </div>
                <h3 className="font-semibold text-gray-700">Consistency</h3>
              </div>
              <p className="text-3xl font-bold text-gray-800">
                {currentStatus.current.cv.toFixed(1)}%
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Coefficient of Variation {currentStatus.current.cv > 40 ? '(High)' : '(Normal)'}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Clock className="text-orange-600" size={24} />
                </div>
                <h3 className="font-semibold text-gray-700">Time Shift</h3>
              </div>
              <p className="text-3xl font-bold text-gray-800">
                {currentStatus.current.startsMean.toFixed(1)}h
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Avg start time (±{currentStatus.current.startsStd.toFixed(1)}h)
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Target className="text-green-600" size={24} />
                </div>
                <h3 className="font-semibold text-gray-700">Focus Level</h3>
              </div>
              <p className="text-3xl font-bold text-gray-800">
                {currentStatus.current.focusMean.toFixed(1)}/5
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {windowSize}-day average
              </p>
            </div>
          </div>
        )}

        {/* Main Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Drift Score Timeline */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-blue-600" />
              Behavioral Drift Score Over Time
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={driftMetrics}>
                <defs>
                  <linearGradient id="driftGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="week" stroke="#666" label={{ value: 'Week', position: 'insideBottom', offset: -5 }} />
                <YAxis stroke="#666" domain={[0, 100]} label={{ value: 'Drift Score', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Area type="monotone" dataKey="driftScore" stroke="#3b82f6" strokeWidth={2} fill="url(#driftGradient)" />
              </AreaChart>
            </ResponsiveContainer>
            <p className="text-sm text-gray-500 mt-3">Higher score indicates greater behavioral drift from baseline patterns</p>
          </div>

          {/* Activity Hours Variability */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Activity size={20} className="text-blue-600" />
              Activity Hours: Mean vs Variability
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={driftMetrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="week" stroke="#666" />
                <YAxis yAxisId="left" stroke="#666" label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" stroke="#666" label={{ value: 'Std Dev', angle: 90, position: 'insideRight' }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="hoursMean" stroke="#10b981" strokeWidth={2} name="Mean Hours" dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="hoursStd" stroke="#ef4444" strokeWidth={2} name="Std Dev" dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-sm text-gray-500 mt-3">Increasing std deviation indicates inconsistent activity patterns</p>
          </div>

          {/* Start Time Drift */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Clock size={20} className="text-blue-600" />
              Start Time Drift Analysis
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={driftMetrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="week" stroke="#666" />
                <YAxis stroke="#666" domain={[8, 20]} label={{ value: 'Hour of Day', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="startsMean" stroke="#f59e0b" strokeWidth={2} name="Avg Start Time" />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-sm text-gray-500 mt-3">Gradual shift toward later hours may indicate schedule disruption</p>
          </div>

          {/* Weekly Comparison */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Target size={20} className="text-blue-600" />
              Weekly Focus & Variability Trends
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={weeklyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="week" stroke="#666" />
                <YAxis yAxisId="left" stroke="#666" domain={[0, 5]} />
                <YAxis yAxisId="right" orientation="right" stroke="#666" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="avgFocus" stroke="#8b5cf6" strokeWidth={2} name="Avg Focus" />
                <Line yAxisId="right" type="monotone" dataKey="hoursVariability" stroke="#ef4444" strokeWidth={2} name="Hours Variability" />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-sm text-gray-500 mt-3">Declining focus coupled with rising variability signals risk</p>
          </div>
        </div>

        {/* Alerts & Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Alerts */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <AlertCircle size={20} className="text-blue-600" />
              Active Behavioral Signals
            </h3>
            {currentStatus && currentStatus.alerts.length > 0 ? (
              <div className="space-y-3">
                {currentStatus.alerts.map((alert, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                    <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
                    <p className="text-sm text-gray-700">{alert}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-green-50 border-l-4 border-green-400 rounded">
                <p className="text-sm text-gray-700">✓ No significant drift signals detected. Patterns appear stable.</p>
              </div>
            )}
            
            {currentStatus && currentStatus.trend > 10 && (
              <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-400 rounded">
                <p className="text-sm font-semibold text-red-800">⚠️ Drift Accelerating</p>
                <p className="text-sm text-gray-700 mt-1">
                  Drift score increased by {currentStatus.trend.toFixed(0)} points over the past week. Consider reviewing workload and rest patterns.
                </p>
              </div>
            )}
          </div>

          {/* Change Points */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-blue-600" />
              Detected Change Points
            </h3>
            {changePoints.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {changePoints.slice(-5).reverse().map((point, idx) => (
                  <div key={idx} className={`p-3 rounded border-l-4 ${point.type === 'increase' ? 'bg-red-50 border-red-400' : 'bg-green-50 border-green-400'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-800">Week {point.week}, Day {point.day}</span>
                      <span className={`text-sm font-bold ${point.type === 'increase' ? 'text-red-600' : 'text-green-600'}`}>
                        {point.change > 0 ? '+' : ''}{point.change.toFixed(0)} pts
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {point.type === 'increase' ? 'Significant drift increase detected' : 'Behavioral patterns stabilizing'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No significant change points detected yet.</p>
            )}
          </div>
        </div>

        {/* Methodology Note */}
        <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6">
          <h4 className="font-semibold text-blue-900 mb-2">📊 Methodology</h4>
          <p className="text-sm text-gray-700 leading-relaxed">
            This system uses <strong>rolling window statistics</strong> (mean, standard deviation, coefficient of variation) to detect gradual behavioral drift—early warning signs that may precede burnout. 
            Instead of predicting burnout directly, it identifies <strong>temporal patterns</strong> like increased variability, schedule shifts, and declining engagement. 
            The drift score is a weighted heuristic combining: activity consistency (CV), timing shifts, focus trends, and late-night patterns. 
            All metrics use basic statistics—no complex ML required—making the system <strong>interpretable and explainable</strong>.
          </p>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>🧠 Early Detection System • Rolling Window Analysis • {data.length} days tracked</p>
          <p className="mt-1">Focus on early signals, not diagnosis • Built for self-awareness and proactive intervention</p>
        </div>
      </div>
    </div>
  );
};

export default BurnoutDriftDetector;
