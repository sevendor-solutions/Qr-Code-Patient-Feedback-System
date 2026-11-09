import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Row, Col, Form, Button, Modal, Badge } from 'react-bootstrap';
import { apiClient } from '../../api/client';
import { DataTable, Column } from '../../components/common/DataTable';
import { StarRating } from '../../components/common/StarRating';
import { FaListAlt, FaFilter, FaEye, FaCommentAlt, FaStar } from 'react-icons/fa';

export const FeedbackListPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [minRating, setMinRating] = useState('');
  const [selectedFeedback, setSelectedFeedback] = useState<any>(null);

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => (await apiClient.get('/departments')).data,
  });

  const { data: feedbackData, isLoading } = useQuery({
    queryKey: ['feedbacks', page, search, selectedDept, minRating],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
      });
      if (search) params.append('search', search);
      if (selectedDept) params.append('departmentId', selectedDept);
      if (minRating) {
        params.append('minRating', minRating);
        params.append('maxRating', minRating);
      }
      const res = await apiClient.get(`/feedback?${params.toString()}`);
      return res.data;
    },
  });

  const columns: Column<any>[] = [
    {
      header: 'Date & Time',
      render: (row) => (
        <div>
          <div className="fw-semibold">
            {new Date(row.createdAt).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </div>
          <small className="text-muted">
            {new Date(row.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </small>
        </div>
      ),
    },
    {
      header: 'Department',
      render: (row) => (
        <div>
          <span className="fw-bold text-primary">{row.department?.name}</span>
          {row.location && (
            <small className="text-muted d-block">{row.location.name}</small>
          )}
        </div>
      ),
    },
    {
      header: 'Patient / Mobile (Masked)',
      render: (row) => (
        <div>
          <div className="fw-semibold">{row.patientName || 'Anonymous Patient'}</div>
          <small className="font-monospace text-muted">{row.mobile}</small>
          {row.crNumber && <Badge bg="light" text="dark" className="ms-1 border">{row.crNumber}</Badge>}
        </div>
      ),
    },
    {
      header: 'Overall Rating',
      render: (row) => (
        <div className="d-flex align-items-center">
          <StarRating value={row.overallEmoji} readOnly size={18} />
          <span className="ms-2 fw-bold" style={{ fontSize: '0.85rem' }}>
            {row.overallEmoji} / 5
          </span>
        </div>
      ),
    },
    {
      header: 'NPS Score',
      render: (row) => {
        const score = row.npsScore;
        const color = score >= 9 ? 'success' : score >= 7 ? 'warning' : 'danger';
        return <Badge bg={color}>{score} / 10</Badge>;
      },
    },
    {
      header: 'Comments',
      render: (row) => (
        <div
          className="text-truncate text-muted small"
          style={{ maxWidth: '200px' }}
          title={row.comments || 'No comment provided'}
        >
          {row.comments || <span className="opacity-50">No remarks</span>}
        </div>
      ),
    },
    {
      header: 'Action',
      render: (row) => (
        <Button
          variant="outline-primary"
          size="sm"
          onClick={() => setSelectedFeedback(row)}
          title="View Breakdown"
        >
          <FaEye className="me-1" /> View
        </Button>
      ),
    },
  ];

  return (
    <div className="container-fluid py-4 px-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="h4 fw-bold text-dark mb-0">Patient Feedback Master Listing</h1>
          <small className="text-muted">
            Continuous citizen feedback collection with masked mobile privacy & category ratings
          </small>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="es-card mb-3 p-3">
        <Row className="g-2 align-items-center">
          <Col md={4}>
            <Form.Select
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setPage(1);
              }}
              size="sm"
            >
              <option value="">-- All Hospital Departments --</option>
              {departments.map((d: any) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </Form.Select>
          </Col>

          <Col md={3}>
            <Form.Select
              value={minRating}
              onChange={(e) => {
                setMinRating(e.target.value);
                setPage(1);
              }}
              size="sm"
            >
              <option value="">-- All Overall Ratings --</option>
              <option value="5">5 Stars (Excellent)</option>
              <option value="4">4 Stars (Good)</option>
              <option value="3">3 Stars (Average)</option>
              <option value="2">2 Stars (Poor - Alert)</option>
              <option value="1">1 Star (Terrible - Alert)</option>
            </Form.Select>
          </Col>

          <Col md={2}>
            {(selectedDept || minRating || search) && (
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => {
                  setSelectedDept('');
                  setMinRating('');
                  setSearch('');
                  setPage(1);
                }}
              >
                Clear Filters
              </Button>
            )}
          </Col>
        </Row>
      </Card>

      {/* Feedback Data Table */}
      <DataTable
        columns={columns}
        data={feedbackData?.items || []}
        total={feedbackData?.total || 0}
        page={page}
        limit={10}
        onPageChange={setPage}
        searchTerm={search}
        onSearchChange={(term) => {
          setSearch(term);
          setPage(1);
        }}
        searchPlaceholder="Search by patient, masked mobile, CR No, comments..."
        loading={isLoading}
      />

      {/* Details Modal */}
      {selectedFeedback && (
        <Modal show={true} onHide={() => setSelectedFeedback(null)} size="lg" centered>
          <Modal.Header closeButton className="bg-primary text-white py-2">
            <Modal.Title className="h6 fw-bold mb-0">
              Feedback Details - {selectedFeedback.department?.name}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row className="g-2 mb-3 bg-light p-2 rounded border">
              <Col sm={6}>
                <small className="text-muted d-block">Patient Name</small>
                <strong>{selectedFeedback.patientName || 'Anonymous'}</strong>
              </Col>
              <Col sm={6}>
                <small className="text-muted d-block">Masked Mobile</small>
                <span className="font-monospace">{selectedFeedback.mobile}</span>
              </Col>
              <Col sm={6}>
                <small className="text-muted d-block">Patient Type</small>
                <span className="badge bg-secondary">{selectedFeedback.patientType}</span>
              </Col>
              <Col sm={6}>
                <small className="text-muted d-block">Submission Time</small>
                <span>{new Date(selectedFeedback.createdAt).toLocaleString()}</span>
              </Col>
            </Row>

            <h6 className="fw-bold text-primary mb-2">9 Service Category Breakdown Ratings:</h6>
            <div className="d-grid gap-2 mb-3">
              {selectedFeedback.ratings?.map((r: any) => (
                <div
                  key={r.id || r.category}
                  className="d-flex justify-content-between align-items-center bg-white p-2 border rounded"
                >
                  <span className="small fw-semibold">{r.category}</span>
                  <div className="d-flex align-items-center">
                    <StarRating value={r.rating} readOnly size={16} />
                    <span className="ms-2 fw-bold small">{r.rating} / 5</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-light rounded border">
              <small className="text-muted d-block fw-bold mb-1">Patient Comments / Feedback:</small>
              <p className="mb-0 small">{selectedFeedback.comments || 'No comments left.'}</p>
            </div>
          </Modal.Body>
          <Modal.Footer className="py-1">
            <Button variant="secondary" size="sm" onClick={() => setSelectedFeedback(null)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
};
