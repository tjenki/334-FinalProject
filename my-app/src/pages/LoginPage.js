import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";
function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");

  function handleLogin(e) {
    e.preventDefault();

    if (username.trim() === "") {
      alert("Please enter your name.");
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
        <label htmlFor="username">Name</label>

        <input
          id="username"
          type="text"
          placeholder="Enter your name"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <button type="submit">Log In</button>
      </form>

      <p className="accessibility-note">
        Designed to make daily tracking simple, clear, and accessible.
      </p>
    </div>
  </div>
);
}
export default LoginPage;