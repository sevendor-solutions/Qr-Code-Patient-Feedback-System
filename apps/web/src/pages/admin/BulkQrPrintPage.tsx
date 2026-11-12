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
  const [includeOdia, setIncludeOdia] = useState(true);
  const [includeEnglish, setIncludeEnglish] = useState(true);
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
          includeOdia,
          includeEnglish,
        },
        { responseType: 'blob' },
      );

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'dhh-kataka-department-qr-standees.pdf');
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
    <div className="container-fluid py-4 px-2 px-md-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <div>
          <h1 className="h4 fw-bold text-dark mb-0">DHH KATAKA · Bulk QR Standee Print Sheet (A4)</h1>
          <small className="text-muted">
            Export ready-to-print high-resolution multi-page A4 PDF standees for OPD counters and IPD wards
          </small>
        </div>
        <div className="badge bg-primary px-3 py-2">District Head Hospital, Cuttack</div>
      </div>

      {errorMsg && (
        <Alert variant="danger" dismissible onClose={() => setErrorMsg(null)}>
          {errorMsg}
        </Alert>
      )}

      <Row className="g-4">
        {/* Controls Column */}
        <Col xs={12} lg={7}>
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

              {/* Multilingual Options */}
              <div className="p-3 bg-light rounded border mb-3">
                <span className="fw-bold small d-block mb-2">Multilingual Text Signage</span>
                <div className="d-flex flex-wrap gap-4">
                  <Form.Check
                    type="checkbox"
                    id="include-odia"
                    label="Include Odia (ଓଡ଼ିଆରେ ନିର୍ଦ୍ଦେଶାବଳୀ - ଆପଣଙ୍କ ମତାମତ ଦିଅନ୍ତୁ)"
                    checked={includeOdia}
                    onChange={(e) => setIncludeOdia(e.target.checked)}
                  />
                  <Form.Check
                    type="checkbox"
                    id="include-english"
                    label="Include English (Scan QR to submit feedback)"
                    checked={includeEnglish}
                    onChange={(e) => setIncludeEnglish(e.target.checked)}
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
        <Col xs={12} lg={5}>
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
                  <div className="fw-bold small">DHH KATAKA</div>
                  <div style={{ fontSize: '0.65rem' }}>District Head Hospital · କଟକ</div>
                  <div style={{ fontSize: '0.6rem', color: '#C6E85A' }}>ଜିଲ୍ଲା ମୁଖ୍ୟ ଚିକିତ୍ସାଳୟ, କଟକ</div>
                </div>

                <div className="my-1">
                  <div className="fw-bold small text-primary">DHH KATAKA</div>
                  <div className="small fw-semibold text-dark">Outpatient / Inpatient Feedback</div>
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

                <div className="p-2 bg-light rounded" style={{ fontSize: '0.68rem' }}>
                  <strong className="text-primary d-block">SCAN FOR PATIENT FEEDBACK</strong>
                  <div className="text-dark fw-semibold mt-1">ଆପଣଙ୍କ ମତାମତ ଦିଅନ୍ତୁ</div>
                  <div className="text-muted" style={{ fontSize: '0.62rem' }}>OPD (10 Qs) · IPD (20 Qs)</div>
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
                  DHH KATAKA · Quality & Patient Safety Cell
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
