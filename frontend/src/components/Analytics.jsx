import React, { useState, useEffect } from 'react';
import './Analytics.css';

function Analytics({ account, provider }) {
  const [overview, setOverview] = useState(null);
  const [topCreators, setTopCreators] = useState([]);
  const [timeSeriesData, setTimeSeriesData] = useState({});
  const [selectedMetric, setSelectedMetric] = useState('registrations');
  const [timeRange, setTimeRange] = useState('24h');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, []);

  useEffect(() => {
    if (selectedMetric && timeRange) {
      loadTimeSeries(selectedMetric, timeRange);
    }
  }, [selectedMetric, timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Load overview
      const overviewRes = await fetch('http://localhost:3001/api/analytics/overview');
      const overviewData = await overviewRes.json();
      if (overviewData.success) {
        setOverview(overviewData.analytics);
      }

      // Load top creators
      const creatorsRes = await fetch('http://localhost:3001/api/analytics/top-creators?limit=5');
      const creatorsData = await creatorsRes.json();
      if (creatorsData.success) {
        setTopCreators(creatorsData.creators);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
    setLoading(false);
  };

  const loadTimeSeries = async (metric, range) => {
    try {
      const res = await fetch(`http://localhost:3001/api/analytics/timeseries/${metric}?range=${range}`);
      const data = await res.json();
      if (data.success) {
        setTimeSeriesData(prev => ({
          ...prev,
          [metric]: data.data
        }));
      }
    } catch (error) {
      console.error('Error loading time series:', error);
    }
  };

  const formatAddress = (address) => {
    return `${address.substring(0, 6)}...${address.substring(38)}`;
  };

  const calculateTrend = (data) => {
    if (!data || data.length < 2) return 0;

    const recent = data.slice(-10);
    const older = data.slice(-20, -10);

    if (older.length === 0) return 0;

    const recentAvg = recent.length / 10;
    const olderAvg = older.length / 10;

    if (olderAvg === 0) return 100;

    return ((recentAvg - olderAvg) / olderAvg * 100).toFixed(1);
  };

  if (loading && !overview) {
    return (
      <div className="analytics-loading">
        <div className="spinner"></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <h2>Platform Analytics</h2>
        <p>Real-time insights into the MonaAI ecosystem</p>
        <button onClick={loadAnalytics} className="refresh-btn">
          Refresh Data
        </button>
      </div>

      {overview && (
        <>
          {/* Overview Cards */}
          <div className="analytics-overview">
            <div className="analytics-card">
              <div className="card-icon">🤖</div>
              <div className="card-content">
                <h3>Total Models</h3>
                <p className="card-value">{overview.models.total}</p>
                <p className="card-subtitle">Registered on platform</p>
              </div>
            </div>

            <div className="analytics-card">
              <div className="card-icon">💰</div>
              <div className="card-content">
                <h3>Total Sales</h3>
                <p className="card-value">{overview.marketplace.totalSales}</p>
                <p className="card-subtitle">
                  {overview.marketplace.totalVolume} ETH volume
                </p>
              </div>
            </div>

            <div className="analytics-card">
              <div className="card-icon">👥</div>
              <div className="card-content">
                <h3>Active Users</h3>
                <p className="card-value">{overview.users.activeUsers}</p>
                <p className="card-subtitle">
                  {overview.users.totalUsers} total users
                </p>
              </div>
            </div>

            <div className="analytics-card">
              <div className="card-icon">⚡</div>
              <div className="card-content">
                <h3>Inference Requests</h3>
                <p className="card-value">{overview.inference.totalRequests}</p>
                <p className="card-subtitle">
                  {overview.inference.averageLatency}ms avg latency
                </p>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="analytics-charts">
            <div className="chart-container">
              <div className="chart-header">
                <h3>Trends Over Time</h3>
                <div className="chart-controls">
                  <select
                    value={selectedMetric}
                    onChange={(e) => setSelectedMetric(e.target.value)}
                  >
                    <option value="registrations">Model Registrations</option>
                    <option value="sales">Marketplace Sales</option>
                    <option value="inference">Inference Requests</option>
                  </select>
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                  >
                    <option value="1h">Last Hour</option>
                    <option value="24h">Last 24 Hours</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                  </select>
                </div>
              </div>
              <div className="chart-content">
                {timeSeriesData[selectedMetric] && timeSeriesData[selectedMetric].length > 0 ? (
                  <div className="simple-chart">
                    <p className="chart-stat">
                      {timeSeriesData[selectedMetric].length} events in {timeRange}
                    </p>
                    <div className="chart-trend">
                      {calculateTrend(timeSeriesData[selectedMetric]) > 0 ? '📈' : '📉'}
                      <span className={calculateTrend(timeSeriesData[selectedMetric]) > 0 ? 'trend-up' : 'trend-down'}>
                        {Math.abs(calculateTrend(timeSeriesData[selectedMetric]))}% trend
                      </span>
                    </div>
                    <div className="chart-placeholder">
                      <p>📊 Interactive chart visualization coming soon</p>
                      <p className="hint">Integrate Chart.js or Recharts for detailed graphs</p>
                    </div>
                  </div>
                ) : (
                  <div className="no-data">
                    <p>No data available for this metric</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="analytics-grid">
            {/* Categories Breakdown */}
            <div className="analytics-panel">
              <h3>Models by Category</h3>
              <div className="category-list">
                {Object.keys(overview.models.byCategory).length > 0 ? (
                  Object.entries(overview.models.byCategory).map(([category, count]) => (
                    <div key={category} className="category-item">
                      <div className="category-info">
                        <span className="category-name">{category}</span>
                        <span className="category-count">{count} models</span>
                      </div>
                      <div className="category-bar">
                        <div
                          className="category-bar-fill"
                          style={{
                            width: `${(count / overview.models.total) * 100}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-data">No categories yet</p>
                )}
              </div>
            </div>

            {/* Top Creators */}
            <div className="analytics-panel">
              <h3>Top Creators</h3>
              <div className="creators-list">
                {topCreators.length > 0 ? (
                  topCreators.map((creator, index) => (
                    <div key={creator.address} className="creator-item">
                      <div className="creator-rank">#{index + 1}</div>
                      <div className="creator-info">
                        <span className="creator-address">
                          {formatAddress(creator.address)}
                        </span>
                        <span className="creator-count">
                          {creator.count} models
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="no-data">No creators yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Marketplace Stats */}
          <div className="marketplace-stats">
            <h3>Marketplace Statistics</h3>
            <div className="stats-grid">
              <div className="stat-box">
                <p className="stat-label">Average Sale Price</p>
                <p className="stat-value">{overview.marketplace.averageSalePrice} ETH</p>
              </div>
              <div className="stat-box">
                <p className="stat-label">Total Volume</p>
                <p className="stat-value">{overview.marketplace.totalVolume} ETH</p>
              </div>
              <div className="stat-box">
                <p className="stat-label">Total Listings</p>
                <p className="stat-value">{overview.marketplace.totalListings}</p>
              </div>
              <div className="stat-box">
                <p className="stat-label">Success Rate</p>
                <p className="stat-value">
                  {overview.marketplace.totalListings > 0
                    ? ((overview.marketplace.totalSales / overview.marketplace.totalListings) * 100).toFixed(1)
                    : 0}%
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Analytics;
