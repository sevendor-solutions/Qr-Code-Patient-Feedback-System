import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Form, Button, Alert, Card, Spinner, Nav } from 'react-bootstrap';
import { apiClient } from '../../api/client';
import { StarRating } from '../../components/common/StarRating';
import { EmojiScale } from '../../components/common/EmojiScale';
import { NpsScale } from '../../components/common/NpsScale';
import {
  PatientType,
  ComplaintPriority,
  RatingCategory,
} from '@esushrut/shared';
import {
  FaCheckCircle,
  FaHospital,
  FaLanguage,
  FaUserInjured,
  FaStar,
  FaExclamationCircle,
  FaCamera,
  FaShieldAlt,
} from 'react-icons/fa';

export const MobileFeedbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const hospitalId = searchParams.get('h') || '';
  const departmentId = searchParams.get('d') || '';
  const locationId = searchParams.get('loc') || '';
  const qrToken = searchParams.get('t') || '';

  // State
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [verifying, setVerifying] = useState(true);
  const [hospital, setHospital] = useState<any>(null);
  const [department, setDepartment] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);

  // Wizard Step
  const [step, setStep] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'review' | 'complaint'>('review');

  // Form Fields
  const [language, setLanguage] = useState<'en' | 'te' | 'hi'>('en');
  const [patientName, setPatientName] = useState('');
  const [mobile, setMobile] = useState('');
  const [crNumber, setCrNumber] = useState('');
  const [patientType, setPatientType] = useState<PatientType>(PatientType.OPD);

  // Review Form
  const [ratings, setRatings] = useState<Record<string, number>>({
    [RatingCategory.REGISTRATION]: 4,
    [RatingCategory.WAITING_TIME]: 4,
    [RatingCategory.DOCTOR]: 5,
    [RatingCategory.NURSING]: 4,
    [RatingCategory.CLEANLINESS]: 4,
    [RatingCategory.LAB]: 4,
    [RatingCategory.PHARMACY]: 4,
    [RatingCategory.BILLING]: 4,
    [RatingCategory.STAFF_BEHAVIOUR]: 5,
  });
  const [overallEmoji, setOverallEmoji] = useState<number>(4);
  const [npsScore, setNpsScore] = useState<number>(9);
  const [comments, setComments] = useState('');

  // Complaint Form
  const [complaintCategory, setComplaintCategory] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<ComplaintPriority>(ComplaintPriority.NORMAL);
  const [photo, setPhoto] = useState<File | null>(null);

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ ticketId: string; message: string } | null>(null);

  useEffect(() => {
    async function init() {
      try {
        setVerifying(true);
        // Verify QR Token
        const verifyRes = await apiClient.get(
          `/qr/verify?h=${hospitalId}&d=${departmentId}&loc=${locationId}&t=${qrToken}`,
        );
        setTokenValid(verifyRes.data.valid);

        if (verifyRes.data.valid) {
          const [deptRes, catRes] = await Promise.all([
            apiClient.get(`/departments/${departmentId}`),
            apiClient.get('/categories'),
          ]);
          setDepartment(deptRes.data);
          setHospital(deptRes.data.hospital);
          setCategories(catRes.data);
          if (catRes.data.length > 0) {
            setComplaintCategory(catRes.data[0].id);
          }
        }
      } catch (err) {
        setTokenValid(false);
      } finally {
        setVerifying(false);
      }
    }

    if (hospitalId && departmentId && qrToken) {
      init();
    } else {
      setVerifying(false);
      setTokenValid(false);
    }
  }, [hospitalId, departmentId, locationId, qrToken]);

  const handleLanguageChange = (lng: 'en' | 'te' | 'hi') => {
    setLanguage(lng);
    i18n.changeLanguage(lng);
  };

  const handleRatingChange = (category: string, val: number) => {
    setRatings((prev) => ({ ...prev, [category]: val }));
  };

  const validateMobile = (num: string) => {
    return /^[6-9]\d{9}$/.test(num.trim());
  };

  const handleNextToStep3 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!validateMobile(mobile)) {
      setErrorMsg('Please enter a valid 10-digit mobile number starting with 6-9');
      return;
    }
    setStep(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    try {
      const ratingList = Object.entries(ratings).map(([category, rating]) => ({
        category: category as RatingCategory,
        rating,
      }));

      const payload = {
        hospitalId,
        departmentId,
        locationId: locationId || undefined,
        qrToken,
        language,
        patientName: patientName || undefined,
        mobile: mobile.trim(),
        crNumber: crNumber || undefined,
        patientType,
        ratings: ratingList,
        overallEmoji,
        npsScore,
        comments: comments || undefined,
      };

      const res = await apiClient.post('/feedback/submit', payload);
      setSuccessData(res.data);
      setStep(4);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (description.trim().length < 10) {
      setErrorMsg('Please describe your grievance with at least 10 characters.');
      return;
    }
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('hospitalId', hospitalId);
      formData.append('departmentId', departmentId);
      if (locationId) formData.append('locationId', locationId);
      formData.append('qrToken', qrToken);
      formData.append('language', language);
      if (patientName) formData.append('patientName', patientName);
      formData.append('mobile', mobile.trim());
      if (crNumber) formData.append('crNumber', crNumber);
      formData.append('patientType', patientType);
      formData.append('categoryId', complaintCategory);
      formData.append('description', description);
      formData.append('priority', priority);
      if (photo) {
        formData.append('photo', photo);
      }

      const res = await apiClient.post('/complaints/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccessData(res.data);
      setStep(4);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit complaint. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (verifying) {
    return (
      <div className="es-mobile-container justify-content-center align-items-center p-4">
        <Spinner animation="border" variant="primary" />
        <h5 className="mt-3 text-primary fw-bold">Verifying eSushrut Hospital QR Code...</h5>
        <p className="text-muted text-center" style={{ fontSize: '0.85rem' }}>
          Validating C-DAC cryptographic HMAC signature for secure feedback submission.
        </p>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="es-mobile-container p-4 justify-content-center align-items-center">
        <Card className="text-center p-4 border-danger shadow-sm">
          <FaShieldAlt className="text-danger mb-3" size={48} />
          <h4 className="text-danger fw-bold">Invalid or Tampered QR Code</h4>
          <p className="text-muted">
            The cryptographic security token for this QR Code could not be verified. Please scan the
            official eSushrut G5 QR code standee placed at your hospital counter or department.
          </p>
          <Button variant="primary" onClick={() => navigate('/track')} className="mt-2">
            Track Existing Grievance Status
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="es-mobile-container">
      {/* Header */}
      <header className="es-mobile-header">
        <div className="d-flex align-items-center justify-content-center mb-1">
          <FaHospital className="text-warning me-2" size={24} />
          <h1 className="h4 mb-0 fw-bold">{hospital?.name || t('systemTitle')}</h1>
        </div>
        <p className="small mb-0 opacity-90">{department?.name || t('portalSubtitle')}</p>
        <div className="badge bg-light text-primary mt-2">
          {department?.code} Desk | Official C-DAC eSushrut Portal
        </div>
      </header>

      {/* Progress Stepper */}
      <nav aria-label="Feedback Progress" className="bg-light px-3 py-2 border-bottom d-flex justify-content-around text-center small fw-bold">
        <span className={step >= 1 ? 'text-primary' : 'text-muted'}>1. {t('step1')}</span>
        <span>›</span>
        <span className={step >= 2 ? 'text-primary' : 'text-muted'}>2. {t('step2')}</span>
        <span>›</span>
        <span className={step >= 3 ? 'text-primary' : 'text-muted'}>3. {t('step3')}</span>
        <span>›</span>
        <span className={step >= 4 ? 'text-success' : 'text-muted'}>4. {t('step4')}</span>
      </nav>

      <main role="main" className="p-3 flex-grow-1">
        {errorMsg && (
          <Alert variant="danger" dismissible onClose={() => setErrorMsg(null)} className="small">
            <FaExclamationCircle className="me-2" />
            {errorMsg}
          </Alert>
        )}

        {/* STEP 1: Language Selection */}
        {step === 1 && (
          <div className="py-3">
            <div className="text-center mb-4">
              <FaLanguage className="text-primary mb-2" size={42} />
              <h2 className="h5 fw-bold">{t('selectLanguage')}</h2>
              <p className="text-muted small">Choose your language to proceed / మీ భాషను ఎంచుకోండి</p>
            </div>

            <div className="d-grid gap-3">
              <button
                type="button"
                className={`btn p-3 text-start border ${
                  language === 'en' ? 'btn-primary text-white' : 'btn-outline-primary bg-white'
                }`}
                onClick={() => handleLanguageChange('en')}
              >
                <div className="fw-bold fs-5">English</div>
                <small className="opacity-75">Continue in English</small>
              </button>

              <button
                type="button"
                className={`btn p-3 text-start border ${
                  language === 'te' ? 'btn-primary text-white' : 'btn-outline-primary bg-white'
                }`}
                onClick={() => handleLanguageChange('te')}
              >
                <div className="fw-bold fs-5">తెలుగు (Telugu)</div>
                <small className="opacity-75">తెలుగులో కొనసాగండి</small>
              </button>

              <button
                type="button"
                className={`btn p-3 text-start border ${
                  language === 'hi' ? 'btn-primary text-white' : 'btn-outline-primary bg-white'
                }`}
                onClick={() => handleLanguageChange('hi')}
              >
                <div className="fw-bold fs-5">हिंदी (Hindi)</div>
                <small className="opacity-75">हिंदी में जारी रखें</small>
              </button>
            </div>

            <Button
              id="btn-language-continue"
              variant="primary"
              className="w-100 es-touch-btn mt-4"
              onClick={() => setStep(2)}
            >
              Continue / కొనసాగించండి / आगे बढ़ें →
            </Button>
          </div>
        )}

        {/* STEP 2: Patient Identification */}
        {step === 2 && (
          <Form onSubmit={handleNextToStep3}>
            <div className="mb-3 text-center">
              <FaUserInjured className="text-primary mb-1" size={32} />
              <h2 className="h5 fw-bold">{t('step2')}</h2>
              <p className="text-muted small">Please provide your contact number for SMS updates</p>
            </div>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold small">
                {t('mobileNumber')} <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="tel"
                maxLength={10}
                placeholder="e.g. 9876543210"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                required
                className="py-2 fs-5"
                autoFocus
              />
              <Form.Text className="text-muted">
                Standard SMS confirmation will be sent to this mobile number.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small">
                {t('fullName')} <span className="text-muted">({t('optional')})</span>
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter full name"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold small">
                {t('crNumber')} <span className="text-muted">({t('optional')})</span>
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. CR-2026-001234"
                value={crNumber}
                onChange={(e) => setCrNumber(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold small">{t('patientType')}</Form.Label>
              <Form.Select
                value={patientType}
                onChange={(e) => setPatientType(e.target.value as PatientType)}
                className="py-2"
              >
                <option value={PatientType.OPD}>{t('opd')}</option>
                <option value={PatientType.IPD}>{t('ipd')}</option>
                <option value={PatientType.EMERGENCY}>{t('emergency')}</option>
                <option value={PatientType.ATTENDANT}>{t('attendant')}</option>
                <option value={PatientType.VISITOR}>{t('visitor')}</option>
              </Form.Select>
            </Form.Group>

            <div className="d-flex gap-2 mt-4">
              <Button variant="outline-secondary" className="es-touch-btn flex-grow-1" onClick={() => setStep(1)}>
                ← Back
              </Button>
              <Button id="btn-patient-info-next" type="submit" variant="primary" className="es-touch-btn flex-grow-2">
                Next: Give Feedback / Complaint →
              </Button>
            </div>
          </Form>
        )}

        {/* STEP 3: Give Review OR Raise Complaint */}
        {step === 3 && (
          <div>
            <Nav variant="pills" justify className="mb-3 bg-light p-1 rounded border">
              <Nav.Item>
                <Nav.Link
                  active={activeTab === 'review'}
                  onClick={() => setActiveTab('review')}
                  className="fw-bold py-2"
                >
                  <FaStar className="me-1" /> {t('giveReview')}
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  active={activeTab === 'complaint'}
                  onClick={() => setActiveTab('complaint')}
                  className="fw-bold py-2 text-danger"
                >
                  <FaExclamationCircle className="me-1" /> {t('raiseComplaint')}
                </Nav.Link>
              </Nav.Item>
            </Nav>

            {/* REVIEW FORM */}
            {activeTab === 'review' && (
              <Form onSubmit={handleFeedbackSubmit}>
                <Card className="mb-3 border-0 bg-light p-3">
                  <h6 className="fw-bold text-primary mb-2">{t('serviceRatings')}</h6>
                  <div className="d-grid gap-2">
                    {Object.values(RatingCategory).map((cat) => (
                      <div
                        key={cat}
                        className="d-flex justify-content-between align-items-center bg-white p-2 rounded border"
                      >
                        <span className="small fw-semibold">{t(`categories.${cat}`)}</span>
                        <StarRating
                          value={ratings[cat] || 4}
                          onChange={(val) => handleRatingChange(cat, val)}
                        />
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Overall Emoji Scale */}
                <Card className="mb-3 p-3 border">
                  <h6 className="fw-bold mb-1">{t('overallExperience')}</h6>
                  <EmojiScale value={overallEmoji} onChange={setOverallEmoji} />
                </Card>

                {/* NPS 0-10 Scale */}
                <Card className="mb-3 p-3 border">
                  <h6 className="fw-bold mb-1">{t('npsQuestion')}</h6>
                  <NpsScale value={npsScore} onChange={setNpsScore} />
                </Card>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small">
                    {t('commentsPlaceholder')}
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Share any comments or suggestions..."
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                  />
                </Form.Group>

                <div className="d-flex gap-2">
                  <Button variant="outline-secondary" className="es-touch-btn" onClick={() => setStep(2)}>
                    ← Back
                  </Button>
                  <Button
                    id="btn-submit-feedback"
                    type="submit"
                    variant="success"
                    className="es-touch-btn flex-grow-1"
                    disabled={submitting}
                  >
                    {submitting ? <Spinner size="sm" /> : t('submitFeedback')}
                  </Button>
                </div>
              </Form>
            )}

            {/* COMPLAINT FORM */}
            {activeTab === 'complaint' && (
              <Form onSubmit={handleComplaintSubmit}>
                <Card className="p-3 mb-3 border-warning border-2">
                  <h6 className="fw-bold text-dark mb-3">
                    <FaExclamationCircle className="text-warning me-2" />
                    Register Hospital Grievance / Complaint
                  </h6>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold small">{t('selectCategory')}</Form.Label>
                    <Form.Select
                      value={complaintCategory}
                      onChange={(e) => setComplaintCategory(e.target.value)}
                      required
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {language === 'te'
                            ? cat.nameTe
                            : language === 'hi'
                            ? cat.nameHi
                            : cat.nameEn}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold small">
                      {t('complaintDesc')} <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={4}
                      placeholder="Please explain the issue clearly (e.g. staff delay, unavailable medicine, cleanliness issue)..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-bold small">{t('priority')}</Form.Label>
                    <div className="d-flex gap-3">
                      <Form.Check
                        type="radio"
                        id="priority-normal"
                        label={t('priorityNormal')}
                        name="priority"
                        checked={priority === ComplaintPriority.NORMAL}
                        onChange={() => setPriority(ComplaintPriority.NORMAL)}
                      />
                      <Form.Check
                        type="radio"
                        id="priority-urgent"
                        label={t('priorityUrgent')}
                        name="priority"
                        checked={priority === ComplaintPriority.URGENT}
                        onChange={() => setPriority(ComplaintPriority.URGENT)}
                        className="text-danger fw-bold"
                      />
                    </div>
                  </Form.Group>

                  <Form.Group className="mb-3">
                    <Form.Label className="fw-semibold small">
                      <FaCamera className="me-1" /> {t('attachPhoto')}
                    </Form.Label>
                    <Form.Control
                      type="file"
                      accept="image/png,image/jpeg"
                      onChange={(e: any) => {
                        if (e.target.files && e.target.files[0]) {
                          setPhoto(e.target.files[0]);
                        }
                      }}
                    />
                    <Form.Text className="text-muted">
                      Accepted formats: JPG, PNG. Maximum file size: 5 MB.
                    </Form.Text>
                  </Form.Group>
                </Card>

                <div className="d-flex gap-2">
                  <Button variant="outline-secondary" className="es-touch-btn" onClick={() => setStep(2)}>
                    ← Back
                  </Button>
                  <Button
                    id="btn-submit-complaint"
                    type="submit"
                    variant="danger"
                    className="es-touch-btn flex-grow-1"
                    disabled={submitting}
                  >
                    {submitting ? <Spinner size="sm" /> : t('submitComplaint')}
                  </Button>
                </div>
              </Form>
            )}
          </div>
        )}

        {/* STEP 4: Success Confirmation Screen */}
        {step === 4 && successData && (
          <div className="text-center py-4">
            <FaCheckCircle className="text-success mb-3" size={64} />
            <h3 className="fw-bold text-success">{t('thankYou')}</h3>
            <p className="text-muted small px-3">{t('feedbackSuccessMsg')}</p>

            <Card className="my-4 p-3 bg-light border-primary border-2 shadow-sm">
              <span className="text-muted small text-uppercase fw-bold">
                {t('ticketIdLabel')}
              </span>
              <div
                className="display-6 fw-bold text-primary my-2"
                style={{ letterSpacing: '1px', fontFamily: 'monospace' }}
              >
                {successData.ticketId}
              </div>
              <small className="text-muted">
                An acknowledgment SMS has been dispatched to {mobile}.
              </small>
            </Card>

            <div className="d-grid gap-2">
              <Button
                variant="primary"
                className="es-touch-btn"
                onClick={() =>
                  navigate(`/track?ticketId=${successData.ticketId}&mobile=${mobile}`)
                }
              >
                {t('trackStatusBtn')} →
              </Button>
              <Button
                variant="outline-secondary"
                className="es-touch-btn"
                onClick={() => {
                  setStep(1);
                  setComments('');
                  setDescription('');
                  setPhoto(null);
                }}
              >
                {t('submitAnother')}
              </Button>
            </div>
          </div>
        )}
      </main>

      <footer className="p-3 text-center bg-light border-top text-muted small">
        eSushrut G5 Patient Care Portal | Centre for Development of Advanced Computing (C-DAC)
      </footer>
    </div>
  );
};
