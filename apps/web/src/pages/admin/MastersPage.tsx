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

const OPD_MASTER_QUESTIONS = [
  { order: 1, type: 'OPD', od: 'ଡାକ୍ତରଖାନାରେ ପର୍ଯ୍ୟାପ୍ତ ସୂଚନା ଉପଲବ୍ଧ ଅଛି କି ?', en: 'Is enough information available at the hospital?', scale: '1-5 Stars (Poor-Excellent)' },
  { order: 2, type: 'OPD', od: 'ପଞ୍ଜିକରଣ କେନ୍ଦ୍ରରେ କେତେ ସମୟ ଅପେକ୍ଷା କରିବାକୁ ପଡେ ?', en: 'How long do you wait at the registration counter?', scale: 'Wait Time (10m - >1h)' },
  { order: 3, type: 'OPD', od: 'ହସ୍ପିଟାଲର କର୍ମଚାରୀଙ୍କ ବ୍ୟବହାର ଓ ଶୈଳୀ କିପରି ଅଟେ ?', en: 'How are the behaviour and manner of the hospital staff?', scale: '1-5 Stars (Poor-Excellent)' },
  { order: 4, type: 'OPD', od: 'ବହିଃ ବିଭାଗ, ଗାଧୁଆଘର, ପାଇଖାନାର ସଫାସୁତୁରା କିପରି ଅଟେ ?', en: 'How is the cleanliness of the OPD, bathrooms and toilets?', scale: '1-5 Stars (Poor-Excellent)' },
  { order: 5, type: 'OPD', od: 'ଆପଣଙ୍କ ପ୍ରତି ଡାକ୍ତରଙ୍କ ବ୍ୟବହାର ଓ ଯୋଗାଯୋଗ କିପରି ଅଟେ ?', en: "How are the doctor's behaviour and communication with you?", scale: '1-5 Stars (Poor-Excellent)' },
  { order: 6, type: 'OPD', od: 'ଆପଣଙ୍କୁ ଡାକ୍ତରୀ ପରାମର୍ଶ ଓ ପରୀକ୍ଷା ନିମନ୍ତେ କେତେ ସମୟ ଲାଗେ ?', en: 'How do you rate the time taken for your doctor consultation and examination?', scale: '1-5 Stars (Poor-Excellent)' },
  { order: 7, type: 'OPD', od: 'ଡାକ୍ତରଖାନାରେ ନିଦାନ ବିଭାଗ ଓ ରଞ୍ଜନ ରଶ୍ମି ପରୀକ୍ଷା ଅଛି କି ?', en: 'Are diagnostic (lab) and X-ray tests available at the hospital?', scale: 'Yes / No / Partial' },
  { order: 8, type: 'OPD', od: 'ଔଷଧ ବଣ୍ଟନ କେନ୍ଦ୍ରରେ ଔଷଧ ଶୀଘ୍ର ମିଳେ କି ?', en: 'Do you get medicines quickly at the medicine counter?', scale: '1-5 Stars (Poor-Excellent)' },
  { order: 9, type: 'OPD', od: 'ଔଷଧ ବଣ୍ଟନ କେନ୍ଦ୍ରରେ ଔଷଧ ମହଜୁଦ୍ ଅଛି କି ?', en: 'Are medicines in stock at the medicine counter?', scale: 'Yes / No / Partial' },
  { order: 10, type: 'OPD', od: 'ଆପଣଙ୍କ ହସ୍ପିଟାଲ ସମ୍ପର୍କରେ ମୋଟାମୋଟି ମତ ?', en: 'Your overall opinion of the hospital?', scale: '1-5 Stars (Overall)' },
];

