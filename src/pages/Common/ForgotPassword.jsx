import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../Login/login.css";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });
    const navigate = useNavigate();

    const handleResetRequest = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: "", text: "" });

        try {
            await axios({
                method: "post",
                url: "http://localhost:8080/api/users/forgot-password",
                params: { email: email.trim() },
                headers: { "Authorization": "" } 
            });
            
            setMessage({ type: "success", text: "OTP sent to your email! Redirecting..." });
            setTimeout(() => navigate("/reset-password"), 2000);
        } catch (error) {
            const status = error.response?.status;
            setMessage({ 
                type: "error", 
                text: status === 404 ? "Email not found in our system." : "Connection failed." 
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-wrapper">
            <div className="login-card">
                <div className="login-header">
                    <h1>NAST</h1>
                    <p>Forgot Password</p>
                </div>

                {message.text && (
                    <div className={message.type === "error" ? "error-msg" : "success-msg"}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleResetRequest}>
                    <div className="input-group">
                        <label>REGISTERED EMAIL</label>
                        <input
                            type="email"
                            placeholder="user@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? "SENDING..." : "Send Reset Link"}
                    </button>
                </form>
                
                <button type="button" className="link-button" onClick={() => navigate("/")}>
                    Back to Login
                </button>
            </div>
        </div>
    );
};

export default ForgotPassword;