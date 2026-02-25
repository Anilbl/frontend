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
        localStorage.removeItem("user_session");
        if (setUser) setUser(null);

        const params = new URLSearchParams(location.search);
        if (params.get("expired")) {
            setError("Your session has expired. Please log in again.");
        }
    }, [location, setUser]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await api.post("/auth/login", {
                username: credentials.username.trim(),
                password: credentials.password
            });

            if (response.data) {
                const { 
                    token, userId, empId, username, role, email, 
                    isFirstLogin, firstLogin, isAdmin, isAccountant, hasEmployeeRole 
                } = response.data;

                const mustSetup = isFirstLogin === true || firstLogin === true;
                const userData = {
                    token, userId, empId, username, role,
                    email: email || username,
                    isAdmin, isAccountant, hasEmployeeRole
                };

                if (mustSetup) {
                    navigate('/setup-account', {
                        state: { email: userData.email, userId: userData.userId }
                    });
                    return;
                }

                localStorage.setItem("user_session", JSON.stringify(userData));
                if (setUser) setUser(userData);

                const userRole = typeof role === 'object' 
                    ? role.roleName.toUpperCase().trim() 
                    : role.toUpperCase().trim();

                if (userRole.includes('ADMIN')) navigate('/admin/dashboard');
                else if (userRole.includes('ACCOUNTANT')) navigate('/accountant/dashboard');
                else if (userRole.includes('EMPLOYEE')) navigate('/employee/dashboard');
                else setError("Unknown account role. Please contact support.");
            }
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data || "Authentication failed.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-wrapper">
            <div className="login-card">
                <div className="login-header">
                    <h1>Centralized</h1>
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
                            autoComplete="off"
                            value={credentials.username}
                            onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
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
                                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                            />
                            <span
                                className="password-toggle-icon"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <AiFillEyeInvisible /> : <AiFillEye />}
                            </span>
                        </div>
                    </div>

                    {error && <div className="error-box">{error}</div>}

                    <button type="submit" className="login-btn" disabled={isLoading}>
                        {isLoading ? "VERIFYING..." : "SIGN IN"}
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