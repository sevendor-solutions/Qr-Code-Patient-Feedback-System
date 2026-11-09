import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Row, Col, Spinner, Alert } from 'react-bootstrap';
import { apiClient } from '../../api/client';
import { MenuCard } from '../../components/common/MenuCard';
import { MenuRow } from '../../components/common/MenuRow';
import {
  FaCogs,
  FaQrcode,
  FaPrint,
  FaListAlt,
  FaExclamationTriangle,
  FaChartBar,
  FaHospitalUser,
  FaClock,
  FaThumbsUp,
  FaFileAlt,
  FaMapMarkerAlt,
} from 'react-icons/fa';

export const DashboardPage: React.FC = () => {
  const { data: reports, isLoading, error } = useQuery({
    queryKey: ['reports-summary'],
    queryFn: async () => {
      const res = await apiClient.get('/reports/summary');
      return res.data;
    },
  });

  return (
    <div className="container-fluid py-4 px-4">
      {/* Page Title & Breadcrumb */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="h4 fw-bold text-dark mb-0">Patient Feedback & Grievance Monitoring System</h1>
          <small className="text-muted">
            eSushrut G5 Module | Centre for Development of Advanced Computing (C-DAC)
          </small>
        </div>
        <div className="badge bg-primary px-3 py-2 fs-6">
          eSushrut G5 Release
        </div>
      </div>

      {/* KPI Stats Bar */}
      {isLoading ? (
        <div className="text-center py-3">
          <Spinner animation="border" size="sm" variant="primary" /> Loading metrics...
        </div>
      ) : error ? (
        <Alert variant="warning" className="small">
          Unable to fetch real-time KPIs. Showing master menu options.
        </Alert>
      ) : reports?.kpis ? (
        <Row className="g-3 mb-4">
          <Col md={3} sm={6}>
            <div className="bg-white p-3 rounded border shadow-sm d-flex align-items-center">
              <div className="p-3 bg-primary bg-opacity-10 text-primary rounded-circle me-3">
                <FaThumbsUp size={24} />
              </div>
              <div>
                <small className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.75rem' }}>
                  Total Feedbacks
                </small>
                <div className="fs-4 fw-bold text-dark">{reports.kpis.totalFeedbacks}</div>
                <small className="text-success fw-semibold">
                  Avg Rating: {reports.kpis.averageRating} / 5.0
                </small>
              </div>
            </div>
          </Col>

          <Col md={3} sm={6}>
            <div className="bg-white p-3 rounded border shadow-sm d-flex align-items-center">
              <div className="p-3 bg-success bg-opacity-10 text-success rounded-circle me-3">
                <FaChartBar size={24} />
              </div>
              <div>
                <small className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.75rem' }}>
                  Net Promoter Score
                </small>
                <div className="fs-4 fw-bold text-success">{reports.kpis.npsSummary.npsScore}</div>
                <small className="text-muted">
                  {reports.kpis.npsSummary.promoters} Promoters | {reports.kpis.npsSummary.detractors} Detractors
                </small>
              </div>
            </div>
          </Col>

          <Col md={3} sm={6}>
            <div className="bg-white p-3 rounded border shadow-sm d-flex align-items-center">
              <div className="p-3 bg-warning bg-opacity-10 text-warning rounded-circle me-3">
                <FaClock size={24} />
              </div>
              <div>
                <small className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.75rem' }}>
                  Open Grievances
                </small>
                <div className="fs-4 fw-bold text-warning">{reports.kpis.openComplaints}</div>
                <small className="text-muted">
                  Resolved: {reports.kpis.resolvedComplaints}
                </small>
              </div>
            </div>
          </Col>

          <Col md={3} sm={6}>
            <div className="bg-white p-3 rounded border shadow-sm d-flex align-items-center">
              <div className="p-3 bg-danger bg-opacity-10 text-danger rounded-circle me-3">
                <FaExclamationTriangle size={24} />
              </div>
              <div>
                <small className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.75rem' }}>
                  SLA Escalated
                </small>
                <div className="fs-4 fw-bold text-danger">{reports.kpis.escalatedComplaints}</div>
                <small className="text-danger fw-semibold">
                  Low Rating Alerts: {reports.lowRatingAlerts.length}
                </small>
              </div>
            </div>
          </Col>
        </Row>
      ) : null}

      {/* 3-CARD ADMIN LAYOUT (SERVICES, SETUP, REPORTS) */}
      <Row className="g-4">
        {/* CARD 1: SERVICES */}
        <Col lg={4} md={6}>
          <MenuCard title="Services" icon={<FaQrcode />}>
            <MenuRow
              title="Generate QR Code"
              to="/admin/services/qr-generate"
              description="Create secured HMAC QR standees for hospital, wards & counters"
            />
            <MenuRow
              title="Bulk QR Print (A4)"
              to="/admin/services/bulk-print"
              description="Download multi-page PDF with Telugu/Hindi signage for department display"
            />
            <MenuRow
              title="Feedback Listing"
              to="/admin/services/feedback-list"
              badge={reports?.kpis?.totalFeedbacks ?? '5'}
              badgeBg="primary"
              description="Search, filter, view ratings & masked patient contact logs"
            />
            <MenuRow
              title="Query & Complaint Management"
              to="/admin/services/complaints"
              badge={reports?.kpis?.openComplaints ?? '2'}
              badgeBg="danger"
              description="Assign grievance officers, update ticket status, SLA remarks"
            />
          </MenuCard>
        </Col>

        {/* CARD 2: SETUP */}
        <Col lg={4} md={6}>
          <MenuCard title="Setup" icon={<FaCogs />}>
            <MenuRow
              title="Feedback Question Master"
              to="/admin/setup"
              description="Configure 9 rating questions in English, Telugu and Hindi"
            />
            <MenuRow
              title="Service Category Master"
              to="/admin/setup"
              description="OPD, IPD, Emergency, Lab, Pharmacy, Billing, Sanitation, Parking"
            />
            <MenuRow
              title="Escalation Matrix (SLA)"
              to="/admin/setup"
              description="Define multi-tier SLA hours, designated nodal officers and auto-escalation"
            />
            <MenuRow
              title="QR Location Master"
              to="/admin/setup"
              description="Manage hospital buildings, floors, wards, and counter desks"
            />
          </MenuCard>
        </Col>

        {/* CARD 3: REPORTS */}
        <Col lg={4} md={12}>
          <MenuCard title="Reports" icon={<FaChartBar />}>
            <MenuRow
              title="Department Wise Feedback Summary"
              to="/admin/reports"
              description="Comparative rating score & feedback volume across departments"
            />
            <MenuRow
              title="Service Wise Satisfaction Score"
              to="/admin/reports"
              description="Star rating performance breakdown across 9 key hospital touchpoints"
            />
            <MenuRow
              title="Complaint Status & SLA Escalations"
              to="/admin/reports"
              description="Open, In Progress, Resolved, Escalated and Closed grievance tracking"
            />
            <MenuRow
              title="Low Rating Alerts (≤ 2 Stars)"
              to="/admin/reports"
              badge={reports?.lowRatingAlerts?.length ?? '1'}
              badgeBg="danger"
              description="Automatic alerts dispatched to department heads for urgent redressal"
            />
            <MenuRow
              title="NPS Trend & Excel / PDF Export"
              to="/admin/reports"
              description="Download complete official audit reports in Excel (.xlsx) and PDF"
            />
          </MenuCard>
        </Col>
      </Row>
    </div>
  );
};
