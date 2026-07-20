// src/components/Auth/StaffLogin.jsx
import React, { useState } from "react";
import { Input, Button, Typography, message } from "antd";
import { BranchesOutlined, LockOutlined, MailOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { loginStaff } from "./LoginService";
import LoadingOverlay from "../Common/LoadingOverlay";

const StaffLogin = () => {
  const [branchCode, setBranchCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!branchCode || !email || !password) {
      message.error("Please enter Branch Code, Staff Email, and password");
      return;
    }

    setLoading(true);
    try {
      const response = await loginStaff({ branchCode, email, password });
      const { message: successMessage, token, data } = response;

      message.success(successMessage || "Staff Login Successful");

      // Store data in sessionStorage
      sessionStorage.setItem("authToken", token);
      sessionStorage.setItem("email", data.staffEmail);
      sessionStorage.setItem("enabledSystems", JSON.stringify(data.systems));
      sessionStorage.setItem("role", "staff");
      sessionStorage.setItem("staffName", data.staffName);
      sessionStorage.setItem("branchCode", data.branchCode);

      // Save dashboard/settings permissions for staff login
      if (data.canssetting !== undefined) {
        sessionStorage.setItem("canssetting", data.canssetting);
      }
      if (data.cansdashBoard !== undefined) {
        sessionStorage.setItem("cansdashBoard", data.cansdashBoard);
      }

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
          Staff Access
        </Typography.Title>
        <p className="form-subtitle">Enter your staff credentials</p>

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
            onChange={(e) => setBranchCode(e.target.value)}
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
            placeholder="Staff Email"
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

export default StaffLogin;