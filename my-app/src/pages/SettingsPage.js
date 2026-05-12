import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  clampTextSizeLevel,
  loadAccessibilitySettings,
  saveAccessibilitySettings,
} from "../accessibilitySettings";
import "./styles.css";

function SettingsPage() {
  const [settings, setSettings] = useState(() => loadAccessibilitySettings());
  const navigate = useNavigate();

  function updateSetting(name) {
    const nextSettings = {
      ...settings,
      [name]: !settings[name],
    };

    setSettings(nextSettings);
    saveAccessibilitySettings(nextSettings);
  }

  function changeTextSize(change) {
    const nextSettings = {
      ...settings,
      textSizeLevel: clampTextSizeLevel(settings.textSizeLevel + change),
    };

    setSettings(nextSettings);
    saveAccessibilitySettings(nextSettings);
  }

  function resetSettings() {
    const nextSettings = {
      textSizeLevel: 0,
      highContrast: false,
      focusMode: false,
    };

    setSettings(nextSettings);
    saveAccessibilitySettings(nextSettings);
  }

  function handleLogout() {
    localStorage.removeItem("username");
    navigate("/");
  }

  return (
    <div className="settings-page medication-page">
      <a className="skip-link" href="#settings-main">
        Skip to settings
      </a>

      <header className="app-header">
        <div>
          <h1>Settings</h1>
          <p className="intro">Choose display modes that stay on across the app.</p>
          <nav className="med-nav" aria-label="Main pages">
            <Link to="/home">Home</Link>
            <Link to="/medications">Medications</Link>
            <Link to="/appointments">Appointments</Link>
            <Link to="/tasks" aria-current="page">
              Settings
            </Link>
          </nav>
        </div>
        <button onClick={handleLogout} className="logout-button" type="button">
          Log Out
        </button>
      </header>

      <main id="settings-main" className="settings-shell">
        <section className="settings-panel" aria-labelledby="accessibility-title">
          <div className="section-heading">
            <h2 id="accessibility-title">Accessibility modes</h2>
            <p>These choices are saved and will apply when you move between pages.</p>
          </div>

          <div className="settings-list">
            <div className="setting-row">
              <div>
                <h3>Text size</h3>
                <p>Use minus or plus to make text smaller or bigger across the app.</p>
              </div>
              <div className="text-size-controls" aria-label="Text size controls">
                <button
                  className="size-button"
                  type="button"
                  onClick={() => changeTextSize(-1)}
                  disabled={settings.textSizeLevel === 0}
                  aria-label="Make text smaller"
                >
                  -
                </button>
                <span aria-live="polite"> Size {settings.textSizeLevel + 1}</span>
                <button
                  className="size-button"
                  type="button"
                  onClick={() => changeTextSize(1)}
                  disabled={settings.textSizeLevel === 4}
                  aria-label="Make text bigger"
                >
                  +
                </button>
              </div>
            </div>

            <div className="setting-row">
              <div>
                <h3>High contrast</h3>
                <p>Uses stronger colors for better visibility.</p>
              </div>
              <button
                className="tool-button"
                type="button"
                aria-pressed={settings.highContrast}
                onClick={() => updateSetting("highContrast")}
              >
                {settings.highContrast ? "On" : "Off"}
              </button>
            </div>

            <div className="setting-row">
              <div>
                <h3>Focus mode</h3>
                <p>Reduces extra sections so the current page is calmer.</p>
              </div>
              <button
                className="tool-button"
                type="button"
                aria-pressed={settings.focusMode}
                onClick={() => updateSetting("focusMode")}
              >
                {settings.focusMode ? "On" : "Off"}
              </button>
            </div>
          </div>

          <button className="secondary-button reset-button" type="button" onClick={resetSettings}>
            Reset display settings
          </button>
        </section>
      </main>
    </div>
  );
}

export default SettingsPage;
