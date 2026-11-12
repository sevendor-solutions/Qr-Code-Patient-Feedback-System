import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { apiClient } from '../../api/client';
import { StatusBadge } from '../../components/common/StatusBadge';
import {
  FaSearch,
  FaHospital,
  FaCheckCircle,
  FaClock,
  FaHistory,
  FaArrowLeft,
} from 'react-icons/fa';

export const TrackStatusPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [ticketId, setTicketId] = useState(searchParams.get('ticketId') || '');
  const [mobile, setMobile] = useState(searchParams.get('mobile') || '');

  const [loading, setLoading] = useState(false);
  const [ticketData, setTicketData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchStatus = async (tId: string, mob: string) => {
    if (!tId || !mob) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiClient.get(`/complaints/track?ticketId=${tId.trim()}&mobile=${mob.trim()}`);
      setTicketData(res.data);
    } catch (err: any) {
      setTicketData(null);
      setErrorMsg(
        err.response?.data?.message ||
          'No matching ticket found. Please check your Ticket ID and Mobile number.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchParams.get('ticketId') && searchParams.get('mobile')) {
      fetchStatus(searchParams.get('ticketId')!, searchParams.get('mobile')!);
    }
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStatus(ticketId, mobile);
  };

  return (
    <div className="es-mobile-container">
      <header className="es-mobile-header">
        <div className="d-flex align-items-center justify-content-center mb-1">
          <FaHospital className="text-warning me-2" size={24} />
          <h1 className="h4 mb-0 fw-bold">DHH KATAKA · Grievance Tracking</h1>
        </div>
        <p className="small mb-0 opacity-90">District Head Hospital, Cuttack (ଜିଲ୍ଲା ମୁଖ୍ୟ ଚିକିତ୍ସାଳୟ, କଟକ)</p>
      </header>

      <div className="p-3 flex-grow-1">
        <Card className="p-3 mb-3 border shadow-sm">
          <h6 className="fw-bold mb-3 text-primary d-flex align-items-center">
            <FaSearch className="me-2" /> Track Ticket by Reference Number
          </h6>
          <Form onSubmit={handleSearch}>
            <Form.Group className="mb-2">
              <Form.Label className="small fw-semibold">Ticket ID</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. FB-2026-000001"
                value={ticketId}
                onChange={(e) => setTicketId(e.target.value.toUpperCase())}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="small fw-semibold">Registered Mobile Number</Form.Label>
              <Form.Control
                type="tel"
                maxLength={10}
                placeholder="10-digit mobile number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                required
              />
            </Form.Group>

            <Button type="submit" variant="primary" className="w-100 es-touch-btn" disabled={loading}>
              {loading ? <Spinner size="sm" className="me-2" /> : <FaSearch className="me-2" />}
              Check Status
            </Button>
          </Form>
        </Card>

        {errorMsg && (
          <Alert variant="danger" dismissible onClose={() => setErrorMsg(null)}>
            {errorMsg}
          </Alert>
        )}

        {ticketData && (
          <Card className="border-primary shadow-sm mb-4">
            <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center py-2">
              <span className="fw-bold">{ticketData.ticketId}</span>
              <StatusBadge status={ticketData.status} />
            </Card.Header>
            <Card.Body>
              <div className="row g-2 mb-3">
                <div className="col-6">
                  <small className="text-muted d-block">Department</small>
                  <span className="fw-bold">{ticketData.department}</span>
                </div>
                <div className="col-6">
                  <small className="text-muted d-block">Category</small>
                  <span className="fw-semibold">{ticketData.category}</span>
                </div>
                <div className="col-6">
                  <small className="text-muted d-block">Priority</small>
                  <span
                    className={`badge ${
                      ticketData.priority === 'URGENT' ? 'bg-danger' : 'bg-secondary'
                    }`}
                  >
                    {ticketData.priority}
                  </span>
                </div>
                <div className="col-6">
                  <small className="text-muted d-block">Registered On</small>
                  <span className="small">
                    {new Date(ticketData.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              <div className="p-2 bg-light rounded mb-3 border">
                <small className="text-muted d-block fw-bold mb-1">Grievance Description:</small>
                <p className="mb-0 small">{ticketData.description}</p>
              </div>

              {ticketData.slaDeadline && (
                <div className="d-flex align-items-center p-2 mb-3 rounded bg-info bg-opacity-10 border border-info">
                  <FaClock className="text-primary me-2" />
                  <small className="text-dark">
                    <strong>SLA Resolution Target:</strong>{' '}
                    {new Date(ticketData.slaDeadline).toLocaleString()}
                  </small>
                </div>
              )}

              {/* Chronological Action Timeline */}
              <h6 className="fw-bold text-dark mb-2 d-flex align-items-center">
                <FaHistory className="me-2 text-primary" /> Resolution Timeline & Action Notes
              </h6>
              <div className="timeline ps-2 border-start border-2 border-primary ms-2 my-3">
                {ticketData.timeline && ticketData.timeline.length > 0 ? (
                  ticketData.timeline.map((item: any, idx: number) => (
                    <div key={idx} className="mb-3 position-relative ps-3">
                      <div
                        className="position-absolute bg-primary rounded-circle"
                        style={{
                          width: '10px',
                          height: '10px',
                          left: '-6px',
                          top: '6px',
                        }}
                      />
                      <div className="d-flex justify-content-between align-items-center">
                        <StatusBadge status={item.toStatus} />
                        <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                          {new Date(item.createdAt).toLocaleString()}
                        </small>
                      </div>
                      <p className="mt-1 mb-0 small text-dark bg-light p-2 rounded border">
                        {item.actionRemarks}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted small">No status changes recorded yet.</p>
                )}
              </div>
            </Card.Body>
          </Card>
        )}

        <div className="text-center mt-3">
          <Link to="/feedback" className="btn btn-link text-decoration-none small">
            <FaArrowLeft className="me-1" /> Return to Hospital Feedback Form
          </Link>
        </div>
      </div>

      <footer className="p-3 text-center bg-light border-top text-muted small">
        DHH KATAKA Patient Care Portal · District Head Hospital (ଜିଲ୍ଲା ମୁଖ୍ୟ ଚିକିତ୍ସାଳୟ, କଟକ)
      </footer>
    </div>
  );
};
