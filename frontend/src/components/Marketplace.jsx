import React, { useState, useEffect } from 'react';
import './Marketplace.css';

function Marketplace({ provider, account }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (account) {
      loadListings();
    }
  }, [account]);

  const loadListings = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/marketplace/listings');
      const data = await response.json();

      if (data.success) {
        setListings(data.listings || []);
      }
    } catch (error) {
      console.error('Error loading listings:', error);
    }
    setLoading(false);
  };

  const purchaseModel = async (listingId, price) => {
    try {
      if (!provider || !account) {
        alert('Please connect your wallet first');
        return;
      }

      // This would interact with the smart contract
      console.log('Purchasing model:', { listingId, price });
      alert('Purchase feature coming soon!');

      // Reload listings after purchase
      loadListings();
    } catch (error) {
      console.error('Error purchasing model:', error);
      alert('Purchase failed: ' + error.message);
    }
  };

  const filteredListings = listings.filter(listing => {
    if (filter === 'all') return true;
    if (filter === 'cheap') return parseFloat(listing.price) < 1.0;
    if (filter === 'expensive') return parseFloat(listing.price) >= 1.0;
    return true;
  });

  return (
    <div className="marketplace">
      <div className="marketplace-header">
        <h2>AI Model Marketplace</h2>
        <p>Buy and sell AI models on the blockchain</p>
      </div>

      <div className="marketplace-filters">
        <button
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All Models
        </button>
        <button
          className={filter === 'cheap' ? 'active' : ''}
          onClick={() => setFilter('cheap')}
        >
          Under 1 ETH
        </button>
        <button
          className={filter === 'expensive' ? 'active' : ''}
          onClick={() => setFilter('expensive')}
        >
          1+ ETH
        </button>
        <button onClick={loadListings} disabled={loading}>
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      <div className="listings-grid">
        {filteredListings.length === 0 ? (
          <div className="no-listings">
            <p>No listings available yet</p>
            <p className="hint">Be the first to list an AI model!</p>
          </div>
        ) : (
          filteredListings.map((listing) => (
            <div key={listing.id} className="listing-card">
              <div className="listing-badge">{listing.category || 'AI Model'}</div>
              <h3>{listing.name}</h3>
              <p className="listing-description">
                {listing.description || 'An advanced AI model available for purchase'}
              </p>

              <div className="listing-stats">
                <div className="stat">
                  <span className="label">Price</span>
                  <span className="value">{listing.price} ETH</span>
                </div>
                <div className="stat">
                  <span className="label">Purchases</span>
                  <span className="value">{listing.purchases || 0}</span>
                </div>
              </div>

              <div className="listing-seller">
                <span>Seller:</span>
                <span className="address">
                  {listing.seller
                    ? `${listing.seller.substring(0, 6)}...${listing.seller.substring(38)}`
                    : 'Unknown'}
                </span>
              </div>

              <button
                className="purchase-button"
                onClick={() => purchaseModel(listing.id, listing.price)}
                disabled={listing.seller === account}
              >
                {listing.seller === account ? 'Your Listing' : 'Purchase Model'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Marketplace;