const IPD_MASTER_QUESTIONS = [
  { order: 1, type: 'IPD', od: 'ପଞ୍ଜିକରଣ କେନ୍ଦ୍ରରେ ପର୍ଯ୍ୟାପ୍ତ ପରିମାଣରେ ଆବଶ୍ୟକୀୟ ସୂଚନା ଅଛି କି ?', en: 'Is enough necessary information available at the registration counter?', scale: '1-5 Stars' },
  { order: 2, type: 'IPD', od: 'ପଞ୍ଜିକରଣ କେନ୍ଦ୍ରରେ କେତେ ସମୟ ଅପେକ୍ଷା କରିବାକୁ ପଡୁଛି ?', en: 'How long do you wait at the registration counter?', scale: 'Wait Time' },
  { order: 3, type: 'IPD', od: 'ପଞ୍ଜିକରଣ କେନ୍ଦ୍ରରେ ଥିବା କର୍ମଚାରୀଙ୍କ ବ୍ୟବହାର କିପରି ?', en: 'How is the behaviour of the registration counter staff?', scale: '1-5 Stars' },
  { order: 4, type: 'IPD', od: 'ଡାକ୍ତରଖାନାରୁ ଡିସ୍ଚାର୍ଜ ହେଲାବେଳେ ଆପଣଙ୍କର ଅନୁଭୂତି କିପରି ?', en: 'How was your experience at discharge?', scale: '1-5 Stars' },
  { order: 5, type: 'IPD', od: 'ଡାକ୍ତରଖାନାର ୱାର୍ଡଗୁଡ଼ିକର ପରିସ୍କାର ପରିଚ୍ଛନ୍ନତା କିପରି ?', en: 'How is the cleanliness of the wards?', scale: '1-5 Stars' },
  { order: 6, type: 'IPD', od: 'ଡାକ୍ତରଖାନାର ଗାଧୁଆଘର ଓ ପାଇଖାନାର ପରିସ୍କାର ପରିଚ୍ଛନ୍ନତା କିପରି ?', en: 'How is the cleanliness of the bathrooms and toilets?', scale: '1-5 Stars' },
  { order: 7, type: 'IPD', od: 'ଡାକ୍ତରଖାନାରେ ଦିଆଯାଉଥିବା ବେଡ୍‌ସିଟ ଓ ଚକିଆଖୋଳର ପରିସ୍କାର ପରିଚ୍ଛନ୍ନତା କିପରି ?', en: 'How is the cleanliness of the bedsheets and pillow covers?', scale: '1-5 Stars' },
  { order: 8, type: 'IPD', od: 'ଡାକ୍ତରଖାନା ସଂଲଗ୍ନ ଜାଗା ଓ ଡ୍ରେନଗୁଡ଼ିକର ପରିଚ୍ଛନ୍ନତା କିପରି ଥାଏ ?', en: 'How is the cleanliness of the hospital surroundings and drains?', scale: '1-5 Stars' },
  { order: 9, type: 'IPD', od: 'ଡାକ୍ତର ନିୟମିତ କାର୍ଯ୍ୟରେ ଆସନ୍ତି କି ?', en: 'Do doctors come to work regularly?', scale: '1-5 Stars' },
  { order: 10, type: 'IPD', od: 'ଡାକ୍ତରଙ୍କ ରୋଗୀ ପ୍ରତି ସମ୍ପର୍କ ଓ ଯୋଗାଯୋଗ କିପରି ଥାଏ ?', en: "How are the doctors' relationship and communication with patients?", scale: '1-5 Stars' },
  { order: 11, type: 'IPD', od: 'ରୋଗୀର ଚିକିତ୍ସା କରିବା ପାଇଁ ଡାକ୍ତର କେତେ ସମୟ ନିଅନ୍ତି ?', en: 'How do you rate the time doctors take to treat the patient?', scale: '1-5 Stars' },
  { order: 12, type: 'IPD', od: 'ୱାର୍ଡଗୁଡ଼ିକରେ ସେମାନଙ୍କର କାର୍ଯ୍ୟ ଚଞ୍ଚଳତା କିପରି ?', en: 'How prompt is their work in the wards?', scale: '1-5 Stars' },
  { order: 13, type: 'IPD', od: 'ଦିବାରାତ୍ର ୱାର୍ଡଗୁଡ଼ିକରେ ସେମାନେ ଉପଲବ୍ଧ ଥାଆନ୍ତି କି ?', en: 'Are they available in the wards day and night?', scale: '1-5 Stars' },
  { order: 14, type: 'IPD', od: 'ନର୍ସମାନଙ୍କ ରୋଗୀପ୍ରତି ସମ୍ପର୍କ ଓ ସ୍ନେହ କିପରି ଥାଏ ?', en: "How are the nurses' relationship and care towards patients?", scale: '1-5 Stars' },
  { order: 15, type: 'IPD', od: 'ୱାର୍ଡଗୁଡ଼ିକରେ ଥିବା ସହାୟକ ଓ ସହାୟିକାମାନଙ୍କର ଆପଣଙ୍କ ପ୍ରତି ବ୍ୟବହାର କିପରି ?', en: 'How is the behaviour of ward attendants towards you?', scale: '1-5 Stars' },
  { order: 16, type: 'IPD', od: 'ଡାକ୍ତର ଲେଖୁଥିବା ସମସ୍ତ ଔଷଧ ହସ୍ପିଟାଲ୍ ରୁ ମିଳେ କି ?', en: 'Do you get all the medicines the doctor prescribes from the hospital?', scale: '1-5 Stars' },
  { order: 17, type: 'IPD', od: 'ଡାକ୍ତରଙ୍କ ଚିକିତ୍ସା ଜ୍ଞାନ ଓ କୁଶଳତା ଉପରେ ଆପଣଙ୍କର ବିଚାର କିପରି ?', en: "What is your opinion of the doctors' medical knowledge and skill?", scale: '1-5 Stars' },
  { order: 18, type: 'IPD', od: 'ଡାକ୍ତରଖାନାରେ ହେଉଥିବା ଚିକିତ୍ସା ପ୍ରଣାଳୀ କିପରି ?', en: 'How is the treatment procedure followed at the hospital?', scale: '1-5 Stars' },
  { order: 19, type: 'IPD', od: 'ଡାକ୍ତରଖାନାରେ ସମୟ ଅନୁସାରେ ରୋଗୀକୁ ଖାଦ୍ୟ ମିଳେ କି ?', en: 'Do patients get food on time?', scale: '1-5 Stars' },
  { order: 20, type: 'IPD', od: 'ଆପଣଙ୍କ ସାମଗ୍ରିକ ରୋଗୀ ସେବା ଉପରେ କିପରି ସନ୍ତୁଷ୍ଟ ଅଟନ୍ତି ?', en: 'How satisfied are you with the overall patient service?', scale: '1-5 Stars' },
];

