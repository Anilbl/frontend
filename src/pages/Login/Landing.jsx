import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import api from "../../api/axios"; 
import './login.css';

const Landing = ({ setUser }) => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get("expired")) {
            setError("Your session has expired. Please log in again.");
            localStorage.removeItem("user_session");
        }
    }, [location]);

   const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(''); 

    try {
        // Use the configured api instance to call backend auth
        const response = await api.post("/auth/login", credentials);

        if (response.data) {
            // Destructure response including the fixed empId for Gita and Sita
            const { token, userId, empId, username, role } = response.data;

            const userData = {
                token,
                userId,
                empId, 
                username,
                role
            };

            // Save session to localStorage so ProtectedRoute and components can access it
            localStorage.setItem("user_session", JSON.stringify(userData));
            
            if (setUser) setUser(userData);

            // Normalize role string to handle database variations
            const userRole = role.toUpperCase().trim();

            // REDIRECTION LOGIC: Handles all three portal types
            if (userRole === 'ROLE_EMPLOYEE' || userRole === 'EMPLOYEE') {
                navigate('/employee/dashboard'); 
            } else if (userRole === 'ROLE_ACCOUNTANT' || userRole === 'ACCOUNTANT') {
                // FIXED: Now correctly redirects Sita to the Accountant Portal
                navigate('/accountant/dashboard');
            } else if (userRole === 'ROLE_ADMIN' || userRole === 'ADMIN') {
                navigate('/admin/dashboard');
            } else {
                setError("Unknown account role. Please contact support.");
            }
        }
    } catch (err) {
        // Handles 404 (User not found) or 401 (Wrong password)
        setError(err.response?.data?.message || "Server connection error.");
    } finally {
        setIsLoading(false);
    }
};

    return (
        <div className="login-wrapper">
            <div className="login-card">
                <div className="login-header">
                    <h1>NAST</h1>
                    <p>Payroll Management System</p>
                    <span className="badge">SECURE GATEWAY</span>
                </div>

                <form onSubmit={handleLogin} className="login-form">
                    <div className="input-group">
                        <label>USERNAME</label>
                        <input
                            type="text"
                            placeholder="Enter your username"
                            required
                            autoComplete="username"
                            value={credentials.username}
                            onChange={(e) =>
                                setCredentials({ ...credentials, username: e.target.value })
                            }
                        />
                    </div>

                    <div className="input-group">
                        <label>PASSWORD</label>
                        <div className="input-container">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                required
                                autoComplete="current-password"
                                value={credentials.password}
                                onChange={(e) =>
                                    setCredentials({ ...credentials, password: e.target.value })
                                }
                            />
                            <span
                                className="password-toggle-icon"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <AiFillEyeInvisible /> : <AiFillEye />}
                            </span>
                        </div>
                    </div>

                    {error && (
                        <div className="error-box animate-shake">
                            {error}
                        </div>
                    )}

                    <button type="submit" className="login-btn" disabled={isLoading}>
                        {isLoading ? (
                            <span className="spinner">VERIFYING...</span>
                        ) : (
                            'SIGN IN'
                        )}
                    </button>
                </form>

                <div className="login-footer">
                    <button
                        type="button"
                        className="trouble-link"
                        onClick={() => navigate('/forgot-password')}
                    >
                        Trouble signing in?
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Landing;