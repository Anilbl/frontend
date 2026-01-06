import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import api from "../../api/axios";
import './login.css';

const Landing = ({ setUser }) => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

 const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
        const response = await api.post('/auth/login', credentials);
        const userData = response.data;

        localStorage.setItem("user_session", JSON.stringify(userData));
        setUser(userData);

        const role = userData.role;
        if (role === 'ROLE_ADMIN') navigate('/admin/dashboard');
        else if (role === 'ROLE_ACCOUNTANT') navigate('/accountant/dashboard');
        else if (role === 'ROLE_EMPLOYEE') navigate('/employee/dashboard');
        else setError("Access Denied: Role not recognized.");

    } catch (err) {
        // 🎯 CHANGE IS HERE: Capture the actual message from the backend
        if (err.response && err.response.data) {
            // If backend sends a string or an object with a 'message' field
            const backendError = typeof err.response.data === 'string' 
                ? err.response.data 
                : err.response.data.message;
            
            setError(backendError || "An unexpected error occurred.");
        } else {
            setError("Server connection error. Please check if the backend is running.");
        }
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

                    {error && <div className="error-box">{error}</div>}

                    <button type="submit" className="login-btn" disabled={isLoading}>
                        {isLoading ? 'VERIFYING...' : 'SIGN IN'}
                    </button>
                </form>

                <button
                    type="button"
                    className="trouble-link"
                    onClick={() => navigate('/forgot-password')}
                >
                    Trouble signing in?
                </button>
            </div>
        </div>
    );
};

export default Landing;