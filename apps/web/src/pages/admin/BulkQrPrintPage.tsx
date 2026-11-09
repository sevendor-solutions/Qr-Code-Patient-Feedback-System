import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { apiClient } from '../../api/client';
import { FaPrint, FaFilePdf, FaCheckSquare, FaHospital, FaDownload } from 'react-icons/fa';

export const BulkQrPrintPage: React.FC = () => {
  const { data: hospitals = [] } = useQuery({
    queryKey: ['hospitals'],
    queryFn: async () => (await apiClient.get('/hospitals')).data,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => (await apiClient.get('/departments')).data,
  });

  const [selectedHospital, setSelectedHospital] = useState('');
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [includeTelugu, setIncludeTelugu] = useState(true);
  const [includeHindi, setIncludeHindi] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (hospitals.length > 0 && !selectedHospital) {
      setSelectedHospital(hospitals[0].id);
    }
  }, [hospitals, selectedHospital]);

  React.useEffect(() => {
    if (departments.length > 0 && selectedDepts.length === 0) {
      setSelectedDepts(departments.map((d: any) => d.id));
    }
  }, [departments, selectedDepts]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedDepts(departments.map((d: any) => d.id));
    } else {
      setSelectedDepts([]);
    }
  };

  const handleToggleDept = (deptId: string) => {
    setSelectedDepts((prev) =>
      prev.includes(deptId) ? prev.filter((id) => id !== deptId) : [...prev, deptId],
    );
  };

  const handleDownloadPdf = async () => {
    if (selectedDepts.length === 0) {
      setErrorMsg('Please select at least one department for bulk QR printing.');
      return;
    }

    setDownloading(true);
    setErrorMsg(null);

    try {
      const response = await apiClient.post(
        '/qr/bulk-print',
        {
          hospitalId: selectedHospital,
          departmentIds: selectedDepts,
          includeTelugu,
          includeHindi,
        },
        { responseType: 'blob' },
      );

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'esushrut-department-qr-standees.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setErrorMsg('Failed to generate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="container-fluid py-4 px-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="h4 fw-bold text-dark mb-0">Bulk QR Code Print Sheet (A4 Standees)</h1>
          <small className="text-muted">
            Export ready-to-print high-resolution multi-page A4 PDF with multilingual signage
          </small>
        </div>
      </div>

      {errorMsg && (
        <Alert variant="danger" dismissible onClose={() => setErrorMsg(null)}>
          {errorMsg}
        </Alert>
      )}

      <Row className="g-4">
        {/* Controls Column */}
        <Col lg={7}>
          <Card className="es-card">
            <div className="es-card-header">
              <FaPrint className="text-primary me-2" />
              <h2 className="es-card-title h6 mb-0">Bulk Print Configuration</h2>
            </div>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label className="fw-bold small">Hospital</Form.Label>
                <Form.Select
                  value={selectedHospital}
                  onChange={(e) => setSelectedHospital(e.target.value)}
                >
                  {hospitals.map((h: any) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              {/* Multilingual Options */}
              <div className="p-3 bg-light rounded border mb-3">
                <span className="fw-bold small d-block mb-2">Multilingual Text Signage</span>
                <div className="d-flex gap-4">
                  <Form.Check
                    type="checkbox"
                    id="include-telugu"
                    label="Include Telugu (మీ అభిప్రాయాన్ని తెలియజేయడానికి స్కాన్ చేయండి)"
                    checked={includeTelugu}
                    onChange={(e) => setIncludeTelugu(e.target.checked)}
                  />
                  <Form.Check
                    type="checkbox"
                    id="include-hindi"
                    label="Include Hindi (प्रतिक्रिया देने के लिए स्कैन करें)"
                    checked={includeHindi}
                    onChange={(e) => setIncludeHindi(e.target.checked)}
                  />
                </div>
              </div>

              {/* Department Checkboxes */}
              <div className="d-flex justify-content-between align-items-center mb-2">
                <Form.Check
                  type="checkbox"
                  id="select-all"
                  label={<strong>Select All Departments ({selectedDepts.length} of {departments.length} selected)</strong>}
                  checked={selectedDepts.length === departments.length && departments.length > 0}
                  onChange={handleSelectAll}
                />
              </div>

              <div
                className="p-3 border rounded bg-white overflow-auto mb-3"
                style={{ maxHeight: '280px' }}
              >
                {departments.map((dept: any) => (
                  <Form.Check
                    key={dept.id}
                    type="checkbox"
                    id={`dept-${dept.id}`}
                    label={
                      <span>
                        <strong>{dept.name}</strong>{' '}
                        <small className="text-muted">({dept.code}) - In-charge: {dept.headName}</small>
                      </span>
                    }
                    checked={selectedDepts.includes(dept.id)}
                    onChange={() => handleToggleDept(dept.id)}
                    className="mb-2"
                  />
                ))}
              </div>

              <Button
                variant="primary"
                className="w-100 es-touch-btn"
                onClick={handleDownloadPdf}
                disabled={downloading || selectedDepts.length === 0}
              >
                {downloading ? (
                  <Spinner size="sm" className="me-2" />
                ) : (
                  <FaFilePdf className="me-2" />
                )}
                Download Multi-Page Printable PDF ({selectedDepts.length} Pages)
              </Button>
            </Card.Body>
          </Card>
        </Col>

        {/* Standee Preview Column */}
        <Col lg={5}>
          <Card className="es-card">
            <div className="es-card-header">
              <h2 className="es-card-title h6 mb-0">A4 Standee Layout Preview</h2>
            </div>
            <Card.Body className="d-flex justify-content-center p-3">
              <div
                className="bg-white border rounded shadow-sm p-3 text-center d-flex flex-column justify-content-between"
                style={{
                  width: '280px',
                  height: '390px',
                  border: '2px solid #1565C0',
                }}
              >
                <div style={{ backgroundColor: '#1565C0', color: '#fff', padding: '6px', borderRadius: '3px' }}>
                  <div className="fw-bold small">eSushrut G5</div>
                  <div style={{ fontSize: '0.65rem' }}>Hospital Management System (C-DAC)</div>
                </div>

                <div className="my-1">
                  <div className="fw-bold small text-primary">CENTRAL CIVIL HOSPITAL</div>
                  <div className="small fw-semibold text-dark">Outpatient Department (OPD)</div>
                </div>

                <div className="my-1 p-2 bg-light border rounded d-inline-block mx-auto">
                  <div
                    style={{
                      width: '120px',
                      height: '120px',
                      backgroundColor: '#1565C0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      margin: '0 auto',
                    }}
                  >
                    <FaPrint size={48} />
                  </div>
                </div>

                <div className="p-2 bg-light rounded" style={{ fontSize: '0.65rem' }}>
                  <strong className="text-primary d-block">SCAN FOR PATIENT FEEDBACK</strong>
                  {includeTelugu && <div className="text-warning">మీ అభిప్రాయాన్ని తెలియజేయండి</div>}
                  {includeHindi && <div className="text-muted">प्रतिक्रिया दर्ज करें</div>}
                </div>

                <div
                  style={{
                    backgroundColor: '#1E6FD9',
                    color: '#fff',
                    fontSize: '0.6rem',
                    padding: '3px',
                    borderRadius: '2px',
                  }}
                >
                  C-DAC Quality Care Monitoring
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
