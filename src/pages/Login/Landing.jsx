import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import api from "../../api/axios"; 
import './login.css';

const Landing = ({ setUser, currentUser }) => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const navigate = useNavigate();
    const location = useLocation();

    // Check if there's a specific page the user was trying to reach before being redirected here
    const from = location.state?.from?.pathname;

    useEffect(() => {
        // If user is already logged in and hits the landing page, 
        // redirect them to their dashboard automatically.
        if (currentUser && currentUser.token) {
            const userRole = (typeof currentUser.role === 'object' ? currentUser.role.roleName : currentUser.role || "").toUpperCase();
            const target = from || (userRole.includes('ADMIN') ? '/admin/dashboard' : userRole.includes('ACCOUNTANT') ? '/accountant/dashboard' : '/employee/dashboard');
            navigate(target, { replace: true });
        }

        const params = new URLSearchParams(location.search);
        if (params.get("expired")) {
            setError("Your session has expired. Please log in again.");
        }
        // localStorage.removeItem("user_session") REMOVED: Don't kill session on mount
    }, [location, currentUser, navigate, from]);

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
                const userData = response.data;
                const { token, role, isFirstLogin, email } = userData;
                
                localStorage.setItem("user_session", JSON.stringify(userData));
                if (setUser) setUser(userData);

                if (isFirstLogin) {
                    navigate('/initial-setup', { state: { email: email } });
                    return;
                }

                // Redirect to the intended page (Deep Linking) or the default dashboard
                const userRole = (role.roleName || role).toUpperCase();
                let defaultPath = '/employee/dashboard';
                if (userRole.includes('ADMIN')) defaultPath = '/admin/dashboard';
                else if (userRole.includes('ACCOUNTANT')) defaultPath = '/accountant/dashboard';

                navigate(from || defaultPath, { replace: true });
            }
        } catch (err) {
            setError(err.response?.data?.message || "Authentication failed.");
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
                                value={credentials.password}
                                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                            />
                            <button 
                                type="button"
                                className="password-toggle-icon"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <AiFillEyeInvisible /> : <AiFillEye />}
                            </button>
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