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
  const [serviceFilter, setServiceFilter] = useState<'ALL' | 'OPD' | 'IPD'>('ALL');
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
      header: 'Service Stream',
      render: (row) => {
        const isIpd =
          row.patientType === 'IPD' ||
          row.department?.code === 'IPD' ||
          (row.ratings && row.ratings.length > 10) ||
          (row.answers && Object.keys(row.answers).length > 10);
        return isIpd ? (
          <Badge bg="primary" className="fw-semibold">
            IPD (ଅନ୍ତଃ-ବିଭାଗ)
          </Badge>
        ) : (
          <Badge bg="success" className="fw-semibold">
            OPD (ବହିଃ-ବିଭାଗ)
          </Badge>
        );
      },
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
    <div className="container-fluid py-4 px-2 px-md-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <div>
          <h1 className="h4 fw-bold text-dark mb-0">DHH KATAKA · Patient Feedback Master Listing</h1>
          <small className="text-muted">
            Continuous citizen feedback collection for OPD (10 Qs) & IPD (20 Qs) with masked mobile privacy
          </small>
        </div>
        <div className="badge bg-primary px-3 py-2">District Head Hospital, Cuttack</div>
      </div>

      {/* OPD / IPD Quick Switcher Bar */}
      <div className="d-flex flex-wrap gap-2 mb-3">
        <Button
          variant={serviceFilter === 'ALL' ? 'primary' : 'outline-secondary'}
          size="sm"
          className="fw-bold px-3"
          onClick={() => {
            setServiceFilter('ALL');
            setSelectedDept('');
            setPage(1);
          }}
        >
          All Feedbacks (ସମସ୍ତ)
        </Button>
        <Button
          variant={serviceFilter === 'OPD' ? 'success' : 'outline-success'}
          size="sm"
          className="fw-bold px-3"
          onClick={() => {
            setServiceFilter('OPD');
            const opd = departments.find((d: any) => d.code === 'OPD');
            if (opd) setSelectedDept(opd.id);
            setPage(1);
          }}
        >
          OPD Feedbacks · ବହିଃ-ବିଭାଗ (10 Qs)
        </Button>
        <Button
          variant={serviceFilter === 'IPD' ? 'primary' : 'outline-primary'}
          size="sm"
          className="fw-bold px-3"
          onClick={() => {
            setServiceFilter('IPD');
            const ipd = departments.find((d: any) => d.code === 'IPD');
            if (ipd) setSelectedDept(ipd.id);
            setPage(1);
          }}
        >
          IPD Feedbacks · ଅନ୍ତଃ-ବିଭାଗ (20 Qs)
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="es-card mb-3 p-3">
        <Row className="g-2 align-items-center">
          <Col xs={12} sm={6} md={4}>
            <Form.Select
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setPage(1);
              }}
              size="sm"
            >
              <option value="">-- All Hospital Departments / Units --</option>
              {departments.map((d: any) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </Form.Select>
          </Col>

          <Col xs={12} sm={6} md={3}>
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

          <Col xs={12} md={3}>
            {(selectedDept || minRating || search || serviceFilter !== 'ALL') && (
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => {
                  setSelectedDept('');
                  setMinRating('');
                  setSearch('');
                  setServiceFilter('ALL');
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
              DHH KATAKA · Feedback Details - {selectedFeedback.department?.name} ({selectedFeedback.patientType || 'OPD'})
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
