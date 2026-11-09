import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { apiClient } from '../../api/client';
import { FaQrcode, FaDownload, FaCopy, FaExternalLinkAlt, FaCheck } from 'react-icons/fa';

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

  return (
    <div className="container-fluid py-4 px-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="h4 fw-bold text-dark mb-0">Generate Department QR Codes</h1>
          <small className="text-muted">
            Create tamper-proof HMAC-secured QR Codes for patient counters & wards
          </small>
        </div>
      </div>

      <Row className="g-4">
        {/* Form Column */}
        <Col lg={6}>
          <Card className="es-card">
            <div className="es-card-header">
              <FaQrcode className="text-primary me-2" />
              <h2 className="es-card-title h6 mb-0">QR Code Parameters</h2>
            </div>
            <Card.Body>
              <Form onSubmit={handleGenerate}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small">Hospital</Form.Label>
                  <Form.Select
                    value={selectedHospital}
                    onChange={(e) => setSelectedHospital(e.target.value)}
                    required
                  >
                    {hospitals.map((h: any) => (
                      <option key={h.id} value={h.id}>
                        {h.name} ({h.code})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small">Hospital Department</Form.Label>
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
                    <option value="">-- Main Department Standee --</option>
                    {locations
                      .filter((l: any) => !selectedDept || l.departmentId === selectedDept)
                      .map((loc: any) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name} - {loc.ward || loc.counter || loc.floor}
                        </option>
                      ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">Counter Label / Notes</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g. Counter 3 - Blood Collection Desk"
                    value={counterName}
                    onChange={(e) => setCounterName(e.target.value)}
                  />
                </Form.Group>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-100 es-touch-btn"
                  disabled={generateMutation.isPending}
                >
                  {generateMutation.isPending ? (
                    <Spinner size="sm" className="me-2" />
                  ) : (
                    <FaQrcode className="me-2" />
                  )}
                  Generate Secure QR Code
                </Button>
              </Form>

              {generateMutation.isError && (
                <Alert variant="danger" className="mt-3 small">
                  {(generateMutation.error as any)?.response?.data?.message ||
                    'Failed to generate QR Code'}
                </Alert>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Preview Column */}
        <Col lg={6}>
          <Card className="es-card text-center">
            <div className="es-card-header justify-content-center">
              <h2 className="es-card-title h6 mb-0">QR Code Live Preview</h2>
            </div>
            <Card.Body className="d-flex flex-column align-items-center justify-content-center p-4">
              {generatedResult ? (
                <div>
                  <div className="p-3 bg-light border rounded-3 mb-3 d-inline-block shadow-sm">
                    <img
                      src={generatedResult.qrDataUrl}
                      alt="Generated QR Code"
                      style={{ width: '220px', height: '220px' }}
                    />
                  </div>
                  <h3 className="h6 fw-bold text-primary mb-1">{generatedResult.code}</h3>
                  <small className="text-muted d-block mb-3">
                    Target: {generatedResult.department?.name}
                  </small>

                  <div className="p-2 bg-light rounded border text-break small mb-3 text-start">
                    <strong>URL: </strong>
                    <a
                      href={generatedResult.targetUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-decoration-none"
                    >
                      {generatedResult.targetUrl}
                    </a>
                  </div>

                  <div className="d-flex gap-2 justify-content-center">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handleCopyLink(generatedResult.targetUrl)}
                    >
                      {copied ? <FaCheck className="me-1 text-success" /> : <FaCopy className="me-1" />}
                      {copied ? 'Copied' : 'Copy URL'}
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
                      <FaExternalLinkAlt className="me-1" /> Test Link
                    </a>
                  </div>
                </div>
              ) : (
                <div className="py-5 text-muted">
                  <FaQrcode size={64} className="opacity-25 mb-3" />
                  <p className="mb-0">Select hospital parameters and click "Generate Secure QR Code" to preview.</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Previously Generated QR Codes */}
      <Card className="es-card mt-4">
        <div className="es-card-header d-flex justify-content-between align-items-center">
          <h2 className="es-card-title h6 mb-0">Active Department QR Codes Catalog</h2>
          <small className="text-muted">{qrList.length} Active Codes</small>
        </div>
        <Card.Body className="p-0">
          {loadingList ? (
            <div className="text-center py-4 text-muted">Loading QR codes...</div>
          ) : qrList.length === 0 ? (
            <div className="text-center py-4 text-muted">No QR codes generated yet.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0 align-middle">
                <thead className="table-light small text-uppercase">
                  <tr>
                    <th>QR Preview</th>
                    <th>Code Identifier</th>
                    <th>Department</th>
                    <th>Location / Counter</th>
                    <th>Scan Count</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {qrList.map((qr: any) => (
                    <tr key={qr.id}>
                      <td style={{ width: '80px' }}>
                        <img
                          src={qr.qrDataUrl}
                          alt={qr.code}
                          style={{ width: '50px', height: '50px' }}
                          className="border rounded"
                        />
                      </td>
                      <td className="fw-bold text-primary small">{qr.code}</td>
                      <td>{qr.department?.name}</td>
                      <td>
                        {qr.location
                          ? `${qr.location.name} (${qr.location.counter || qr.location.floor})`
                          : 'General Department'}
                      </td>
                      <td>
                        <span className="badge bg-secondary">{qr.scanCount} scans</span>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <Button
                            variant="outline-secondary"
                            onClick={() => handleCopyLink(qr.targetUrl)}
                            title="Copy QR URL"
                          >
                            <FaCopy />
                          </Button>
                          <a
                            href={qr.qrDataUrl}
                            download={`${qr.code}.png`}
                            className="btn btn-outline-primary"
                            title="Download PNG"
                          >
                            <FaDownload />
                          </a>
                          <a
                            href={qr.targetUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-outline-success"
                            title="Open Patient Form"
                          >
                            <FaExternalLinkAlt />
                          </a>
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
    </div>
  );
};
