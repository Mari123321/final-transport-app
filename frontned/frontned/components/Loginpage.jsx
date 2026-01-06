import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/users/login', formData);

      if (response.status === 200) {
        const user = response.data.user;

        // Store user in localStorage or state
        localStorage.setItem('user', JSON.stringify(user));

        // Navigate to dashboard
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err.response?.data?.message || 'Login failed. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h2>Login</h2>

        <input
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          required
          style={styles.input}
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
          style={styles.input}
        />

        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>

        {error && <p style={styles.error}>{error}</p>}
      </form>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#f0f2f5',
  },
  form: {
    padding: 20,
    borderRadius: 8,
    background: '#fff',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    display: 'flex',
    flexDirection: 'column',
    width: 300,
  },
  input: {
    marginBottom: 12,
    padding: 10,
    fontSize: 16,
    borderRadius: 4,
    border: '1px solid #ccc',
  },
  button: {
    padding: 10,
    fontSize: 16,
    borderRadius: 4,
    border: 'none',
    background: '#007bff',
    color: '#fff',
    cursor: 'pointer',
  },
  error: {
    marginTop: 10,
    color: 'red',
    fontSize: 14,
  },
};

export default LoginPage;
