import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Row, Col, Form, Button, Modal, Badge, Spinner, Alert } from 'react-bootstrap';
import { apiClient } from '../../api/client';
import { DataTable, Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ComplaintStatus, ComplaintPriority } from '@esushrut/shared';
import {
  FaExclamationCircle,
  FaEdit,
  FaUserCheck,
  FaClock,
  FaHistory,
  FaImage,
} from 'react-icons/fa';

export const ComplaintsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedDept, setSelectedDept] = useState('');

  // Selected ticket for modal
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [newStatus, setNewStatus] = useState<ComplaintStatus>(ComplaintStatus.IN_PROGRESS);
  const [assignedUserId, setAssignedUserId] = useState('');
  const [remarks, setRemarks] = useState('');

  // Queries
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => (await apiClient.get('/departments')).data,
  });

  const { data: officers = [] } = useQuery({
    queryKey: ['officers'],
    queryFn: async () => (await apiClient.get('/users')).data,
  });

  const { data: complaintsData, isLoading } = useQuery({
    queryKey: ['complaints', page, search, statusFilter, selectedDept],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (selectedDept) params.append('departmentId', selectedDept);
      const res = await apiClient.get(`/complaints?${params.toString()}`);
      return res.data;
    },
  });

  // Detailed Ticket Query when modal opens
  const { data: ticketDetails, refetch: refetchTicket } = useQuery({
    queryKey: ['complaint-detail', selectedTicket?.id],
    queryFn: async () => {
      if (!selectedTicket?.id) return null;
      const res = await apiClient.get(`/complaints/${selectedTicket.id}`);
      return res.data;
    },
    enabled: !!selectedTicket?.id,
  });

  // Status Update Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiClient.patch(`/complaints/${id}/status`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      queryClient.invalidateQueries({ queryKey: ['reports-summary'] });
      refetchTicket();
      setRemarks('');
      setSelectedTicket(null);
    },
  });

  const handleOpenModal = (ticket: any) => {
    setSelectedTicket(ticket);
    setNewStatus(ticket.status);
    setAssignedUserId(ticket.assignedToId || '');
    setRemarks('');
  };

  const handleUpdateStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || remarks.trim().length < 3) return;

    updateMutation.mutate({
      id: selectedTicket.id,
      data: {
        status: newStatus,
        assignedToId: assignedUserId || undefined,
        remarks: remarks.trim(),
      },
    });
  };

  const columns: Column<any>[] = [
    {
      header: 'Ticket ID',
      render: (row) => (
        <div>
          <span className="fw-bold font-monospace text-primary">{row.ticketId}</span>
          <div className="small text-muted">{new Date(row.createdAt).toLocaleDateString()}</div>
        </div>
      ),
    },
    {
      header: 'Department / Category',
      render: (row) => (
        <div>
          <div className="fw-semibold text-dark">{row.department?.name}</div>
          <small className="badge bg-light text-dark border">{row.category?.nameEn}</small>
        </div>
      ),
    },
    {
      header: 'Patient Details',
      render: (row) => (
        <div>
          <div className="fw-semibold">{row.patientName || 'Anonymous Patient'}</div>
          <small className="font-monospace text-muted">{row.mobile}</small>
          {row.crNumber && <div className="small text-muted">CR: {row.crNumber}</div>}
        </div>
      ),
    },
    {
      header: 'Priority',
      render: (row) => (
        <Badge bg={row.priority === ComplaintPriority.URGENT ? 'danger' : 'secondary'}>
          {row.priority}
        </Badge>
      ),
    },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Assigned Officer',
      render: (row) => (
        <small className="fw-semibold text-muted">
          {row.assignedTo ? row.assignedTo.fullName : <span className="opacity-50">Unassigned</span>}
        </small>
      ),
    },
    {
      header: 'Action',
      render: (row) => (
        <Button
          variant="outline-primary"
          size="sm"
          onClick={() => handleOpenModal(row)}
        >
          <FaEdit className="me-1" /> Manage
        </Button>
      ),
    },
  ];

  return (
    <div className="container-fluid py-4 px-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="h4 fw-bold text-dark mb-0">Query & Complaint Redressal Management</h1>
          <small className="text-muted">
            Track, assign, update SLA resolution status, and communicate remarks to patients
          </small>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="es-card mb-3 p-3">
        <Row className="g-2">
          <Col md={3}>
            <Form.Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              size="sm"
            >
              <option value="">-- All Grievance Statuses --</option>
              <option value={ComplaintStatus.OPEN}>OPEN</option>
              <option value={ComplaintStatus.IN_PROGRESS}>IN PROGRESS</option>
              <option value={ComplaintStatus.RESOLVED}>RESOLVED</option>
              <option value={ComplaintStatus.ESCALATED}>ESCALATED</option>
              <option value={ComplaintStatus.CLOSED}>CLOSED</option>
            </Form.Select>
          </Col>

          <Col md={4}>
            <Form.Select
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setPage(1);
              }}
              size="sm"
            >
              <option value="">-- All Departments --</option>
              {departments.map((d: any) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </Form.Select>
          </Col>

          <Col md={2}>
            {(statusFilter || selectedDept || search) && (
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={() => {
                  setStatusFilter('');
                  setSelectedDept('');
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

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={complaintsData?.items || []}
        total={complaintsData?.total || 0}
        page={page}
        limit={10}
        onPageChange={setPage}
        searchTerm={search}
        onSearchChange={(term) => {
          setSearch(term);
          setPage(1);
        }}
        searchPlaceholder="Search by ticket ID, patient, mobile, description..."
        loading={isLoading}
      />

      {/* Ticket Action & Timeline Modal */}
      {selectedTicket && (
        <Modal show={true} onHide={() => setSelectedTicket(null)} size="lg" centered>
          <Modal.Header closeButton className="bg-primary text-white py-2">
            <Modal.Title className="h6 fw-bold mb-0">
              Manage Ticket {selectedTicket.ticketId}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div className="p-3 bg-light rounded border mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="fw-bold fs-5 text-primary">{selectedTicket.ticketId}</span>
                <StatusBadge status={ticketDetails?.status || selectedTicket.status} />
              </div>
              <p className="small mb-1">
                <strong>Description:</strong> {ticketDetails?.description || selectedTicket.description}
              </p>
              {ticketDetails?.photoUrl && (
                <div className="mt-2">
                  <a
                    href={ticketDetails.photoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-outline-info btn-sm"
                  >
                    <FaImage className="me-1" /> View Attached Photo
                  </a>
                </div>
              )}
            </div>

            {/* Action Form */}
            <Form onSubmit={handleUpdateStatus} className="border p-3 rounded mb-3 bg-white">
              <h6 className="fw-bold text-dark mb-3">Update Resolution Status & Remarks</h6>

              <Row className="g-2 mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Change Status</Form.Label>
                    <Form.Select
                      id="modal-update-status"
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as ComplaintStatus)}
                      required
                    >
                      <option value={ComplaintStatus.OPEN}>OPEN</option>
                      <option value={ComplaintStatus.IN_PROGRESS}>IN PROGRESS</option>
                      <option value={ComplaintStatus.RESOLVED}>RESOLVED</option>
                      <option value={ComplaintStatus.ESCALATED}>ESCALATED</option>
                      <option value={ComplaintStatus.CLOSED}>CLOSED</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group>
                    <Form.Label className="small fw-bold">Assign Officer</Form.Label>
                    <Form.Select
                      value={assignedUserId}
                      onChange={(e) => setAssignedUserId(e.target.value)}
                    >
                      <option value="">-- Select Grievance Officer --</option>
                      {officers.map((u: any) => (
                        <option key={u.id} value={u.id}>
                          {u.fullName} ({u.role})
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold">
                  Official Action Remarks / Resolution Note <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Explain actions taken (sent to patient via SMS confirmation)..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  required
                />
              </Form.Group>

              <Button
                type="submit"
                variant="primary"
                className="es-touch-btn w-100"
                disabled={updateMutation.isPending || remarks.trim().length < 3}
              >
                {updateMutation.isPending ? (
                  <Spinner size="sm" className="me-2" />
                ) : (
                  <FaUserCheck className="me-2" />
                )}
                Save Status & Dispatch SMS Update to Patient
              </Button>
            </Form>

            {/* Audit History Timeline */}
            <h6 className="fw-bold text-dark mb-2 d-flex align-items-center">
              <FaHistory className="me-2 text-primary" /> Audit History & Chronological Log
            </h6>
            <div className="timeline ps-2 border-start border-2 border-primary ms-2">
              {ticketDetails?.histories?.map((h: any, idx: number) => (
                <div key={idx} className="mb-3 position-relative ps-3">
                  <div
                    className="position-absolute bg-primary rounded-circle"
                    style={{ width: '8px', height: '8px', left: '-5px', top: '6px' }}
                  />
                  <div className="d-flex justify-content-between align-items-center">
                    <StatusBadge status={h.toStatus} />
                    <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                      {new Date(h.createdAt).toLocaleString()}
                    </small>
                  </div>
                  <div className="small text-muted mt-1">
                    By: <strong>{h.actionByUser ? h.actionByUser.fullName : 'System / Citizen'}</strong>
                  </div>
                  <p className="small mb-0 mt-1 bg-light p-2 rounded border">{h.actionRemarks}</p>
                </div>
              ))}
            </div>
          </Modal.Body>
          <Modal.Footer className="py-1">
            <Button variant="secondary" size="sm" onClick={() => setSelectedTicket(null)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
};
