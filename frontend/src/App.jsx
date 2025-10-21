import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';
import Dashboard from './components/Dashboard';
import Marketplace from './components/Marketplace';
import Analytics from './components/Analytics';

function App() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');

  // Connect to MetaMask
  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });

        const provider = new ethers.BrowserProvider(window.ethereum);
        setProvider(provider);
        setAccount(accounts[0]);

        console.log('Connected account:', accounts[0]);
      } else {
        alert('Please install MetaMask!');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
  };

  // Load models
  const loadModels = async () => {
    setLoading(true);
    try {
      // Call backend API to get models
      const response = await fetch('http://localhost:3001/api/models');
      const data = await response.json();

      if (data.success) {
        setModels(data.models);
      }
    } catch (error) {
      console.error('Error loading models:', error);
    }
    setLoading(false);
  };

  // Register new model
  const registerModel = async (name, ipfsHash) => {
    try {
      if (!provider || !account) {
        alert('Please connect your wallet first');
        return;
      }

      // This would call the smart contract
      // For now, just show a message
      console.log('Registering model:', { name, ipfsHash });
      alert('Model registration feature coming soon!');
    } catch (error) {
      console.error('Error registering model:', error);
    }
  };

  useEffect(() => {
    if (account) {
      loadModels();
    }
  }, [account]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>MonaAI</h1>
        <p>Blockchain-based AI Model Platform</p>

        {!account ? (
          <button onClick={connectWallet} className="connect-button">
            Connect Wallet
          </button>
        ) : (
          <div className="wallet-info">
            <p>Connected: {account.substring(0, 6)}...{account.substring(38)}</p>
            <button onClick={disconnectWallet} className="disconnect-button">
              Disconnect
            </button>
          </div>
        )}
      </header>

      {account && (
        <nav className="App-nav">
          <button
            className={currentView === 'dashboard' ? 'active' : ''}
            onClick={() => setCurrentView('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={currentView === 'marketplace' ? 'active' : ''}
            onClick={() => setCurrentView('marketplace')}
          >
            Marketplace
          </button>
          <button
            className={currentView === 'analytics' ? 'active' : ''}
            onClick={() => setCurrentView('analytics')}
          >
            Analytics
          </button>
          <button
            className={currentView === 'models' ? 'active' : ''}
            onClick={() => setCurrentView('models')}
          >
            My Models
          </button>
        </nav>
      )}

      <main className="App-main">
        {account ? (
          <>
            {currentView === 'dashboard' && (
              <Dashboard account={account} provider={provider} />
            )}

            {currentView === 'marketplace' && (
              <Marketplace account={account} provider={provider} />
            )}

            {currentView === 'analytics' && (
              <Analytics account={account} provider={provider} />
            )}

            {currentView === 'models' && (
              <div className="my-models-view">
                <section className="models-section">
                  <h2>My AI Models</h2>
                  <button onClick={loadModels} disabled={loading}>
                    {loading ? 'Loading...' : 'Refresh Models'}
                  </button>

                  <div className="models-grid">
                    {models.length === 0 ? (
                      <p>No models registered yet</p>
                    ) : (
                      models.map((model) => (
                        <div key={model.id} className="model-card">
                          <h3>{model.name}</h3>
                          <p>ID: {model.id}</p>
                          <p>Creator: {model.creator}</p>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                <section className="register-section">
                  <h2>Register New Model</h2>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    registerModel(
                      formData.get('name'),
                      formData.get('ipfsHash')
                    );
                  }}>
                    <input
                      type="text"
                      name="name"
                      placeholder="Model Name"
                      required
                    />
                    <input
                      type="text"
                      name="ipfsHash"
                      placeholder="IPFS Hash"
                      required
                    />
                    <button type="submit">Register Model</button>
                  </form>
                </section>
              </div>
            )}
          </>
        ) : (
          <div className="welcome-section">
            <h2>Welcome to MonaAI</h2>
            <p>Connect your wallet to get started</p>
          </div>
        )}
      </main>

      <footer className="App-footer">
        <p>MonaAI - Decentralized AI on Blockchain</p>
      </footer>
    </div>
  );
}

export default App;
