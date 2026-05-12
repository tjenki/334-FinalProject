import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  function handleLogin(e) {
    e.preventDefault();

    if (username.trim() === "" || password.trim() === "") {
      alert("Please enter both a username and password.");
      return;
    }

    localStorage.setItem("username", username);
    navigate("/home");
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Welcome</h1>
        <p>Log in to start tracking your day.</p>

        <form onSubmit={handleLogin}>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit">Log In</button>
        </form>

    
      </div>
    </div>
  );
}

export default LoginPage;