import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Row, Col, Card, Form, Button, Alert, Spinner, Modal, Badge } from 'react-bootstrap';
import { apiClient } from '../../api/client';
import {
  FaQrcode,
  FaDownload,
  FaCopy,
  FaExternalLinkAlt,
  FaCheck,
  FaTrashAlt,
  FaToggleOn,
  FaToggleOff,
  FaCheckCircle,
  FaTimesCircle,
} from 'react-icons/fa';

export const QrGeneratorPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Queries
  const { data: hospitals = [] } = useQuery({
    queryKey: ['hospitals'],
    queryFn: async () => (await apiClient.get('/hospitals')).data,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => (await apiClient.get('/departments')).data,
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: async () => (await apiClient.get('/locations')).data,
  });

  const { data: qrList = [], isLoading: loadingList } = useQuery({
    queryKey: ['qr-list'],
    queryFn: async () => (await apiClient.get('/qr/list')).data,
  });

  // Form State
  const [selectedHospital, setSelectedHospital] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedLoc, setSelectedLoc] = useState('');
  const [counterName, setCounterName] = useState('');
  const [copied, setCopied] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<any>(null);

  // Catalog State: Status filter, actions, modal
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [deleteConfirmQr, setDeleteConfirmQr] = useState<any | null>(null);
  const [statusAlert, setStatusAlert] = useState<{ type: 'success' | 'danger'; message: string } | null>(null);

  // Set initial selections when data loads
  React.useEffect(() => {
    if (hospitals.length > 0 && !selectedHospital) {
      setSelectedHospital(hospitals[0].id);
    }
  }, [hospitals, selectedHospital]);

  React.useEffect(() => {
    if (departments.length > 0 && !selectedDept) {
      setSelectedDept(departments[0].id);
    }
  }, [departments, selectedDept]);

  // Generate Mutation
  const generateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.post('/qr/generate', payload);
      return res.data;
    },
    onSuccess: (data) => {
      setGeneratedResult(data);
      queryClient.invalidateQueries({ queryKey: ['qr-list'] });
    },
  });

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    generateMutation.mutate({
      hospitalId: selectedHospital,
      departmentId: selectedDept,
      locationId: selectedLoc || undefined,
      counterName: counterName || undefined,
    });
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Toggle Active/Inactive Status
  const handleToggleStatus = async (qr: any) => {
    try {
      setActionLoadingId(qr.id);
      const newStatus = !qr.isActive;
      await apiClient.patch(`/qr/${qr.id}/status`, { isActive: newStatus });
      setStatusAlert({
        type: 'success',
        message: `QR Code "${qr.code}" is now ${newStatus ? 'Active' : 'Inactive'}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['qr-list'] });
    } catch (err: any) {
      setStatusAlert({
        type: 'danger',
        message: `Failed to update status: ${err.response?.data?.message || err.message}`,
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete QR Code
  const handleConfirmDelete = async () => {
    if (!deleteConfirmQr) return;
    try {
      setActionLoadingId(deleteConfirmQr.id);
      await apiClient.delete(`/qr/${deleteConfirmQr.id}`);
      setStatusAlert({
        type: 'success',
        message: `QR Code "${deleteConfirmQr.code}" has been permanently deleted.`,
      });
      setDeleteConfirmQr(null);
      queryClient.invalidateQueries({ queryKey: ['qr-list'] });
    } catch (err: any) {
      setStatusAlert({
        type: 'danger',
        message: `Failed to delete QR code: ${err.response?.data?.message || err.message}`,
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Computed Counts and Filtered QR List
  const activeCount = useMemo(() => qrList.filter((q: any) => q.isActive).length, [qrList]);
  const inactiveCount = useMemo(() => qrList.filter((q: any) => !q.isActive).length, [qrList]);

  const filteredQrs = useMemo(() => {
    if (statusFilter === 'ACTIVE') return qrList.filter((q: any) => q.isActive);
    if (statusFilter === 'INACTIVE') return qrList.filter((q: any) => !q.isActive);
    return qrList;
  }, [qrList, statusFilter]);

  return (
    <div className="container-fluid py-4 px-2 px-md-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <div>
          <h1 className="h4 fw-bold text-dark mb-0">DHH KATAKA · Generate Patient Feedback QR Code</h1>
          <small className="text-muted">
            Generate ONE secured HMAC QR Code for both OPD (10 Qs) and IPD (20 Qs) patient feedback standees
          </small>
        </div>
        <div className="badge bg-primary px-3 py-2">District Head Hospital, Cuttack</div>
      </div>

      <Row className="g-4">
        {/* Form Column */}
        <Col xs={12} lg={6}>
          <Card className="es-card">
            <div className="es-card-header">
              <FaQrcode className="text-primary me-2" />
              <h2 className="es-card-title h6 mb-0">QR Code Parameters</h2>
            </div>
            <Card.Body className="p-3 p-md-4">
              <Form onSubmit={handleGenerate}>
                {/* One QR Code Banner */}
                <div className="p-3 bg-light rounded border border-primary border-opacity-25 mb-3">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <div className="d-flex align-items-center">
                      <span className="badge bg-primary me-2">ONE QR CODE</span>
                      <strong className="text-dark">Unified Patient Feedback (OPD + IPD)</strong>
                    </div>
                    <span className="badge bg-success">Recommended</span>
                  </div>
                  <div className="small text-muted mb-2">
                    Patients scan <strong>this ONE QR code</strong>. On their mobile phone, the screen asks them to choose <strong>OPD (Outpatient - 10 Qs)</strong> or <strong>IPD (Inpatient - 20 Qs)</strong>.
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    <span className="badge bg-success bg-opacity-10 text-success border border-success">
                      ✓ OPD · ବହିଃ-ବିଭାଗ (10 Qs)
                    </span>
                    <span className="badge bg-primary bg-opacity-10 text-primary border border-primary">
                      ✓ IPD · ଅନ୍ତଃ-ବିଭାଗ (20 Qs)
                    </span>
                    <span className="badge bg-secondary bg-opacity-10 text-dark border">
                      ✓ Odia & English Bilingual
                    </span>
                  </div>
                </div>

                {/* Hospital Selection */}
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small">Hospital</Form.Label>
                  <Form.Select
                    value={selectedHospital}
                    onChange={(e) => setSelectedHospital(e.target.value)}
                    required
                  >
                    {hospitals.map((h: any) => {
                      const cleanName = (h.name || '').replace(/\s*\([Ee][Ss][Uu][Ss][Hh][Rr][Uu][Tt][^\)]*\)/g, '').trim();
                      return (
                        <option key={h.id} value={h.id}>
                          {cleanName || 'DHH KATAKA - District Head Hospital'}
                        </option>
                      );
                    })}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small">Department / Unit</Form.Label>
                  <Form.Select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    required
                  >
                    {departments.map((d: any) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">
                    Specific Counter / Ward Location (Optional)
                  </Form.Label>
                  <Form.Select
                    value={selectedLoc}
                    onChange={(e) => setSelectedLoc(e.target.value)}
                  >
                    <option value="">-- Main Department Standee (OPD + IPD) --</option>
                    {locations
                      .filter((l: any) => !selectedDept || l.departmentId === selectedDept)
                      .map((l: any) => (
                        <option key={l.id} value={l.id}>
                          {l.name} {l.counter ? `(${l.counter})` : ''} - Floor {l.floor || 'G'}
                        </option>
                      ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold small">Counter Label / Notes</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g. Counter 3 / Reception Desk"
                    value={counterName}
                    onChange={(e) => setCounterName(e.target.value)}
                  />
                  <Form.Text className="text-muted">
                    Helps identify the specific standee placement for hospital staff
                  </Form.Text>
                </Form.Group>

                <Button
                  variant="primary"
                  type="submit"
                  disabled={generateMutation.isPending || !selectedHospital || !selectedDept}
                  className="w-100 py-2 fw-semibold d-flex align-items-center justify-content-center"
                >
                  {generateMutation.isPending ? (
                    <>
                      <Spinner size="sm" animation="border" className="me-2" />
                      Generating Secure QR Code...
                    </>
                  ) : (
                    <>
                      <FaQrcode className="me-2" />
                      Generate Secured Standee QR Code
                    </>
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Live Preview Column */}
        <Col xs={12} lg={6}>
          <Card className="es-card text-center h-100 d-flex flex-column justify-content-center">
            <div className="es-card-header text-start">
              <h2 className="es-card-title h6 mb-0">DHH KATAKA · Standee Live Preview</h2>
            </div>
            <Card.Body className="p-4 d-flex flex-column align-items-center justify-content-center">
              {generatedResult ? (
                <div className="d-flex flex-column align-items-center w-100">
                  <div
                    className="p-3 border rounded-3 bg-white shadow-sm mb-3"
                    style={{ maxWidth: '280px' }}
                  >
                    <div className="fw-bold text-primary mb-1 small">
                      DHH KATAKA · ଜିଲ୍ଲା ମୁଖ୍ୟ ଚିକିତ୍ସାଳୟ
                    </div>
                    <div
                      className="text-muted mb-2"
                      style={{ fontSize: '11px', lineHeight: '1.2' }}
                    >
                      Patient Feedback & Grievance Standee
                    </div>
                    <img
                      src={generatedResult.qrDataUrl}
                      alt="Generated Standee QR Code"
                      className="img-fluid"
                      style={{ maxHeight: '200px' }}
                    />
                    <div className="small fw-semibold mt-2 text-dark">
                      {generatedResult.code}
                    </div>
                    <div className="badge bg-light text-secondary border mt-1">
                      OPD (10 Qs) + IPD (20 Qs)
                    </div>
                  </div>

                  <div className="d-flex flex-wrap gap-2 justify-content-center">
                    <Button
                      variant={copied ? 'success' : 'outline-primary'}
                      size="sm"
                      onClick={() => handleCopyLink(generatedResult.targetUrl)}
                    >
                      {copied ? <FaCheck className="me-1" /> : <FaCopy className="me-1" />}
                      {copied ? 'Copied!' : 'Copy Form URL'}
                    </Button>
                    <a
                      href={generatedResult.qrDataUrl}
                      download={`${generatedResult.code}.png`}
                      className="btn btn-primary btn-sm"
                    >
                      <FaDownload className="me-1" /> Download PNG
                    </a>
                    <a
                      href={generatedResult.targetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-outline-secondary btn-sm"
                    >
                      <FaExternalLinkAlt className="me-1" /> Test Form
                    </a>
                  </div>
                </div>
              ) : (
                <div className="py-5 text-muted">
                  <FaQrcode size={64} className="opacity-25 mb-3" />
                  <p className="mb-0">Click "Generate Secured Standee QR Code" to preview your hospital standee.</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Previously Generated QR Codes Catalog with Delete, Active/Inactive Controls */}
      <Card className="es-card mt-4">
        <div className="es-card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
          <div>
            <h2 className="es-card-title h6 mb-0 d-flex align-items-center gap-2">
              <FaQrcode className="text-primary" />
              <span>Department QR Codes Catalog</span>
            </h2>
            <small className="text-muted">
              Manage active/inactive status and delete unused QR code standees
            </small>
          </div>
          <div className="d-flex align-items-center gap-2">
            <div className="btn-group btn-group-sm" role="group">
              <button
                type="button"
                className={`btn btn-sm ${statusFilter === 'ALL' ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setStatusFilter('ALL')}
              >
                All ({qrList.length})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${statusFilter === 'ACTIVE' ? 'btn-success' : 'btn-outline-secondary'}`}
                onClick={() => setStatusFilter('ACTIVE')}
              >
                Active ({activeCount})
              </button>
              <button
                type="button"
                className={`btn btn-sm ${statusFilter === 'INACTIVE' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                onClick={() => setStatusFilter('INACTIVE')}
              >
                Inactive ({inactiveCount})
              </button>
            </div>
          </div>
        </div>

        {statusAlert && (
          <Alert
            variant={statusAlert.type}
            className="m-3 mb-0 py-2 px-3 small d-flex justify-content-between align-items-center"
            dismissible
            onClose={() => setStatusAlert(null)}
          >
            <span>{statusAlert.message}</span>
          </Alert>
        )}

        <Card.Body className="p-0">
          {loadingList ? (
            <div className="text-center py-4 text-muted">Loading QR codes...</div>
          ) : filteredQrs.length === 0 ? (
            <div className="text-center py-4 text-muted">
              {statusFilter === 'ALL'
                ? 'No QR codes generated yet.'
                : `No ${statusFilter.toLowerCase()} QR codes found.`}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0 align-middle">
                <thead className="table-light small text-uppercase">
                  <tr>
                    <th>QR Preview</th>
                    <th>Code Identifier</th>
                    <th>Department</th>
                    <th>Location / Counter</th>
                    <th>Status</th>
                    <th>Scan Count</th>
                    <th className="text-end pe-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQrs.map((qr: any) => (
                    <tr
                      key={qr.id}
                      className={!qr.isActive ? 'table-light opacity-75' : ''}
                    >
                      <td style={{ width: '70px' }}>
                        <img
                          src={qr.qrDataUrl}
                          alt={qr.code}
                          style={{
                            width: '48px',
                            height: '48px',
                            filter: qr.isActive ? 'none' : 'grayscale(100%) opacity(0.6)',
                          }}
                          className="border rounded p-1 bg-white"
                        />
                      </td>
                      <td>
                        <div className="fw-bold text-primary small">{qr.code}</div>
                        <div className="text-muted" style={{ fontSize: '11px' }}>
                          Created {new Date(qr.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        <span className="fw-semibold">{qr.department?.name || 'Department'}</span>
                      </td>
                      <td>
                        {qr.location
                          ? `${qr.location.name} (${qr.location.counter || qr.location.floor || 'Main'})`
                          : 'General Department'}
                      </td>
                      <td>
                        {qr.isActive ? (
                          <span className="badge bg-success bg-opacity-10 text-success border border-success d-inline-flex align-items-center gap-1">
                            <FaCheckCircle size={10} /> Active
                          </span>
                        ) : (
                          <span className="badge bg-secondary bg-opacity-10 text-muted border border-secondary d-inline-flex align-items-center gap-1">
                            <FaTimesCircle size={10} /> Inactive
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          {qr.scanCount} scans
                        </span>
                      </td>
                      <td className="text-end pe-3">
                        <div className="btn-group btn-group-sm">
                          {/* Copy URL */}
                          <Button
                            variant="outline-secondary"
                            onClick={() => handleCopyLink(qr.targetUrl)}
                            title="Copy QR URL"
                          >
                            <FaCopy />
                          </Button>

                          {/* Download PNG */}
                          <a
                            href={qr.qrDataUrl}
                            download={`${qr.code}.png`}
                            className="btn btn-outline-primary"
                            title="Download PNG"
                          >
                            <FaDownload />
                          </a>

                          {/* Test / Open Form */}
                          <a
                            href={qr.targetUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-outline-info"
                            title="Open Patient Form"
                          >
                            <FaExternalLinkAlt />
                          </a>

                          {/* Toggle Active / Inactive */}
                          <Button
                            variant={qr.isActive ? 'outline-warning' : 'outline-success'}
                            onClick={() => handleToggleStatus(qr)}
                            disabled={actionLoadingId === qr.id}
                            title={qr.isActive ? 'Click to make Inactive' : 'Click to make Active'}
                            className="d-inline-flex align-items-center gap-1 px-2"
                          >
                            {actionLoadingId === qr.id ? (
                              <Spinner size="sm" animation="border" />
                            ) : qr.isActive ? (
                              <>
                                <FaToggleOn className="text-warning" />
                                <span className="d-none d-md-inline small">Deactivate</span>
                              </>
                            ) : (
                              <>
                                <FaToggleOff className="text-success" />
                                <span className="d-none d-md-inline small">Activate</span>
                              </>
                            )}
                          </Button>

                          {/* Delete */}
                          <Button
                            variant="outline-danger"
                            onClick={() => setDeleteConfirmQr(qr)}
                            disabled={actionLoadingId === qr.id}
                            title="Delete this QR Code"
                          >
                            <FaTrashAlt />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        show={!!deleteConfirmQr}
        onHide={() => setDeleteConfirmQr(null)}
        centered
        backdrop="static"
      >
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title className="h6 mb-0 d-flex align-items-center gap-2">
            <FaTrashAlt /> Confirm Delete QR Code
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <p className="mb-3">
            Are you sure you want to permanently delete this QR Code?
          </p>
          <div className="p-3 bg-light rounded border mb-3 small">
            <div className="mb-1">
              <strong>Code Identifier:</strong>{' '}
              <code className="text-primary fw-bold">{deleteConfirmQr?.code}</code>
            </div>
            <div className="mb-1">
              <strong>Department:</strong> {deleteConfirmQr?.department?.name}
            </div>
            <div className="mb-1">
              <strong>Location:</strong>{' '}
              {deleteConfirmQr?.location?.name || 'General Department'}
            </div>
            <div>
              <strong>Current Status:</strong>{' '}
              <Badge bg={deleteConfirmQr?.isActive ? 'success' : 'secondary'}>
                {deleteConfirmQr?.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
          <div className="alert alert-warning py-2 px-3 small mb-0">
            <strong>Warning:</strong> Deleting this QR code will permanently remove it from the catalog. Existing patient feedback history will remain intact.
          </div>
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button
            variant="outline-secondary"
            onClick={() => setDeleteConfirmQr(null)}
            disabled={!!actionLoadingId}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirmDelete}
            disabled={!!actionLoadingId}
            className="d-flex align-items-center gap-2"
          >
            {actionLoadingId ? (
              <>
                <Spinner size="sm" animation="border" /> Deleting...
              </>
            ) : (
              <>
                <FaTrashAlt /> Delete QR Code
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};
