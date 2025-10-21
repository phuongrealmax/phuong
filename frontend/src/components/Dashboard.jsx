import React, { useState, useEffect } from 'react';
import './Dashboard.css';

function Dashboard({ account, provider }) {
  const [stats, setStats] = useState({
    totalModels: 0,
    userModels: 0,
    totalPurchases: 0,
    totalEarnings: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (account) {
      loadDashboardData();
    }
  }, [account]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load user stats
      const statsResponse = await fetch(`http://localhost:3001/api/users/${account}/stats`);
      const statsData = await statsResponse.json();

      if (statsData.success) {
        setStats(statsData.stats || stats);
      }

      // Load recent activity
      const activityResponse = await fetch(`http://localhost:3001/api/users/${account}/activity`);
      const activityData = await activityResponse.json();

      if (activityData.success) {
        setRecentActivity(activityData.activity || []);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
    setLoading(false);
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Dashboard</h2>
        <p>Welcome back, {account ? `${account.substring(0, 6)}...${account.substring(38)}` : 'User'}</p>
      </div>

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">🤖</div>
              <div className="stat-content">
                <h3>{stats.totalModels}</h3>
                <p>Total Models</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <h3>{stats.userModels}</h3>
                <p>Your Models</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🛒</div>
              <div className="stat-content">
                <h3>{stats.totalPurchases}</h3>
                <p>Total Purchases</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <h3>{stats.totalEarnings.toFixed(4)} ETH</h3>
                <p>Total Earnings</p>
              </div>
            </div>
          </div>

          <div className="dashboard-sections">
            <div className="section activity-section">
              <h3>Recent Activity</h3>
              <div className="activity-list">
                {recentActivity.length === 0 ? (
                  <div className="no-activity">
                    <p>No recent activity</p>
                    <p className="hint">Start by registering or purchasing a model</p>
                  </div>
                ) : (
                  recentActivity.map((activity, index) => (
                    <div key={index} className="activity-item">
                      <div className="activity-icon">
                        {activity.type === 'register' && '✨'}
                        {activity.type === 'purchase' && '🛒'}
                        {activity.type === 'sale' && '💰'}
                      </div>
                      <div className="activity-details">
                        <p className="activity-description">{activity.description}</p>
                        <p className="activity-time">{activity.timestamp}</p>
                      </div>
                      <div className="activity-amount">
                        {activity.amount && `${activity.amount} ETH`}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="section quick-actions">
              <h3>Quick Actions</h3>
              <div className="actions-grid">
                <button className="action-button">
                  <span className="action-icon">➕</span>
                  <span>Register New Model</span>
                </button>
                <button className="action-button">
                  <span className="action-icon">🔍</span>
                  <span>Browse Marketplace</span>
                </button>
                <button className="action-button">
                  <span className="action-icon">📈</span>
                  <span>View Analytics</span>
                </button>
                <button className="action-button">
                  <span className="action-icon">⚙️</span>
                  <span>Settings</span>
                </button>
              </div>
            </div>
          </div>

          <div className="section performance-section">
            <h3>Model Performance Overview</h3>
            <div className="performance-chart">
              <div className="chart-placeholder">
                <p>📊 Performance charts coming soon</p>
                <p className="hint">Track your model's usage and earnings over time</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;
