import React, { useState, useEffect } from 'react';
import './Revenue.css';

function Revenue({ account }) {
  const [revenue, setRevenue] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [stakes, setStakes] = useState([]);
  const [tiers, setTiers] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedTier, setSelectedTier] = useState('pro');
  const [stakeAmount, setStakeAmount] = useState('');
  const [lockPeriod, setLockPeriod] = useState('flexible');

  useEffect(() => {
    loadData();
  }, [account]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load revenue summary
      const revenueRes = await fetch('http://localhost:3001/api/monetization/revenue');
      const revenueData = await revenueRes.json();
      if (revenueData.success) {
        setRevenue(revenueData.revenue);
      }

      // Load subscription tiers
      const tiersRes = await fetch('http://localhost:3001/api/monetization/tiers');
      const tiersData = await tiersRes.json();
      if (tiersData.success) {
        setTiers(tiersData.tiers);
      }

      // Load user subscription if account connected
      if (account) {
        const subRes = await fetch(`http://localhost:3001/api/monetization/subscription/${account}`);
        const subData = await subRes.json();
        if (subData.success) {
          setSubscription(subData.subscription);
        }

        // Load user stakes
        const stakesRes = await fetch(`http://localhost:3001/api/monetization/stakes/${account}`);
        const stakesData = await stakesRes.json();
        if (stakesData.success) {
          setStakes(stakesData.stakes);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  };

  const handleSubscribe = async () => {
    if (!account) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/monetization/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: account,
          tier: selectedTier,
          duration: 30
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(`Successfully subscribed to ${selectedTier} tier!`);
        loadData();
      } else {
        alert('Subscription failed: ' + data.error);
      }
    } catch (error) {
      console.error('Error subscribing:', error);
      alert('Subscription failed: ' + error.message);
    }
  };

  const handleStake = async () => {
    if (!account) {
      alert('Please connect your wallet first');
      return;
    }

    if (!stakeAmount || parseFloat(stakeAmount) < 0.1) {
      alert('Minimum stake amount is 0.1 ETH');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/monetization/stake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: account,
          amount: parseFloat(stakeAmount),
          lockPeriod: lockPeriod
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(`Successfully staked ${stakeAmount} ETH!`);
        setStakeAmount('');
        loadData();
      } else {
        alert('Staking failed: ' + data.error);
      }
    } catch (error) {
      console.error('Error staking:', error);
      alert('Staking failed: ' + error.message);
    }
  };

  const handleClaimRewards = async (stakeId) => {
    try {
      const response = await fetch('http://localhost:3001/api/monetization/claim-rewards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stakeId: stakeId,
          userAddress: account
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(`Successfully claimed ${data.claim.amount.toFixed(6)} ETH in rewards!`);
        loadData();
      } else {
        alert('Claim failed: ' + data.error);
      }
    } catch (error) {
      console.error('Error claiming rewards:', error);
      alert('Claim failed: ' + error.message);
    }
  };

  const handleUnstake = async (stakeId) => {
    try {
      const response = await fetch('http://localhost:3001/api/monetization/unstake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stakeId: stakeId,
          userAddress: account
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(`Successfully unstaked! Total: ${data.result.total.toFixed(6)} ETH`);
        loadData();
      } else {
        alert('Unstake failed: ' + data.error);
      }
    } catch (error) {
      console.error('Error unstaking:', error);
      alert('Unstake failed: ' + error.message);
    }
  };

  if (loading && !revenue) {
    return <div className="revenue-container"><p>Loading...</p></div>;
  }

  return (
    <div className="revenue-container">
      <h1>💰 Revenue & Monetization</h1>

      {/* Platform Revenue Stats */}
      <div className="revenue-section">
        <h2>Platform Revenue</h2>
        <div className="revenue-stats">
          <div className="stat-card">
            <div className="stat-value">{revenue?.totalRevenue?.toFixed(4) || '0.0000'} ETH</div>
            <div className="stat-label">Total Revenue</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{revenue?.platformFees?.toFixed(4) || '0.0000'} ETH</div>
            <div className="stat-label">Platform Fees (2.5%)</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{revenue?.subscriptionRevenue?.toFixed(4) || '0.0000'} ETH</div>
            <div className="stat-label">Subscription Revenue</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{revenue?.monthlyRecurringRevenue?.toFixed(4) || '0.0000'} ETH</div>
            <div className="stat-label">Monthly Recurring Revenue</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{revenue?.totalValueLocked?.toFixed(4) || '0.0000'} ETH</div>
            <div className="stat-label">Total Value Locked</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{revenue?.activeSubscriptions || 0}</div>
            <div className="stat-label">Active Subscriptions</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{revenue?.totalStakers || 0}</div>
            <div className="stat-label">Total Stakers</div>
          </div>
        </div>
      </div>

      {/* Subscription Tiers */}
      <div className="revenue-section">
        <h2>Subscription Plans</h2>
        {subscription && (
          <div className="current-subscription">
            <strong>Your Current Plan:</strong> {subscription.tier.toUpperCase()}
            {subscription.tier !== 'free' && (
              <span> (Expires: {new Date(subscription.endDate).toLocaleDateString()})</span>
            )}
          </div>
        )}
        <div className="tiers-grid">
          {tiers && Object.entries(tiers).map(([name, tier]) => (
            <div key={name} className={`tier-card ${name === subscription?.tier ? 'active' : ''}`}>
              <h3>{name.toUpperCase()}</h3>
              <div className="tier-price">{tier.price} ETH/month</div>
              <ul className="tier-features">
                <li>API Calls: {tier.apiCallsPerMonth === -1 ? 'Unlimited' : tier.apiCallsPerMonth.toLocaleString()}/month</li>
                <li>Max Model Size: {tier.maxModelSize === -1 ? 'Unlimited' : `${(tier.maxModelSize / 1000000000).toFixed(1)}GB`}</li>
                <li>Listings: {tier.modelListingLimit === -1 ? 'Unlimited' : tier.modelListingLimit}</li>
                <li>Features:</li>
                {tier.features.map((feature, idx) => (
                  <li key={idx} className="feature-item">✓ {feature.replace(/_/g, ' ')}</li>
                ))}
              </ul>
              {account && name !== 'free' && (
                <button
                  className="subscribe-btn"
                  onClick={() => {
                    setSelectedTier(name);
                    handleSubscribe();
                  }}
                  disabled={name === subscription?.tier}
                >
                  {name === subscription?.tier ? 'Current Plan' : 'Subscribe'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Staking Section */}
      <div className="revenue-section">
        <h2>Staking (12% APY)</h2>
        <div className="staking-form">
          <div className="form-group">
            <label>Amount (ETH)</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              placeholder="Min 0.1 ETH"
            />
          </div>
          <div className="form-group">
            <label>Lock Period</label>
            <select value={lockPeriod} onChange={(e) => setLockPeriod(e.target.value)}>
              <option value="flexible">Flexible (1.0x rewards)</option>
              <option value="30days">30 Days (1.2x rewards)</option>
              <option value="90days">90 Days (1.5x rewards)</option>
              <option value="180days">180 Days (2.0x rewards)</option>
            </select>
          </div>
          <button onClick={handleStake} disabled={!account} className="stake-btn">
            Stake Tokens
          </button>
        </div>

        {/* User Stakes */}
        {stakes.length > 0 && (
          <div className="stakes-list">
            <h3>Your Stakes</h3>
            {stakes.map(stake => (
              <div key={stake.id} className="stake-item">
                <div className="stake-info">
                  <div>
                    <strong>{stake.amount} ETH</strong> - {stake.lockPeriod}
                    ({stake.rewardMultiplier}x multiplier)
                  </div>
                  <div className="stake-rewards">
                    Unclaimed Rewards: <strong>{stake.rewards?.unclaimedRewards?.toFixed(6) || 0} ETH</strong>
                  </div>
                  <div className="stake-dates">
                    Staked: {Math.floor(stake.rewards?.daysStaked || 0)} days ago
                    {!stake.rewards?.canUnstake && (
                      <span> | Unlocks: {new Date(stake.unlockDate).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <div className="stake-actions">
                  {stake.rewards?.unclaimedRewards > 0 && (
                    <button onClick={() => handleClaimRewards(stake.id)} className="claim-btn">
                      Claim Rewards
                    </button>
                  )}
                  {stake.isActive && stake.rewards?.canUnstake && (
                    <button onClick={() => handleUnstake(stake.id)} className="unstake-btn">
                      Unstake
                    </button>
                  )}
                  {!stake.isActive && <span className="unstaked-badge">Unstaked</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Revenue Breakdown */}
      <div className="revenue-section">
        <h2>Revenue Breakdown</h2>
        <div className="revenue-chart">
          <div className="chart-bar" style={{width: `${(revenue?.platformFees / revenue?.totalRevenue * 100) || 0}%`, backgroundColor: '#3b82f6'}}>
            <span>Platform Fees</span>
          </div>
          <div className="chart-bar" style={{width: `${(revenue?.subscriptionRevenue / revenue?.totalRevenue * 100) || 0}%`, backgroundColor: '#10b981'}}>
            <span>Subscriptions</span>
          </div>
          <div className="chart-bar" style={{width: `${(revenue?.apiRevenue / revenue?.totalRevenue * 100) || 0}%`, backgroundColor: '#f59e0b'}}>
            <span>API Usage</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Revenue;