export const MastersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('questions');
  const [questionFilter, setQuestionFilter] = useState<'ALL' | 'OPD' | 'IPD'>('ALL');
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

  const displayedQuestions =
    questionFilter === 'OPD'
      ? OPD_MASTER_QUESTIONS
      : questionFilter === 'IPD'
      ? IPD_MASTER_QUESTIONS
      : [...OPD_MASTER_QUESTIONS, ...IPD_MASTER_QUESTIONS];

  return (
    <div className="container-fluid py-4 px-2 px-md-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2">
        <div>
          <h1 className="h4 fw-bold text-dark mb-0">DHH KATAKA · System Master Configuration</h1>
          <small className="text-muted">
            Manage OPD (10 Qs) & IPD (20 Qs) questions, service categories, SLA escalation matrix & QR counters
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
          Trigger SLA Auto-Escalation
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
                  <FaQuestionCircle className="me-1" /> Feedback Question Master (30)
                </span>
              }
            >
              {/* Question Stream Filter */}
              <div className="d-flex flex-wrap gap-2 mb-3">
                <Button
                  size="sm"
                  variant={questionFilter === 'ALL' ? 'primary' : 'outline-secondary'}
                  className="fw-bold"
                  onClick={() => setQuestionFilter('ALL')}
                >
                  All Questions (30)
                </Button>
                <Button
                  size="sm"
                  variant={questionFilter === 'OPD' ? 'success' : 'outline-success'}
                  className="fw-bold"
                  onClick={() => setQuestionFilter('OPD')}
                >
                  OPD Outpatient (10 Qs)
                </Button>
                <Button
                  size="sm"
                  variant={questionFilter === 'IPD' ? 'primary' : 'outline-primary'}
                  className="fw-bold"
                  onClick={() => setQuestionFilter('IPD')}
                >
                  IPD Inpatient Wards (20 Qs)
                </Button>
              </div>

              <div className="table-responsive">
                <Table hover className="align-middle">
                  <thead className="table-light small text-uppercase">
                    <tr>
                      <th>#</th>
                      <th>Stream</th>
                      <th>ଓଡ଼ିଆ (Odia) Question</th>
                      <th>English Translation</th>
                      <th>Rating Scale</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedQuestions.map((q: any) => (
                      <tr key={`${q.type}-${q.order}`}>
                        <td className="fw-bold">{q.order}</td>
                        <td>
                          <Badge bg={q.type === 'OPD' ? 'success' : 'primary'}>{q.type}</Badge>
                        </td>
                        <td className="fw-semibold text-dark" style={{ minWidth: '220px' }}>
                          {q.od}
                        </td>
                        <td className="text-secondary small" style={{ minWidth: '200px' }}>
                          {q.en}
                        </td>
                        <td>
                          <Badge bg="light" text="dark" className="border">
                            {q.scale}
                          </Badge>
                        </td>
                        <td>
                          <Badge bg="success">Active</Badge>
                        </td>
                      </tr>
                    ))}
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
                      <th>Service Name (English)</th>
                      <th>Service Name (ଓଡ଼ିଆ / Odia)</th>
                      <th>Scope / Description</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingCategories ? (
                      <tr>
                        <td colSpan={5} className="text-center py-4 text-muted">
                          Loading categories...
                        </td>
                      </tr>
                    ) : (
                      categories.map((c: any) => (
                        <tr key={c.id}>
                          <td className="fw-bold font-monospace text-primary">{c.code}</td>
                          <td className="fw-semibold">{c.nameEn}</td>
                          <td className="small text-muted">{c.nameTe || c.nameHi || '—'}</td>
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
