/**
 * CD Penalty System - Frontend Integration Examples
 * This file shows how to use the CD penalty APIs from frontend applications
 */

// Example 1: Get CD penalty summary for a society member
const getCDPenaltySummary = async (token) => {
  try {
    const response = await fetch('/api/payment-requests/member/cd-penalties', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('CD Penalty Summary:', data.data);
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to fetch CD penalties');
    }
  } catch (error) {
    console.error('Error fetching CD penalties:', error);
    throw error;
  }
};

// Example 2: Get detailed penalty information for a specific CD payment
const getCDPenaltyDetails = async (requestId, token) => {
  try {
    const response = await fetch(`/api/payment-requests/member/cd-penalties/${requestId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('CD Penalty Details:', data.data);
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to fetch penalty details');
    }
  } catch (error) {
    console.error('Error fetching penalty details:', error);
    throw error;
  }
};

// Example 3: Display CD penalty information in UI
const displayCDPenalty = (paymentRequest) => {
  if (paymentRequest.paymentType !== 'CD') {
    return null;
  }

  const penaltyInfo = paymentRequest.penaltyDetails;
  
  if (penaltyInfo.hasPenalty) {
    return `
      <div class="cd-penalty-warning">
        <h4>⚠️ CD Penalty Applied</h4>
        <p><strong>Penalty Amount:</strong> ₹${penaltyInfo.penaltyAmount}</p>
        <p><strong>Rate:</strong> ₹${penaltyInfo.penaltyPerDay} per day</p>
        <p><strong>Message:</strong> ${penaltyInfo.message}</p>
        <p><strong>Total Amount with Penalty:</strong> ₹${paymentRequest.totalAmount}</p>
      </div>
    `;
  } else {
    return `
      <div class="cd-penalty-ok">
        <h4>✅ No CD Penalty</h4>
        <p>Payment is within grace period</p>
        <p><strong>Total Amount:</strong> ₹${paymentRequest.totalAmount}</p>
      </div>
    `;
  }
};

// Example 4: Admin - Get all CD penalties
const getAllCDPenalties = async (token, page = 1, limit = 10) => {
  try {
    const response = await fetch(`/api/payment-requests/admin/cd-penalties?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('All CD Penalties:', data.data);
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to fetch CD penalties');
    }
  } catch (error) {
    console.error('Error fetching all CD penalties:', error);
    throw error;
  }
};

// Example 5: Admin - Get CD penalty statistics
const getCDPenaltyStatistics = async (token, startDate, endDate) => {
  try {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);

    const response = await fetch(`/api/payment-requests/admin/cd-penalties/statistics?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('CD Penalty Statistics:', data.data);
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to fetch statistics');
    }
  } catch (error) {
    console.error('Error fetching CD penalty statistics:', error);
    throw error;
  }
};

// Example 6: Admin - Update CD penalty for a payment request
const updateCDPenalty = async (requestId, token) => {
  try {
    const response = await fetch(`/api/payment-requests/admin/cd-penalties/${requestId}/update`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('CD Penalty Updated:', data.data);
      return data.data;
    } else {
      throw new Error(data.message || 'Failed to update penalty');
    }
  } catch (error) {
    console.error('Error updating CD penalty:', error);
    throw error;
  }
};

// Example 7: React component for displaying CD penalty information
const CDPenaltyComponent = ({ paymentRequest, onRefresh }) => {
  const [penaltyDetails, setPenaltyDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (paymentRequest.paymentType === 'CD') {
      fetchPenaltyDetails();
    }
  }, [paymentRequest.requestId]);

  const fetchPenaltyDetails = async () => {
    setLoading(true);
    try {
      const details = await getCDPenaltyDetails(paymentRequest.requestId, token);
      setPenaltyDetails(details);
    } catch (error) {
      console.error('Failed to fetch penalty details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (paymentRequest.paymentType !== 'CD') {
    return null;
  }

  if (loading) {
    return <div>Loading penalty information...</div>;
  }

  return (
    <div className="cd-penalty-container">
      <h4>CD Penalty Information</h4>
      
      {penaltyDetails && (
        <div className="penalty-details">
          <div className="penalty-amount">
            <strong>Penalty Amount:</strong> ₹{penaltyDetails.penaltyDetails.penaltyAmount}
          </div>
          
          <div className="penalty-rate">
            <strong>Rate:</strong> ₹{penaltyDetails.penaltyDetails.penaltyPerDay} per day
          </div>
          
          <div className="penalty-message">
            {penaltyDetails.penaltyDetails.message}
          </div>
          
          <div className="total-amount">
            <strong>Total Amount with Penalty:</strong> ₹{penaltyDetails.totalAmountWithPenalty}
          </div>
        </div>
      )}
      
      <button onClick={fetchPenaltyDetails} className="refresh-btn">
        Refresh Penalty
      </button>
    </div>
  );
};

// Example 8: Dashboard widget for CD penalties
const CDPenaltyDashboard = ({ token }) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const data = await getCDPenaltySummary(token);
      setSummary(data);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading CD penalty summary...</div>;
  }

  if (!summary) {
    return <div>No CD penalty data available</div>;
  }

  return (
    <div className="cd-penalty-dashboard">
      <h3>CD Penalty Summary</h3>
      
      <div className="summary-stats">
        <div className="stat-item">
          <span className="stat-label">Total Payments:</span>
          <span className="stat-value">{summary.totalPayments}</span>
        </div>
        
        <div className="stat-item">
          <span className="stat-label">Overdue:</span>
          <span className="stat-value warning">{summary.overduePayments}</span>
        </div>
        
        <div className="stat-item">
          <span className="stat-label">On Time:</span>
          <span className="stat-value success">{summary.onTimePayments}</span>
        </div>
        
        <div className="stat-item">
          <span className="stat-label">Total Penalty:</span>
          <span className="stat-value penalty">₹{summary.totalPenalty}</span>
        </div>
        
        <div className="stat-item">
          <span className="stat-label">Total Amount:</span>
          <span className="stat-value">₹{summary.totalAmount}</span>
        </div>
        
        <div className="stat-item">
          <span className="stat-label">Total with Penalty:</span>
          <span className="stat-value total">₹{summary.totalAmountWithPenalty}</span>
        </div>
      </div>
      
      <div className="summary-message">
        {summary.summary.message}
      </div>
      
      <button onClick={fetchSummary} className="refresh-btn">
        Refresh Summary
      </button>
    </div>
  );
};

// Export functions for use in other modules
module.exports = {
  getCDPenaltySummary,
  getCDPenaltyDetails,
  displayCDPenalty,
  getAllCDPenalties,
  getCDPenaltyStatistics,
  updateCDPenalty,
  CDPenaltyComponent,
  CDPenaltyDashboard
};

console.log('✅ CD Penalty System Examples loaded successfully!');
console.log('\n📋 Available Functions:');
console.log('- getCDPenaltySummary(token) - Get penalty summary for member');
console.log('- getCDPenaltyDetails(requestId, token) - Get penalty details for specific payment');
console.log('- displayCDPenalty(paymentRequest) - Generate HTML for penalty display');
console.log('- getAllCDPenalties(token, page, limit) - Admin: Get all CD penalties');
console.log('- getCDPenaltyStatistics(token, startDate, endDate) - Admin: Get penalty statistics');
console.log('- updateCDPenalty(requestId, token) - Admin: Update penalty for payment request');
console.log('\n📱 React Components:');
console.log('- CDPenaltyComponent - Display penalty for single payment');
console.log('- CDPenaltyDashboard - Dashboard widget for penalty summary');
