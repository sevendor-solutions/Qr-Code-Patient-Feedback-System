import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, Tab, Card, Table, Button, Form, Row, Col, Badge, Modal, Spinner, Alert } from 'react-bootstrap';
import { apiClient } from '../../api/client';
import {
  FaCogs,
  FaQuestionCircle,
  FaBoxes,
  FaLevelUpAlt,
  FaMapMarkerAlt,
  FaPlus,
  FaPlay,
} from 'react-icons/fa';

export const MastersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('questions');
  const [cronAlert, setCronAlert] = useState<string | null>(null);

  // Queries
  const { data: questions = [], isLoading: loadingQuestions } = useQuery({
    queryKey: ['questions-all'],
    queryFn: async () => (await apiClient.get('/questions?all=true')).data,
  });

  const { data: categories = [], isLoading: loadingCategories } = useQuery({
    queryKey: ['categories-all'],
    queryFn: async () => (await apiClient.get('/categories?all=true')).data,
  });

  const { data: escalations = [], isLoading: loadingEscalations } = useQuery({
    queryKey: ['escalation-all'],
    queryFn: async () => (await apiClient.get('/escalation')).data,
  });

  const { data: locations = [], isLoading: loadingLocations } = useQuery({
    queryKey: ['locations-all'],
    queryFn: async () => (await apiClient.get('/locations')).data,
  });

  // Manual SLA Cron Trigger Mutation
  const cronMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/escalation/run-cron');
      return res.data;
    },
    onSuccess: (data) => {
      setCronAlert(
        `SLA Auto-escalation triggered successfully. Breached tickets evaluated: ${data.processedCount} (${data.escalatedTickets.join(', ') || 'No tickets currently breached'})`,
      );
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      queryClient.invalidateQueries({ queryKey: ['reports-summary'] });
    },
  });

  return (
    <div className="container-fluid py-4 px-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="h4 fw-bold text-dark mb-0">System Master Configuration & Setup</h1>
          <small className="text-muted">
            Manage feedback question catalogs, hospital service categories, SLA escalation matrix & QR counters
          </small>
        </div>
        <Button
          variant="outline-danger"
          size="sm"
          className="fw-bold"
          onClick={() => cronMutation.mutate()}
          disabled={cronMutation.isPending}
        >
          {cronMutation.isPending ? <Spinner size="sm" className="me-1" /> : <FaPlay className="me-1" />}
          Trigger SLA Auto-Escalation Cron Now
        </Button>
      </div>

      {cronAlert && (
        <Alert variant="info" dismissible onClose={() => setCronAlert(null)}>
          {cronAlert}
        </Alert>
      )}

      <Card className="es-card">
        <Card.Body className="p-3">
          <Tabs
            id="masters-tabs"
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k || 'questions')}
            className="mb-3"
          >
            {/* TAB 1: QUESTION MASTER */}
            <Tab
              eventKey="questions"
              title={
                <span>
                  <FaQuestionCircle className="me-1" /> Feedback Question Master ({questions.length})
                </span>
              }
            >
              <div className="table-responsive">
                <Table hover className="align-middle">
                  <thead className="table-light small text-uppercase">
                    <tr>
                      <th>Order</th>
                      <th>Category</th>
                      <th>English Question</th>
                      <th>తెలుగు (Telugu) Question</th>
                      <th>हिंदी (Hindi) Question</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingQuestions ? (
                      <tr>
                        <td colSpan={6} className="text-center py-4 text-muted">
                          Loading questions...
                        </td>
                      </tr>
                    ) : (
                      questions.map((q: any) => (
                        <tr key={q.id}>
                          <td className="fw-bold">{q.displayOrder}</td>
                          <td>
                            <Badge bg="primary">{q.category}</Badge>
                          </td>
                          <td className="fw-semibold">{q.questionEn}</td>
                          <td className="text-secondary small">{q.questionTe}</td>
                          <td className="text-secondary small">{q.questionHi}</td>
                          <td>
                            <Badge bg={q.isActive ? 'success' : 'secondary'}>
                              {q.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </Tab>

            {/* TAB 2: SERVICE CATEGORY MASTER */}
            <Tab
              eventKey="categories"
              title={
                <span>
                  <FaBoxes className="me-1" /> Service Categories ({categories.length})
                </span>
              }
            >
              <div className="table-responsive">
                <Table hover className="align-middle">
                  <thead className="table-light small text-uppercase">
                    <tr>
                      <th>Code</th>
                      <th>English Name</th>
                      <th>Telugu Name</th>
                      <th>Hindi Name</th>
                      <th>Scope / Description</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingCategories ? (
                      <tr>
                        <td colSpan={6} className="text-center py-4 text-muted">
                          Loading categories...
                        </td>
                      </tr>
                    ) : (
                      categories.map((c: any) => (
                        <tr key={c.id}>
                          <td className="fw-bold font-monospace text-primary">{c.code}</td>
                          <td className="fw-semibold">{c.nameEn}</td>
                          <td className="small text-muted">{c.nameTe}</td>
                          <td className="small text-muted">{c.nameHi}</td>
                          <td className="small text-muted">{c.description || 'General Service Area'}</td>
                          <td>
                            <Badge bg={c.isActive ? 'success' : 'secondary'}>
                              {c.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </Tab>

            {/* TAB 3: ESCALATION MATRIX */}
            <Tab
              eventKey="escalation"
              title={
                <span>
                  <FaLevelUpAlt className="me-1" /> Escalation Matrix ({escalations.length})
                </span>
              }
            >
              <div className="table-responsive">
                <Table hover className="align-middle">
                  <thead className="table-light small text-uppercase">
                    <tr>
                      <th>Department</th>
                      <th>Escalation Level</th>
                      <th>SLA Target</th>
                      <th>Designated Officer</th>
                      <th>Designation / Role</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingEscalations ? (
                      <tr>
                        <td colSpan={6} className="text-center py-4 text-muted">
                          Loading escalation matrix...
                        </td>
                      </tr>
                    ) : (
                      escalations.map((e: any) => (
                        <tr key={e.id}>
                          <td className="fw-bold text-primary">{e.department?.name}</td>
                          <td>
                            <Badge bg="warning" text="dark">
                              Level {e.level}
                            </Badge>
                          </td>
                          <td className="fw-bold">{e.slaHours} Hours</td>
                          <td className="fw-semibold">{e.escalateToUser?.fullName}</td>
                          <td>
                            <Badge bg="info">{e.escalateToUser?.role}</Badge>
                          </td>
                          <td>
                            <Badge bg={e.isActive ? 'success' : 'secondary'}>
                              {e.isActive ? 'Enforced' : 'Disabled'}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </Tab>

            {/* TAB 4: QR LOCATIONS */}
            <Tab
              eventKey="locations"
              title={
                <span>
                  <FaMapMarkerAlt className="me-1" /> QR Locations ({locations.length})
                </span>
              }
            >
              <div className="table-responsive">
                <Table hover className="align-middle">
                  <thead className="table-light small text-uppercase">
                    <tr>
                      <th>Location / Counter Name</th>
                      <th>Department</th>
                      <th>Floor</th>
                      <th>Ward</th>
                      <th>Desk / Counter</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingLocations ? (
                      <tr>
                        <td colSpan={6} className="text-center py-4 text-muted">
                          Loading locations...
                        </td>
                      </tr>
                    ) : (
                      locations.map((loc: any) => (
                        <tr key={loc.id}>
                          <td className="fw-bold">{loc.name}</td>
                          <td className="text-primary">{loc.department?.name}</td>
                          <td>{loc.floor || 'Ground'}</td>
                          <td>{loc.ward || 'General'}</td>
                          <td>
                            <Badge bg="secondary">{loc.counter || 'Main Desk'}</Badge>
                          </td>
                          <td>
                            <Badge bg={loc.isActive ? 'success' : 'secondary'}>Active</Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </div>
  );
};
