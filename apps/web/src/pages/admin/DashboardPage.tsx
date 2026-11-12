import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Row, Col, Spinner, Alert, Button, Badge } from 'react-bootstrap';
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
  FaMobileAlt,
  FaEye,
  FaStar,
} from 'react-icons/fa';

export const DashboardPage: React.FC = () => {
  const [dashboardStream, setDashboardStream] = useState<'ALL' | 'OPD' | 'IPD'>('ALL');

  const { data: reports, isLoading, error } = useQuery({
    queryKey: ['reports-summary'],
    queryFn: async () => {
      const res = await apiClient.get('/reports/summary');
      return res.data;
    },
  });

  const { data: recentFeedbacks, isLoading: loadingFeedbacks } = useQuery({
    queryKey: ['dashboard-recent-feedbacks'],
    queryFn: async () => {
      const res = await apiClient.get('/feedback?limit=8');
      return res.data;
    },
  });

  const feedbackItems: any[] = recentFeedbacks?.items || [];
  const filteredFeedbacks =
    dashboardStream === 'ALL'
      ? feedbackItems
      : feedbackItems.filter((f: any) =>
          dashboardStream === 'IPD'
            ? f.patientType === 'IPD' || f.department?.code === 'IPD' || (f.answers && Object.keys(f.answers).length > 10)
            : f.patientType === 'OPD' || f.department?.code === 'OPD' || !f.patientType
        );

  return (
    <div className="container-fluid py-4 px-4">
      {/* Page Title & Breadcrumb */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <div>
          <h1 className="h4 fw-bold text-dark mb-0">DHH KATAKA · Patient Feedback & Grievance System</h1>
          <small className="text-muted">
            District Head Hospital (ଜିଲ୍ଲା ମୁଖ୍ୟ ଚିକିତ୍ସାଳୟ, କଟକ) | Government of Odisha
          </small>
        </div>
        <div className="badge bg-primary px-3 py-2 fs-6">
          DHH KATAKA PORTAL
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
          <Col xs={12} sm={6} lg={3}>
            <div className="bg-white p-3 rounded border shadow-sm d-flex align-items-center h-100">
              <div className="p-3 bg-primary bg-opacity-10 text-primary rounded-circle me-3 flex-shrink-0">
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

          <Col xs={12} sm={6} lg={3}>
            <div className="bg-white p-3 rounded border shadow-sm d-flex align-items-center h-100">
              <div className="p-3 bg-success bg-opacity-10 text-success rounded-circle me-3 flex-shrink-0">
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

          <Col xs={12} sm={6} lg={3}>
            <div className="bg-white p-3 rounded border shadow-sm d-flex align-items-center h-100">
              <div className="p-3 bg-info bg-opacity-10 text-info rounded-circle me-3 flex-shrink-0">
                <FaThumbsUp size={24} />
              </div>
              <div>
                <small className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.75rem' }}>
                  OPD Submissions
                </small>
                <div className="fs-4 fw-bold text-dark">
                  {feedbackItems.filter((s: any) => s.patientType !== 'IPD' && s.department?.code !== 'IPD').length}
                </div>
                <small className="text-muted">
                  Outpatient (10 Questions)
                </small>
              </div>
            </div>
          </Col>

          <Col xs={12} sm={6} lg={3}>
            <div className="bg-white p-3 rounded border shadow-sm d-flex align-items-center h-100">
              <div className="p-3 bg-primary bg-opacity-10 text-primary rounded-circle me-3 flex-shrink-0">
                <FaThumbsUp size={24} />
              </div>
              <div>
                <small className="text-muted fw-bold text-uppercase" style={{ fontSize: '0.75rem' }}>
                  IPD Submissions
                </small>
                <div className="fs-4 fw-bold text-primary">
                  {feedbackItems.filter((s: any) => s.patientType === 'IPD' || s.department?.code === 'IPD').length}
                </div>
                <small className="text-muted">
                  Inpatient Wards (20 Questions)
                </small>
              </div>
            </div>
          </Col>
        </Row>
      ) : null}

      {/* REAL-TIME PATIENT FEEDBACK SUBMISSIONS TABLE */}
      <div className="bg-white rounded border shadow-sm p-3 mb-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
          <div>
            <h5 className="fw-bold mb-0 text-dark">
              Recent Patient Feedback Submissions · ଡାକ୍ତରଖାନା ମତାମତ
            </h5>
            <small className="text-muted">
              Live feedback from patient smartphone QR code scans across DHH KATAKA counters & wards
            </small>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <button
              className={`btn btn-sm ${dashboardStream === 'ALL' ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setDashboardStream('ALL')}
            >
              All Streams ({feedbackItems.length})
            </button>
            <button
              className={`btn btn-sm ${dashboardStream === 'OPD' ? 'btn-success' : 'btn-outline-success'}`}
              onClick={() => setDashboardStream('OPD')}
            >
              OPD Feedbacks (10 Qs)
            </button>
            <button
              className={`btn btn-sm ${dashboardStream === 'IPD' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setDashboardStream('IPD')}
            >
              IPD Ward Feedbacks (20 Qs)
            </button>
            <Link to="/admin/services/feedback-list" className="btn btn-sm btn-outline-primary">
              Full Feedback Master →
            </Link>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light small text-uppercase">
              <tr>
                <th>Date & Time</th>
                <th>Stream / Service</th>
                <th>Patient / Mobile</th>
                <th>Department / Unit</th>
                <th>Rating (Stars)</th>
                <th>NPS</th>
                <th>Remarks / Comments</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loadingFeedbacks ? (
                <tr>
                  <td colSpan={8} className="text-center py-4 text-muted">
                    <Spinner size="sm" className="me-2" /> Loading recent patient feedback submissions...
                  </td>
                </tr>
              ) : filteredFeedbacks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-4 text-muted">
                    No feedback records yet for {dashboardStream}. Click <strong>"📱 Test OPD Patient Form"</strong> or <strong>"📱 Test IPD Patient Form"</strong> above to submit a live sample feedback!
                  </td>
                </tr>
              ) : (
                filteredFeedbacks.map((f: any) => (
                  <tr key={f.id}>
                    <td>
                      <div className="fw-semibold">{new Date(f.createdAt).toLocaleDateString()}</div>
                      <small className="text-muted">
                        {new Date(f.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </small>
                    </td>
                    <td>
                      {f.patientType === 'IPD' || f.department?.code === 'IPD' || (f.answers && Object.keys(f.answers).length > 10) ? (
                        <Badge bg="primary">IPD (ଅନ୍ତଃ-ବିଭାଗ)</Badge>
                      ) : (
                        <Badge bg="success">OPD (ବହିଃ-ବିଭାଗ)</Badge>
                      )}
                    </td>
                    <td>
                      <div className="fw-semibold">{f.patientName || 'Anonymous Citizen'}</div>
                      <small className="font-monospace text-muted">{f.mobile}</small>
                      {f.crNumber && <Badge bg="light" text="dark" className="ms-1 border">{f.crNumber}</Badge>}
                    </td>
                    <td>
                      <span className="fw-semibold text-primary">{f.department?.name}</span>
                      {f.location && <small className="text-muted d-block">{f.location.name}</small>}
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <FaStar className="text-warning me-1" size={14} />
                        <strong className="me-1">{f.overallEmoji}</strong> / 5
                      </div>
                    </td>
                    <td>
                      <Badge bg={f.npsScore >= 9 ? 'success' : f.npsScore >= 7 ? 'warning' : 'danger'}>
                        {f.npsScore} / 10
                      </Badge>
                    </td>
                    <td style={{ maxWidth: '220px' }} className="text-truncate">
                      <small className="text-muted">{f.comments || 'No remarks provided'}</small>
                    </td>
                    <td>
                      <Link to="/admin/services/feedback-list" className="btn btn-outline-primary btn-sm py-0">
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3-CARD ADMIN LAYOUT (SERVICES, SETUP, REPORTS) */}
      <Row className="g-4">
        {/* CARD 1: SERVICES */}
        <Col xs={12} md={6} lg={4}>
          <MenuCard title="Services" icon={<FaQrcode />}>
            <MenuRow
              title="Generate QR Code"
              to="/admin/services/qr-generate"
              description="Create secured HMAC QR standees for OPD counters & IPD wards"
            />
            <MenuRow
              title="Bulk QR Print (A4)"
              to="/admin/services/bulk-print"
              description="Download multi-page PDF with DHH KATAKA Odia & English signage"
            />
            <MenuRow
              title="Feedback Listing"
              to="/admin/services/feedback-list"
              badge={reports?.kpis?.totalFeedbacks ?? '5'}
              badgeBg="primary"
              description="Filter by OPD (10 Qs) & IPD (20 Qs), view ratings & patient details"
            />
            <MenuRow
              title="Patient Mobile QR Form (Live)"
              to="/feedback"
              description="Direct preview of OPD (10 Qs) and IPD (20 Qs) patient mobile interface"
            />
          </MenuCard>
        </Col>

        {/* CARD 2: SETUP */}
        <Col xs={12} md={6} lg={4}>
          <MenuCard title="Setup" icon={<FaCogs />}>
            <MenuRow
              title="Feedback Question Master"
              to="/admin/setup"
              description="10 OPD & 20 IPD questions in Odia (ଓଡ଼ିଆ) and English"
            />
            <MenuRow
              title="Service Category Master"
              to="/admin/setup"
              description="OPD Consultation & Counters, IPD Inpatient Wards & Specialties"
            />
            <MenuRow
              title="QR Location Master"
              to="/admin/setup"
              description="DHH KATAKA buildings, OPD blocks, IPD wards, and counter desks"
            />
          </MenuCard>
        </Col>

        {/* CARD 3: REPORTS */}
        <Col xs={12} md={12} lg={4}>
          <MenuCard title="Reports" icon={<FaChartBar />}>
            <MenuRow
              title="OPD & IPD Feedback Summary"
              to="/admin/reports"
              description="Comparative rating score & feedback volume across OPD & IPD"
            />
            <MenuRow
              title="Service Wise Satisfaction Score"
              to="/admin/reports"
              description="Star rating performance breakdown across OPD & IPD question touchpoints"
            />
            <MenuRow
              title="Low Rating Alerts (≤ 2 Stars)"
              to="/admin/reports"
              badge={reports?.lowRatingAlerts?.length ?? '1'}
              badgeBg="danger"
              description="Automatic alerts for OPD & IPD feedback with 1 or 2 stars"
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
