import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import { FaHospitalSymbol, FaLock, FaUser } from 'react-icons/fa';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuth();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin@12345');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await login(username, password);
      navigate('/admin');
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message || 'Login failed. Please verify your credentials.',
      );
    }
  };

  const handleQuickLogin = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center"
      style={{
        minHeight: '100vh',
        backgroundColor: '#EEF2F7',
        backgroundImage: 'radial-gradient(#1565C0 0.75px, transparent 0.75px)',
        backgroundSize: '24px 24px',
      }}
    >
      <div style={{ maxWidth: '440px', width: '100%', padding: '16px' }}>
        <Card className="shadow-sm border-0 rounded-3 overflow-hidden">
          <div
            className="p-4 text-center text-white"
            style={{
              background: 'linear-gradient(135deg, #1E6FD9 0%, #1565C0 100%)',
            }}
          >
            <FaHospitalSymbol size={42} className="mb-2 text-warning" />
            <h1 className="h3 fw-bold mb-0">
              eSushrut <span style={{ color: '#C6E85A' }}>G5</span>
            </h1>
            <p className="small mb-0 opacity-90">
              Centre for Development of Advanced Computing (C-DAC)
            </p>
            <div className="badge bg-white text-primary mt-2 fw-bold">
              Feedback & Grievance Administration
            </div>
          </div>

          <Card.Body className="p-4">
            {errorMsg && (
              <Alert variant="danger" dismissible onClose={() => setErrorMsg(null)} className="small">
                {errorMsg}
              </Alert>
            )}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold">Username</Form.Label>
                <div className="input-group">
                  <span className="input-group-text bg-light">
                    <FaUser className="text-muted" />
                  </span>
                  <Form.Control
                    type="text"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="small fw-bold">Password</Form.Label>
                <div className="input-group">
                  <span className="input-group-text bg-light">
                    <FaLock className="text-muted" />
                  </span>
                  <Form.Control
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </Form.Group>

              <Button
                type="submit"
                variant="primary"
                className="w-100 es-touch-btn fw-bold"
                disabled={loading}
              >
                {loading ? <Spinner size="sm" className="me-2" /> : null}
                Sign In to eSushrut Portal
              </Button>
            </Form>

            {/* Quick Demo Fill Buttons */}
            <div className="mt-4 pt-3 border-top">
              <small className="text-muted d-block fw-bold text-uppercase mb-2 text-center" style={{ fontSize: '0.7rem' }}>
                Quick Test Credentials
              </small>
              <div className="d-grid gap-1">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="text-start small"
                  onClick={() => handleQuickLogin('admin', 'Admin@12345')}
                >
                  👑 <strong>Super Admin</strong> (admin / Admin@12345)
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="text-start small"
                  onClick={() => handleQuickLogin('head_opd', 'Head@12345')}
                >
                  🩺 <strong>OPD Head</strong> (head_opd / Head@12345)
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="text-start small"
                  onClick={() => handleQuickLogin('officer_nodal', 'Officer@12345')}
                >
                  📋 <strong>Grievance Officer</strong> (officer_nodal / Officer@12345)
                </Button>
              </div>
            </div>
          </Card.Body>

          <Card.Footer className="bg-light text-center py-2 text-muted small border-top">
            Government of India | Ministry of Health & Family Welfare
          </Card.Footer>
        </Card>
      </div>
    </div>
  );
};
