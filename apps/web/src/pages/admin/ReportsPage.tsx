import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Row, Col, Card, Button, Table, Spinner, Badge } from 'react-bootstrap';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { apiClient } from '../../api/client';
import { FaFileExcel, FaFilePdf, FaChartBar, FaExclamationTriangle } from 'react-icons/fa';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
);

export const ReportsPage: React.FC = () => {
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const { data: summary, isLoading } = useQuery({
    queryKey: ['reports-summary-full'],
    queryFn: async () => {
      const res = await apiClient.get('/reports/summary');
      return res.data;
    },
  });

  const handleExportExcel = async () => {
    setDownloadingExcel(true);
    try {
      const res = await apiClient.get('/reports/export/excel', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'dhh-kataka-feedback-report.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setDownloadingExcel(false);
    }
  };

  const handleExportPdf = async () => {
    setDownloadingPdf(true);
    try {
      const res = await apiClient.get('/reports/export/pdf', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'dhh-kataka-quality-report.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Service Wise Bar Chart Data
  const serviceChartData = {
    labels: summary?.serviceWiseSatisfaction?.map((s: any) => s.category.replace('_', ' ')) || [],
    datasets: [
      {
        label: 'Average Star Rating (1 to 5)',
        data: summary?.serviceWiseSatisfaction?.map((s: any) => s.averageRating) || [],
        backgroundColor: '#1E6FD9',
        borderRadius: 4,
      },
    ],
  };

  // Complaint Status Doughnut Chart Data
  const complaintChartData = {
    labels: ['OPEN', 'IN PROGRESS', 'RESOLVED', 'ESCALATED', 'CLOSED'],
    datasets: [
      {
        data: summary?.complaintStatusCounts
          ? [
              summary.complaintStatusCounts.OPEN || 0,
              summary.complaintStatusCounts.IN_PROGRESS || 0,
              summary.complaintStatusCounts.RESOLVED || 0,
              summary.complaintStatusCounts.ESCALATED || 0,
              summary.complaintStatusCounts.CLOSED || 0,
            ]
          : [0, 0, 0, 0, 0],
        backgroundColor: ['#1565C0', '#F59E0B', '#10B981', '#EF4444', '#6B7280'],
      },
    ],
  };

  // Date Wise Trend Line Chart Data
  const dateWiseChartData = {
    labels: summary?.dateWiseRating?.map((d: any) => d.date) || [],
    datasets: [
      {
        label: 'Daily Avg Rating (1-5)',
        data: summary?.dateWiseRating?.map((d: any) => d.averageRating) || [],
        borderColor: '#10B981',
        backgroundColor: '#10B98120',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  if (isLoading) {
    return (
      <div className="container-fluid py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Compiling healthcare feedback analytics & satisfaction metrics...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4 px-2 px-md-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <div>
          <h1 className="h4 fw-bold text-dark mb-0">DHH KATAKA · Feedback Analytics & Quality Reports</h1>
          <small className="text-muted">
            District Head Hospital (ଜିଲ୍ଲା ମୁଖ୍ୟ ଚିକିତ୍ସାଳୟ, କଟକ) · OPD (10 Qs) & IPD (20 Qs) Quality Audit
          </small>
        </div>

        <div className="d-flex flex-wrap gap-2">
          <Button
            variant="outline-success"
            size="sm"
            onClick={handleExportExcel}
            disabled={downloadingExcel}
            className="fw-bold"
          >
            {downloadingExcel ? <Spinner size="sm" className="me-1" /> : <FaFileExcel className="me-1" />}
            Export Excel (.xlsx)
          </Button>

          <Button
            variant="outline-danger"
            size="sm"
            onClick={handleExportPdf}
            disabled={downloadingPdf}
            className="fw-bold"
          >
            {downloadingPdf ? <Spinner size="sm" className="me-1" /> : <FaFilePdf className="me-1" />}
            Export PDF Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {summary?.kpis && (
        <Row className="g-3 mb-4">
          <Col md={3} sm={6}>
            <div className="bg-white p-3 rounded border shadow-sm">
              <small className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.75rem' }}>
                Total Patient Feedbacks
              </small>
              <div className="display-6 fw-bold text-primary">{summary.kpis.totalFeedbacks}</div>
              <small className="text-success fw-semibold">
                Average Rating: {summary.kpis.averageRating} / 5.0
              </small>
            </div>
          </Col>

          <Col md={3} sm={6}>
            <div className="bg-white p-3 rounded border shadow-sm">
              <small className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.75rem' }}>
                Net Promoter Score (NPS)
              </small>
              <div className="display-6 fw-bold text-success">{summary.kpis.npsSummary.npsScore}</div>
              <small className="text-muted">
                {summary.kpis.npsSummary.promoters} Promoters vs {summary.kpis.npsSummary.detractors} Detractors
              </small>
            </div>
          </Col>

          <Col md={3} sm={6}>
            <div className="bg-white p-3 rounded border shadow-sm">
              <small className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.75rem' }}>
                Total Grievances Registered
              </small>
              <div className="display-6 fw-bold text-warning">{summary.kpis.totalComplaints}</div>
              <small className="text-success fw-semibold">
                {summary.kpis.resolvedComplaints} Resolved & Closed
              </small>
            </div>
          </Col>

          <Col md={3} sm={6}>
            <div className="bg-white p-3 rounded border shadow-sm">
              <small className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.75rem' }}>
                SLA Escalations
              </small>
              <div className="display-6 fw-bold text-danger">{summary.kpis.escalatedComplaints}</div>
              <small className="text-danger fw-semibold">
                {summary.lowRatingAlerts?.length || 0} Low Rating Alerts (≤2★)
              </small>
            </div>
          </Col>
        </Row>
      )}

      {/* Charts Section */}
      <Row className="g-4 mb-4">
        {/* Service Wise Bar Chart */}
        <Col lg={8}>
          <Card className="es-card h-100">
            <div className="es-card-header">
              <h2 className="es-card-title h6 mb-0">Service Category Satisfaction (1 to 5 Stars)</h2>
            </div>
            <Card.Body>
              <div style={{ height: '260px' }}>
                <Bar
                  data={serviceChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: { min: 0, max: 5 },
                    },
                  }}
                />
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Complaint Status Doughnut */}
        <Col lg={4}>
          <Card className="es-card h-100">
            <div className="es-card-header">
              <h2 className="es-card-title h6 mb-0">Complaint Resolution Status</h2>
            </div>
            <Card.Body className="d-flex align-items-center justify-content-center">
              <div style={{ height: '220px', width: '220px' }}>
                <Doughnut data={complaintChartData} options={{ maintainAspectRatio: false }} />
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Date Wise Trend */}
        <Col lg={12}>
          <Card className="es-card">
            <div className="es-card-header">
              <h2 className="es-card-title h6 mb-0">Daily Rating Trend & Quality Index</h2>
            </div>
            <Card.Body>
              <div style={{ height: '220px' }}>
                <Line
                  data={dateWiseChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: { y: { min: 0, max: 5 } },
                  }}
                />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Department Summary Table */}
      <Card className="es-card mb-4">
        <div className="es-card-header">
          <h2 className="es-card-title h6 mb-0">Department Wise Feedback & Complaint Summary</h2>
        </div>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table hover className="table mb-0 align-middle">
              <thead className="table-light small text-uppercase">
                <tr>
                  <th>Department</th>
                  <th>Total Feedbacks</th>
                  <th>Average Rating (1 to 5)</th>
                  <th>Complaint Count</th>
                  <th>Action Status</th>
                </tr>
              </thead>
              <tbody>
                {summary?.departmentWise?.map((d: any) => (
                  <tr key={d.departmentId}>
                    <td className="fw-bold text-primary">{d.departmentName}</td>
                    <td>{d.feedbackCount}</td>
                    <td>
                      <Badge bg={d.averageRating >= 4 ? 'success' : d.averageRating >= 3 ? 'warning' : 'danger'}>
                        {d.averageRating} / 5.0
                      </Badge>
                    </td>
                    <td>
                      {d.complaintCount > 0 ? (
                        <span className="text-danger fw-bold">{d.complaintCount}</span>
                      ) : (
                        <span className="text-muted">0</span>
                      )}
                    </td>
                    <td>
                      {d.averageRating <= 2 && d.feedbackCount > 0 ? (
                        <Badge bg="danger">Alert: Low Rating</Badge>
                      ) : (
                        <Badge bg="success">Normal</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Low Rating Alerts Table */}
      <Card className="es-card border-danger">
        <div className="es-card-header bg-danger text-white d-flex align-items-center">
          <FaExclamationTriangle className="me-2" />
          <h2 className="es-card-title h6 mb-0 text-white">Low Rating Alerts (≤ 2 Stars) - Automatic Escalation</h2>
        </div>
        <Card.Body className="p-0">
          {summary?.lowRatingAlerts?.length === 0 ? (
            <div className="text-center py-4 text-muted">No low rating alerts. Quality is performing well!</div>
          ) : (
            <div className="table-responsive">
              <Table hover className="table mb-0 align-middle">
                <thead className="table-light small text-uppercase">
                  <tr>
                    <th>Date</th>
                    <th>Department</th>
                    <th>Patient Name</th>
                    <th>Masked Mobile</th>
                    <th>Rating</th>
                    <th>Patient Comments</th>
                  </tr>
                </thead>
                <tbody>
                  {summary?.lowRatingAlerts?.map((alert: any) => (
                    <tr key={alert.id}>
                      <td className="small text-muted">{new Date(alert.createdAt).toLocaleString()}</td>
                      <td className="fw-bold text-danger">{alert.departmentName}</td>
                      <td>{alert.patientName}</td>
                      <td className="font-monospace">{alert.mobile}</td>
                      <td>
                        <Badge bg="danger">{alert.overallEmoji} / 5 Stars</Badge>
                      </td>
                      <td className="small text-dark">{alert.comments}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};
