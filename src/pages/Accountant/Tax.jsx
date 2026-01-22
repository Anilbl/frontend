import React, { useState, useEffect } from 'react';
// FIXED: Use the authenticated instance from src/api/axios.js
import api from "../../api/axios"; 
import './Tax.css';

const Tax = () => {
  const [taxSlabs, setTaxSlabs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Single'); 

  const initialFormState = {
    name: '', 
    minAmount: '', 
    maxAmount: '', 
    ratePercentage: '',
    effectiveFrom: '', 
    effectiveTo: '', 
    description: '',
    taxpayerStatus: 'Single' 
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => { fetchSlabs(); }, []);

  const fetchSlabs = async () => {
    try {
      // Logic: Use authenticated 'api' instance
      const response = await api.get('/tax-slabs');
      setTaxSlabs(response.data);
    } catch (error) {
      console.error("Error fetching slabs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Logic: Use authenticated 'api' instance for POST
      await api.post('/tax-slabs', formData);
      setShowModal(false);
      fetchSlabs(); 
      setFormData(initialFormState);
    } catch (error) {
      alert("Error: Database rejected the entry. Ensure you have proper permissions.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const filteredSlabs = taxSlabs.filter(slab => {
    const status = slab.taxpayerStatus || 'Single';
    return status === activeTab;
  });

  return (
    <div className="tax-page-container">
      <div className="tax-header-section">
        <div>
          <h1 className="tax-title">Tax & Compliance</h1>
          <p className="tax-subtitle">Government Tax Slabs for FY 2025/26 (Nepal Policy)</p>
        </div>
        <button className="btn-update-reg" onClick={() => setShowModal(true)}>
          Update Regulations
        </button>
      </div>

      <div className="filter-tab-container">
        <button 
          className={`tab-btn ${activeTab === 'Single' ? 'active' : ''}`} 
          onClick={() => setActiveTab('Single')}
        >
          Single Status
        </button>
        <button 
          className={`tab-btn ${activeTab === 'Couple' ? 'active' : ''}`} 
          onClick={() => setActiveTab('Couple')}
        >
          Married/Couple Status
        </button>
      </div>

      <div className="tax-data-card">
        <div className="card-header-flex">
            <h3>Active {activeTab} Slabs</h3>
            <span className="last-sync">Current Policy: Dec 2025</span>
        </div>
        <div className="table-responsive-wrapper">
          <table className="tax-professional-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Annual Income Range</th>
                <th>Tax Rate</th>
                <th>Status Type</th>
                <th>Category</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6">Loading...</td></tr>
              ) : filteredSlabs.length > 0 ? (
                filteredSlabs.map((slab) => (
                  <tr key={slab.taxSlabId}>
                    <td className="text-muted">#{slab.taxSlabId}</td>
                    <td className="text-bold-slate">
                      Rs. {slab.minAmount?.toLocaleString()} - 
                      {slab.maxAmount >= 99999999 ? ' Above' : ` Rs. ${slab.maxAmount?.toLocaleString()}`}
                    </td>
                    <td><span className="rate-pill-indigo">{slab.ratePercentage}%</span></td>
                    <td>
                      <span className={slab.taxpayerStatus === 'Couple' ? 'pill-couple' : 'pill-single'}>
                        {slab.taxpayerStatus || 'Single'}
                      </span>
                    </td>
                    <td>{slab.name}</td>
                    <td><span className="status-dot-green">● Active</span></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="no-data">
                    No data found for {activeTab} status. 
                    <br/>
                    <small>Check if your database "taxpayerStatus" column is correctly set to 'Couple'.</small>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add New Tax Regulation</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group" style={{gridColumn: 'span 2'}}>
                  <label>Taxpayer Status</label>
                  <select 
                    name="taxpayerStatus" 
                    value={formData.taxpayerStatus} 
                    onChange={handleInputChange}
                    required
                  >
                    <option value="Single">Single (Individual)</option>
                    <option value="Couple">Couple (Married)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Category Name</label>
                  <input type="text" name="name" value={formData.name} required onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Tax Rate (%)</label>
                  <input type="number" name="ratePercentage" value={formData.ratePercentage} step="0.1" required onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Min Amount</label>
                  <input type="number" name="minAmount" value={formData.minAmount} required onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Max Amount</label>
                  <input type="number" name="maxAmount" value={formData.maxAmount} required onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Effective From</label>
                  <input type="date" name="effectiveFrom" value={formData.effectiveFrom} required onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Effective To</label>
                  <input type="date" name="effectiveTo" value={formData.effectiveTo} required onChange={handleInputChange} />
                </div>
                <div className="form-group" style={{gridColumn: 'span 2'}}>
                  <label>Description</label>
                  <textarea name="description" value={formData.description} onChange={handleInputChange} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-save">Save Regulation</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tax;