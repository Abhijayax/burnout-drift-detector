# 🧠 Early Burnout Detection via Behavioral Drift

![React](https://img.shields.io/badge/React-18.2-blue?logo=react)
![Recharts](https://img.shields.io/badge/Recharts-2.10-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

> Detecting early burnout warning signs through temporal behavioral pattern analysis

## 🎯 Overview

An interactive web application that detects behavioral drift patterns indicating potential burnout risk. Instead of predicting burnout (which requires medical labels), it identifies gradual changes in activity patterns using rolling window statistics.

## ✨ Features

- 📊 **Real-time Drift Analysis** - Rolling 7/14/21 day window statistics
- 📈 **Interactive Visualizations** - Dynamic charts showing behavioral trends
- ⚠️ **Smart Alerts** - Personalized warnings for drift patterns
- 🎯 **Interpretable Metrics** - Every score has clear meaning
- 💡 **Change Point Detection** - Identifies significant pattern shifts

## 🖼️ Screenshots

![Dashboard](public/screenshots/dashboard.png)
*Main dashboard showing 12 weeks of behavioral drift analysis*

![Drift Chart](public/screenshots/drift-chart.png)
*Drift score timeline with risk indicators*

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ installed
- npm or yarn

### Installation
```bash
# Clone repository
git clone https://github.com/abhijayax/burnout-drift-detector.git
cd burnout-drift-detector

# Install dependencies
npm install

# Run development server
npm run dev

# Open browser at http://localhost:5173
```

## 🧠 Methodology

### Core Metrics

| Metric | Formula | Interpretation |
|--------|---------|----------------|
| **Coefficient of Variation** | `(σ / μ) × 100` | Activity consistency |
| **Start Time Drift** | `mean(start_hour)` | Schedule stability |
| **Focus Trend** | `rolling_mean(focus)` | Engagement level |
| **Night Ratio** | `%sessions after 6PM` | Sleep schedule impact |

### Drift Score Calculation
```javascript
score = 0
if (CV > 40%) score += 30        // High variability
if (timing_std > 3h) score += 25  // Inconsistent schedule
if (focus_avg < 3) score += 25    // Low engagement  
if (night_ratio > 40%) score += 20 // Late shifts

Risk: Low (0-39) | Medium (40-59) | High (60-100)
```

## 🛠️ Tech Stack

- **Frontend:** React 18 + Vite
- **Visualization:** Recharts
- **Icons:** Lucide React
- **Styling:** Tailwind CSS utility classes
- **State Management:** React Hooks (useState, useMemo)

## 📊 Key Insights

Based on 12 weeks of simulated behavioral data:
- Week 6-9 showed **47-point drift increase** during stress period
- **8 significant change points** detected
- CV increased from **22% → 51%** during peak drift
- Average start time shifted **4.2 hours later**

## ⚠️ Important Disclaimer

**This is NOT a diagnostic tool.** It detects behavioral signals, not medical conditions. For personal monitoring and self-awareness only. Consult healthcare professionals for medical advice.

## 📚 What I Learned

1. **Simplicity > Complexity** - Basic statistics capture drift effectively
2. **Interpretability Matters** - Users trust what they understand
3. **Feature Engineering** - Started with 12 metrics, kept 4 that matter
4. **React Performance** - useMemo for optimizing heavy calculations
5. **Domain Knowledge** - Understanding burnout psychology shaped design


## 🙏 Acknowledgments

- Inspired by behavioral psychology research on burnout patterns
- Charts powered by [Recharts](https://recharts.org/)
- Icons from [Lucide](https://lucide.dev/)

## 📧 Contact

Abhijaya Singh - abhijayax@gmail.com

Project Link: [https://github.com/abhijayax/burnout-drift-detector](https://github.com/abhijayax/burnout-drift-detector)



---

