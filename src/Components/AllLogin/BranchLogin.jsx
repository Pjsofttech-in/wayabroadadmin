// src/components/Auth/BranchLogin.jsx
import React, { useState } from "react";
import { Input, Button, Typography, message } from "antd";
import { BranchesOutlined, LockOutlined, MailOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { loginBranch } from "./LoginService";
import LoadingOverlay from "../Common/LoadingOverlay";

const BranchLogin = () => {
  const [branchCode, setBranchCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!branchCode || !email || !password) {
      message.error("Please enter both Branch ID and password");
      return;
    }

    setLoading(true);
    try {
      const response = await loginBranch({ branchCode, email, password });
      // Use 'massage' due to backend typo, fallback to 'message'
      const successMessage = response.massage || response.message || "Branch Login Successful";
      const { token, data } = response;

      message.success(successMessage);

      sessionStorage.setItem("authToken", token);
      sessionStorage.setItem("branchName", data.branchName);
      sessionStorage.setItem("branchCode", data.branchCode);
      sessionStorage.setItem("bid", data.bid);
      sessionStorage.setItem("email", data.branchEmail);
      sessionStorage.setItem("role", "branch");

      // Remove systems/instituteEmail logic since not present in response

      navigate("/wayabroadadmin/admin/dashboard");
    } catch (error) {
      message.error("Login failed. Please check your credentials.");
      console.error("Login failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <LoadingOverlay loading={loading} />
      <div className="login-form">
        <Typography.Title level={4} className="form-title">
          Branch Access
        </Typography.Title>
        <p className="form-subtitle">Manage your branch operations</p>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Input
            size="large"
            placeholder="Branch Code"
            prefix={<BranchesOutlined className="input-icon" />}
            value={branchCode}
            onChange={(e) => setBranchCode(e.target.value.toUpperCase())}
            className="styled-input"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Input
            size="large"
            placeholder="Branch Email"
            prefix={<MailOutlined className="input-icon" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="styled-input"
          />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Input.Password
            size="large"
            placeholder="Password"
            prefix={<LockOutlined className="input-icon" />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="styled-input"
            onPressEnter={handleLogin}
          />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button type="primary" onClick={handleLogin} className="login-button" size="large">
            Sign In
          </Button>
        </motion.div>
        
        <div className="login-footer">
          <a href="#forgot" className="forgot-link">Forgot Password?</a>
        </div>
      </div>
    </>
  );
};

export default BranchLogin;