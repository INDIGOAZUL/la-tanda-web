import React, { useState, useEffect } from 'react';

// Types for La Tanda Chain API
interface SlashingParams {
  signed_blocks_window: string;
  min_signed_per_window: string;
}

interface Validator {
  operator_address: string;
  status: string;
  jailed: boolean;
  description: {
    moniker: string;
  };
}

const UptimeDashboard: React.FC = () => {
  const [params, setParams] = useState<SlashingParams | null>(null);
  const [validators, setValidators] = useState<Validator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const paramsRes = await fetch('https://latanda.online/chain/api/cosmos/slashing/v1beta1/params');
        const paramsData = await paramsRes.json();
        setParams(paramsData.params);

        const validatorsRes = await fetch('https://latanda.online/chain/api/cosmos/staking/v1beta1/validators');
        const validatorsData = await validatorsRes.json();
        setValidators(validatorsData.validators);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading La Tanda Dashboard...</div>;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#f5f5f5' }}>
      <h1>La Tanda Chain Uptime Monitor</h1>
      
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h2>Slashing Parameters</h2>
        <p><strong>Signed Blocks Window:</strong> {params?.signed_blocks_window}</p>
        <p><strong>Min Signed Per Window:</strong> {(parseFloat(params?.min_signed_per_window || '0') * 100).toFixed(2)}%</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {validators.map((v) => (
          <div key={v.operator_address} style={{ padding: '15px', backgroundColor: 'white', borderRadius: '8px', borShadow: '0 2px 4px rgba(0,0,0,0.1)', borderLeft: v.jailed ? '5px solid red' : '5px solid green' }}>
            <h3>{v.description.moniker}</h3>
            <p><strong>Status:</strong> {v.status}</p>
            <p><strong>Jailed:</strong> {v.jailed ? 'Yes' : 'No'}</p>
            <p style={{ fontSize: '12px', color: '#666' }}>{v.operator_address}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UptimeDashboard;
