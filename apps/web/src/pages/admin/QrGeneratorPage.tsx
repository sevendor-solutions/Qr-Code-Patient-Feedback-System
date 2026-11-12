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
  const [serviceType, setServiceType] = useState<'OPD' | 'IPD'>('OPD');
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
    <div className="container-fluid py-4 px-2 px-md-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <div>
          <h1 className="h4 fw-bold text-dark mb-0">DHH KATAKA · Generate Patient Feedback QR Codes</h1>
          <small className="text-muted">
            Create secured HMAC QR Codes for OPD (Outpatient - 10 Qs) & IPD (Inpatient - 20 Qs) counters & wards
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
                {/* Service Type Selection */}
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold small d-block">Patient Feedback Service Type</Form.Label>
                  <div className="btn-group w-100" role="group">
                    <button
                      type="button"
                      className={`btn ${serviceType === 'OPD' ? 'btn-teal text-white' : 'btn-outline-secondary'}`}
                      style={{ backgroundColor: serviceType === 'OPD' ? '#0f766e' : undefined }}
                      onClick={() => {
                        setServiceType('OPD');
                        const opdDept = departments.find((d: any) => d.code === 'OPD');
                        if (opdDept) setSelectedDept(opdDept.id);
                      }}
                    >
                      <strong>OPD</strong> · ବହିଃ-ବିଭାଗ (10 Questions)
                    </button>
                    <button
                      type="button"
                      className={`btn ${serviceType === 'IPD' ? 'btn-primary text-white' : 'btn-outline-secondary'}`}
                      style={{ backgroundColor: serviceType === 'IPD' ? '#4338ca' : undefined }}
                      onClick={() => {
                        setServiceType('IPD');
                        const ipdDept = departments.find((d: any) => d.code === 'IPD');
                        if (ipdDept) setSelectedDept(ipdDept.id);
                      }}
                    >
                      <strong>IPD</strong> · ଅନ୍ତଃ-ବିଭାଗ (20 Questions)
                    </button>
                  </div>
                </Form.Group>

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
                    <option value="">-- Main Standee ({serviceType}) --</option>
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
                    placeholder={
                      serviceType === 'OPD'
                        ? 'e.g. OPD Registration Desk / Room 4'
                        : 'e.g. Female Medical Ward - Bedside Standee'
                    }
                    value={counterName}
                    onChange={(e) => setCounterName(e.target.value)}
                  />
                  {/* Quick suggestion tags */}
                  <div className="d-flex flex-wrap gap-1 mt-2">
                    {(serviceType === 'OPD'
                      ? ['Registration Desk', 'Consultation Chamber', 'Niramaya Pharmacy', 'Lab / X-Ray', 'Waiting Hall']
                      : ['General Ward', 'Female Ward', 'Maternity Ward', 'Pediatric Ward', 'ICU', 'Special Cabin']
                    ).map((tag) => (
                      <span
                        key={tag}
                        className="badge bg-light text-dark border cursor-pointer"
                        style={{ cursor: 'pointer', fontSize: '0.75rem' }}
                        onClick={() => setCounterName(tag)}
                      >
                        + {tag}
                      </span>
                    ))}
                  </div>
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
                  Generate Secure {serviceType} QR Code
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
        <Col xs={12} lg={6}>
          <Card className="es-card text-center">
            <div className="es-card-header justify-content-center">
              <h2 className="es-card-title h6 mb-0">DHH KATAKA · Standee Live Preview</h2>
            </div>
            <Card.Body className="d-flex flex-column align-items-center justify-content-center p-3 p-md-4">
              {generatedResult ? (
                <div style={{ maxWidth: '320px', width: '100%' }}>
                  <div className="p-3 bg-white border border-2 border-primary rounded-3 mb-3 shadow-sm text-center">
                    <div className="bg-primary text-white p-2 rounded mb-2">
                      <div className="fw-bold fs-6">DHH KATAKA</div>
                      <div style={{ fontSize: '0.72rem' }}>District Head Hospital · କଟକ</div>
                      <div className="badge bg-warning text-dark mt-1" style={{ fontSize: '0.7rem' }}>
                        {serviceType === 'OPD' ? 'OPD (ବହିଃ-ବିଭାଗ 10 Qs)' : 'IPD (ଅନ୍ତଃ-ବିଭାଗ 20 Qs)'}
                      </div>
                    </div>

                    <img
                      src={generatedResult.qrDataUrl}
                      alt="Generated QR Code"
                      style={{ width: '180px', height: '180px' }}
                      className="border p-1 bg-light rounded"
                    />

                    <div className="small fw-bold text-dark mt-2">
                      {counterName || (serviceType === 'OPD' ? 'OPD Main Counter' : 'Inpatient Ward')}
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                      Scan using any smartphone camera
                    </div>
                  </div>

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

                  <div className="d-flex flex-wrap gap-2 justify-content-center">
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
                      download={`DHH-KATAKA-${serviceType}-${generatedResult.code}.png`}
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
                  <p className="mb-0">Choose OPD or IPD parameters and click "Generate Secure QR Code" to preview.</p>
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
