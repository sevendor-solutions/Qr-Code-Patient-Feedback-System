import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiClient } from '../../api/client';
import {
  FaHospital,
  FaUserMd,
  FaProcedures,
  FaCalendarAlt,
  FaUser,
  FaIdCard,
  FaBed,
  FaCommentDots,
  FaPaperPlane,
  FaArrowLeft,
  FaChevronRight,
  FaCheckCircle,
  FaRedo,
  FaClipboardCheck,
  FaHourglassHalf,
  FaClock,
  FaStopwatch,
  FaBolt,
  FaRocket,
  FaCheck,
  FaExclamationCircle,
} from 'react-icons/fa';
import {
  FaRegFaceFrown,
  FaFaceFrown,
  FaRegFaceMeh,
  FaFaceMeh,
  FaRegFaceSmile,
  FaFaceSmile,
  FaRegFaceSmileBeam,
  FaFaceSmileBeam,
  FaRegFaceGrinStars,
  FaFaceGrinStars,
} from 'react-icons/fa6';
import './PatientFeedback.css';

interface QuestionItem {
  o: string;
  e: string;
  time?: boolean;
}

interface FormDefinition {
  abbr: 'OPD' | 'IPD';
  title: string;
  intro: string;
  introEn: string;
  ticketOd: string;
  ticketEn: string;
  ward: boolean;
  qs: QuestionItem[];
}

const SCALE_OD = ['ନ୍ୟୂନ', 'ଚଳଣୀୟ', 'ଭଲ', 'ବହୁତ ଭଲ', 'ଉତ୍କୃଷ୍ଟ'];
const SCALE_EN = ['Poor', 'Fair', 'Good', 'Very good', 'Excellent'];
const TIME_OD = ['୩୦ ମିନିଟ୍ ଅଧିକ', '୧୦-୩୦ ମିନିଟ୍', '୫-୧୦ ମିନିଟ୍', '୫ ମିନିଟରୁ କମ୍', 'ସଙ୍ଗେ ସଙ୍ଗେ'];
const TIME_EN = ['Over 30 min', '10-30 min', '5-10 min', 'Under 5 min', 'Immediately'];

const QUICK_CHIPS = [
  'ଡାକ୍ତର ଉତ୍ତମ ଚିକିତ୍ସା କଲେ (Good Doctor Care)',
  'ପରିମଳ ସଫାସୁତୁରା ଭଲ (Clean Premises)',
  'ଔଷଧ ଶୀଘ୍ର ମିଳିଲା (Quick Medicines)',
  'କର୍ମଚାରୀଙ୍କ ବ୍ୟବହାର ଭଲ (Polite Staff)',
  'ଅପେକ୍ଷା ସମୟ କମାନ୍ତୁ (Reduce Waiting Time)',
];

const FORMS: Record<'opd' | 'ipd', FormDefinition> = {
  opd: {
    abbr: 'OPD',
    title: 'ବହିଃ-ବିଭାଗ ରୋଗୀଙ୍କ ମତାମତ ଫର୍ମ',
    intro:
      'ପ୍ରିୟ ବନ୍ଧୁ, ଆପଣ ନିଜର ବହୁମୂଲ୍ୟ ସମୟ ଖର୍ଚ୍ଚ କରି ନିଜର/ସମ୍ପର୍କୀୟ/ବନ୍ଧୁମାନଙ୍କର ଚିକିତ୍ସା ନିମନ୍ତେ ଚିକିତ୍ସାଳୟକୁ ଆସୁଥିବେ । ଏଣୁ ଆପଣଙ୍କର ନିଜସ୍ୱ କିଛି ମତାମତ ଜିଲ୍ଲା ମୁଖ୍ୟ ଚିକିତ୍ସାଳୟର ଉନ୍ନତି ନିମନ୍ତେ ଜଣାଇବା ପାଇଁ ଅନୁରୋଧ ।',
    introEn:
      'Outpatient feedback form. You give your valuable time to visit the hospital for treatment. Please share your views to help improve the hospital. Rate each item from 1 (Poor) to 5 (Excellent).',
    ticketOd: 'ବହିଃ-ବିଭାଗ ଟିକେଟ ନଂ',
    ticketEn: 'OPD ticket no.',
    ward: false,
    qs: [
      { o: 'ଡାକ୍ତରଖାନାରେ ପର୍ଯ୍ୟାପ୍ତ ସୂଚନା ଉପଲବ୍ଧ ଅଛି କି ?', e: 'Is enough information available at the hospital?' },
      { o: 'ପଞ୍ଜିକରଣ କେନ୍ଦ୍ରରେ କେତେ ସମୟ ଅପେକ୍ଷା କରିବାକୁ ପଡେ ?', e: 'How long do you wait at the registration counter?', time: true },
      { o: 'ହସ୍ପିଟାଲର କର୍ମଚାରୀଙ୍କ ବ୍ୟବହାର ଓ ଶୈଳୀ କିପରି ଅଟେ ?', e: 'How are the behaviour and manner of the hospital staff?' },
      { o: 'ବହିଃ ବିଭାଗ, ଗାଧୁଆଘର, ପାଇଖାନାର ସଫାସୁତୁରା କିପରି ଅଟେ ?', e: 'How is the cleanliness of the OPD, bathrooms and toilets?' },
      { o: 'ଆପଣଙ୍କ ପ୍ରତି ଡାକ୍ତରଙ୍କ ବ୍ୟବହାର ଓ ଯୋଗାଯୋଗ କିପରି ଅଟେ ?', e: 'How are the doctor\'s behaviour and communication with you?' },
      { o: 'ଆପଣଙ୍କୁ ଡାକ୍ତରୀ ପରାମର୍ଶ ଓ ପରୀକ୍ଷା ନିମନ୍ତେ କେତେ ସମୟ ଲାଗେ ?', e: 'How do you rate the time taken for your doctor consultation and examination?' },
      { o: 'ଡାକ୍ତରଖାନାରେ ନିଦାନ ବିଭାଗ ଓ ରଞ୍ଜନ ରଶ୍ମି ପରୀକ୍ଷା ଅଛି କି ?', e: 'Are diagnostic (lab) and X-ray tests available at the hospital?' },
      { o: 'ଔଷଧ ବଣ୍ଟନ କେନ୍ଦ୍ରରେ ଔଷଧ ଶୀଘ୍ର ମିଳେ କି ?', e: 'Do you get medicines quickly at the medicine counter?' },
      { o: 'ଔଷଧ ବଣ୍ଟନ କେନ୍ଦ୍ରରେ ଔଷଧ ମହଜୁଦ୍ ଅଛି କି ?', e: 'Are medicines in stock at the medicine counter?' },
      { o: 'ଆପଣଙ୍କ ହସ୍ପିଟାଲ ସମ୍ପର୍କରେ ମୋଟାମୋଟି ମତ ?', e: 'Your overall opinion of the hospital?' },
    ],
  },
  ipd: {
    abbr: 'IPD',
    title: 'ଅନ୍ତଃ-ବିଭାଗ ରୋଗୀଙ୍କ ମତାମତ ଫର୍ମ',
    intro:
      'ପ୍ରିୟ ବନ୍ଧୁ, ଆପଣ ଏହି ଚିକିତ୍ସାଳୟରେ ଆପଣଙ୍କର ନିଜର/ସମ୍ପର୍କୀୟଙ୍କର/ବନ୍ଧୁମାନଙ୍କର ଚିକିତ୍ସା ନିମନ୍ତେ ନିଜର ବହୁମୂଲ୍ୟ ସମୟ ଦାନ କରି ରହିଥିବେ । ସେହି ସମୟରେ ଅନ୍ତଃ-ବିଭାଗ ରୋଗୀମାନଙ୍କୁ ଦିଆଯାଉଥିବା ସୁବିଧା, ସୁଯୋଗ ଉପରେ ଆପଣଙ୍କର କିପରି ଅଭିଜ୍ଞତା ଅଛି ତାହା ଆମକୁ ଜଣାଇବାକୁ ଅନୁରୋଧ ।',
    introEn:
      'Inpatient feedback form. You stayed at this hospital for your own or a relative\'s treatment. Please tell us about your experience of the facilities provided. Rate each item from 1 (Poor) to 5 (Excellent).',
    ticketOd: 'ଅନ୍ତଃ-ବିଭାଗ ଟିକେଟ ନଂ',
    ticketEn: 'IPD ticket no.',
    ward: true,
    qs: [
      { o: 'ପଞ୍ଜିକରଣ କେନ୍ଦ୍ରରେ ପର୍ଯ୍ୟାପ୍ତ ପରିମାଣରେ ଆବଶ୍ୟକୀୟ ସୂଚନା ଅଛି କି ?', e: 'Is enough necessary information available at the registration counter?' },
      { o: 'ପଞ୍ଜିକରଣ କେନ୍ଦ୍ରରେ କେତେ ସମୟ ଅପେକ୍ଷା କରିବାକୁ ପଡୁଛି ?', e: 'How long do you wait at the registration counter?', time: true },
      { o: 'ପଞ୍ଜିକରଣ କେନ୍ଦ୍ରରେ ଥିବା କର୍ମଚାରୀଙ୍କ ବ୍ୟବହାର କିପରି ?', e: 'How is the behaviour of the registration counter staff?' },
      { o: 'ଡାକ୍ତରଖାନାରୁ ଡିସ୍ଚାର୍ଜ ହେଲାବେଳେ ଆପଣଙ୍କର ଅନୁଭୂତି କିପରି ?', e: 'How was your experience at discharge?' },
      { o: 'ଡାକ୍ତରଖାନାର ୱାର୍ଡଗୁଡ଼ିକର ପରିସ୍କାର ପରିଚ୍ଛନ୍ନତା କିପରି ?', e: 'How is the cleanliness of the wards?' },
      { o: 'ଡାକ୍ତରଖାନାର ଗାଧୁଆଘର ଓ ପାଇଖାନାର ପରିସ୍କାର ପରିଚ୍ଛନ୍ନତା କିପରି ?', e: 'How is the cleanliness of the bathrooms and toilets?' },
      { o: 'ଡାକ୍ତରଖାନାରେ ଦିଆଯାଉଥିବା ବେଡ୍‌ସିଟ ଓ ଚକିଆଖୋଳର ପରିସ୍କାର ପରିଚ୍ଛନ୍ନତା କିପରି ?', e: 'How is the cleanliness of the bedsheets and pillow covers?' },
      { o: 'ଡାକ୍ତରଖାନା ସଂଲଗ୍ନ ଜାଗା ଓ ଡ୍ରେନଗୁଡ଼ିକର ପରିଚ୍ଛନ୍ନତା କିପରି ଥାଏ ?', e: 'How is the cleanliness of the hospital surroundings and drains?' },
      { o: 'ଡାକ୍ତର ନିୟମିତ କାର୍ଯ୍ୟରେ ଆସନ୍ତି କି ?', e: 'Do doctors come to work regularly?' },
      { o: 'ଡାକ୍ତରଙ୍କ ରୋଗୀ ପ୍ରତି ସମ୍ପର୍କ ଓ ଯୋଗାଯୋଗ କିପରି ଥାଏ ?', e: 'How are the doctors\' relationship and communication with patients?' },
      { o: 'ରୋଗୀର ଚିକିତ୍ସା କରିବା ପାଇଁ ଡାକ୍ତର କେତେ ସମୟ ନିଅନ୍ତି ?', e: 'How do you rate the time doctors take to treat the patient?' },
      { o: 'ୱାର୍ଡଗୁଡ଼ିକରେ ସେମାନଙ୍କର କାର୍ଯ୍ୟ ଚଞ୍ଚଳତା କିପରି ?', e: 'How prompt is their work in the wards?' },
      { o: 'ଦିବାରାତ୍ର ୱାର୍ଡଗୁଡ଼ିକରେ ସେମାନେ ଉପଲବ୍ଧ ଥାଆନ୍ତି କି ?', e: 'Are they available in the wards day and night?' },
      { o: 'ନର୍ସମାନଙ୍କ ରୋଗୀପ୍ରତି ସମ୍ପର୍କ ଓ ସ୍ନେହ କିପରି ଥାଏ ?', e: 'How are the nurses\' relationship and care towards patients?' },
      { o: 'ୱାର୍ଡଗୁଡ଼ିକରେ ଥିବା ସହାୟକ ଓ ସହାୟିକାମାନଙ୍କର ଆପଣଙ୍କ ପ୍ରତି ବ୍ୟବହାର କିପରି ?', e: 'How is the behaviour of ward attendants towards you?' },
      { o: 'ଡାକ୍ତର ଲେଖୁଥିବା ସମସ୍ତ ଔଷଧ ହସ୍ପିଟାଲ୍ ରୁ ମିଳେ କି ?', e: 'Do you get all the medicines the doctor prescribes from the hospital?' },
      { o: 'ଡାକ୍ତରଙ୍କ ଚିକିତ୍ସା ଜ୍ଞାନ ଓ କୁଶଳତା ଉପରେ ଆପଣଙ୍କର ବିଚାର କିପରି ?', e: 'What is your opinion of the doctors\' medical knowledge and skill?' },
      { o: 'ଡାକ୍ତରଖାନାରେ ହେଉଥିବା ଚିକିତ୍ସା ପ୍ରଣାଳୀ କିପରି ?', e: 'How is the treatment procedure followed at the hospital?' },
      { o: 'ଡାକ୍ତରଖାନାରେ ସମୟ ଅନୁସାରେ ରୋଗୀକୁ ଖାଦ୍ୟ ମିଳେ କି ?', e: 'Do patients get food on time?' },
      { o: 'ଆପଣଙ୍କ ସାମଗ୍ରିକ ରୋଗୀ ସେବା ଉପରେ କିପରି ସନ୍ତୁଷ୍ଟ ଅଟନ୍ତି ?', e: 'How satisfied are you with the overall patient service?' },
    ],
  },
};

export const MobileFeedbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();

  // QR Parameters
  const hospitalId = searchParams.get('h') || searchParams.get('hospitalId') || '';
  const departmentId = searchParams.get('d') || searchParams.get('departmentId') || '';
  const locationId = searchParams.get('loc') || searchParams.get('locationId') || '';
  const qrToken = searchParams.get('t') || searchParams.get('token') || '';

  // Mode from URL parameter (e.g. ?svc=opd or ?svc=ipd)
  const initialSvc = (searchParams.get('svc') || searchParams.get('type') || '').toLowerCase();

  const [step, setStep] = useState<'choose' | 'form' | 'done'>('choose');
  const [svc, setSvc] = useState<'opd' | 'ipd'>('opd');

  // Form State
  const todayStr = () => {
    const d = new Date();
    const m = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    return `${d.getFullYear()}-${m}-${day}`;
  };

  const [formDate, setFormDate] = useState(todayStr());
  const [patientName, setPatientName] = useState('');
  const [ticketNumber, setTicketNumber] = useState('');
  const [wardName, setWardName] = useState('');
  const [comment, setComment] = useState('');
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [missing, setMissing] = useState<number[]>([]);
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [isError, setIsError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedReceipt, setSubmittedReceipt] = useState<any>(null);

  // Auto-select service if passed in URL
  useEffect(() => {
    if (initialSvc === 'opd' || initialSvc === 'ipd') {
      startForm(initialSvc);
    }
  }, [initialSvc]);

  const startForm = (serviceKey: 'opd' | 'ipd') => {
    setSvc(serviceKey);
    setAnswers({});
    setMissing([]);
    setStatusMsg('');
    setIsError(false);
    setComment('');
    setStep('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectRating = (questionIndex: number, ratingValue: number) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: ratingValue }));
    if (missing.includes(questionIndex)) {
      setMissing((prev) => prev.filter((id) => id !== questionIndex));
    }
    if (statusMsg) {
      setStatusMsg('');
      setIsError(false);
    }
  };

  const handleAddChip = (chipText: string) => {
    setComment((prev) => {
      const clean = chipText.split(' (')[0].replace(/^\+\s*/, '');
      if (!prev) return clean;
      return `${prev}, ${clean}`;
    });
  };

  const handleBackToChoose = () => {
    setStep('choose');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentForm = FORMS[svc];
  const otherSvc = svc === 'opd' ? 'ipd' : 'opd';

  // Real-time progress computation
  const totalQuestions = currentForm.qs.length;
  const answeredCount = useMemo(() => {
    return Object.keys(answers).length;
  }, [answers]);
  const progressPct = Math.round((answeredCount / totalQuestions) * 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const missingIds: number[] = [];

    currentForm.qs.forEach((_, idx) => {
      const qNum = idx + 1;
      if (!answers[qNum]) {
        missingIds.push(qNum);
      }
    });

    if (missingIds.length > 0) {
      setMissing(missingIds);
      setIsError(true);
      setStatusMsg(`ଦୟାକରି ସମସ୍ତ ପ୍ରଶ୍ନର ଉତ୍ତର ଦିଅନ୍ତୁ (${missingIds.length} ବାକି). Please answer all questions.`);
      const firstEl = document.getElementById(`q${missingIds[0]}`);
      if (firstEl) {
        firstEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setSubmitting(true);
    setStatusMsg('');
    setIsError(false);

    try {
      const answersList = currentForm.qs.map((_, idx) => answers[idx + 1]);

      const payload = {
        hospitalId: hospitalId || undefined,
        departmentId: departmentId || undefined,
        locationId: locationId || undefined,
        qrToken: qrToken || undefined,
        language: 'or',
        patientName: patientName.trim() || undefined,
        crNumber: ticketNumber.trim() || undefined,
        patientType: svc === 'opd' ? 'OPD' : 'IPD',
        service: currentForm.abbr,
        hospital: 'DHH Kataka',
        date: formDate,
        patient: patientName.trim(),
        ticket: ticketNumber.trim(),
        ward: currentForm.ward ? wardName.trim() : undefined,
        answers: answersList,
        comments: comment.trim() || undefined,
        submittedAt: new Date().toISOString(),
      };

      const res = await apiClient.post('/feedback/submit', payload);
      setSubmittedReceipt({
        ticketId: res.data?.ticketId || `FB-${Date.now().toString().slice(-6)}`,
        date: formDate,
        service: currentForm.abbr,
        patient: patientName.trim() || 'Anonymous Patient',
      });
      setSubmitting(false);
      setStep('done');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setSubmitting(false);
      setIsError(true);
      setStatusMsg('ପଠାଯାଇପାରିଲା ନାହିଁ । ଇଣ୍ଟରନେଟ୍ ଯାଞ୍ଚ କରି ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ. Could not send. Check your connection and try again.');
    }
  };

  const getScaleIcon = (n: number, isTime?: boolean, isSelected?: boolean) => {
    if (isTime) {
      switch (n) {
        case 1:
          return <FaHourglassHalf />;
        case 2:
          return <FaClock />;
        case 3:
          return <FaStopwatch />;
        case 4:
          return <FaBolt />;
        case 5:
          return <FaRocket />;
        default:
          return null;
      }
    }

    if (isSelected) {
      switch (n) {
        case 1:
          return <FaFaceFrown />;
        case 2:
          return <FaFaceMeh />;
        case 3:
          return <FaFaceSmile />;
        case 4:
          return <FaFaceSmileBeam />;
        case 5:
          return <FaFaceGrinStars />;
        default:
          return null;
      }
    }

    switch (n) {
      case 1:
        return <FaRegFaceFrown />;
      case 2:
        return <FaRegFaceMeh />;
      case 3:
        return <FaRegFaceSmile />;
      case 4:
        return <FaRegFaceSmileBeam />;
      case 5:
        return <FaRegFaceGrinStars />;
      default:
        return null;
    }
  };

  return (
    <div className={`pf-app ${svc}`}>
      <div className="pf-container">
        {/* Header Hero Card */}
        <header className="pf-header-card">
          <div className="pf-gov-pill">
            <FaHospital style={{ marginRight: '4px' }} />
            <span>Govt. of Odisha · ସ୍ୱାସ୍ଥ୍ୟ ଓ ପରିବାର କଲ୍ୟାଣ ବିଭାଗ</span>
          </div>

          <h1 className="pf-header-title">
            DHH KATAKA · ଜିଲ୍ଲା ମୁଖ୍ୟ ଚିକିତ୍ସାଳୟ, କଟକ
          </h1>

          <p className="pf-header-subtitle">
            {step === 'choose' && 'ଆପଣଙ୍କ ମତାମତ · Patient Feedback Portal'}
            {step === 'form' && `${currentForm.abbr} ମତାମତ ଫର୍ମ · ${currentForm.title}`}
            {step === 'done' && 'ଧନ୍ୟବାଦ · Feedback Registered Successfully'}
          </p>

          <p className="pf-header-desc">
            {step === 'choose' && 'District Head Hospital, Cuttack. Please select the hospital service you used.'}
            {step === 'form' && `${currentForm.abbr} Feedback. Rate each item from 1 (Poor) to 5 (Excellent).`}
            {step === 'done' && 'Your feedback has been securely submitted to the hospital management system.'}
          </p>
        </header>

        {/* STEP 1: SERVICE SELECTION (OPD vs IPD) */}
        {step === 'choose' && (
          <section className="pf-services-grid" aria-label="Select Hospital Service">
            {/* OPD Choice Card */}
            <button
              className="pf-service-card opd"
              type="button"
              id="pick-opd"
              onClick={() => startForm('opd')}
            >
              <div className="pf-service-card-icon">
                <FaUserMd />
              </div>
              <div className="pf-service-info">
                <div className="pf-service-top-row">
                  <span className="pf-service-tag">OPD</span>
                  <span className="pf-service-time">⏱️ 10 Questions · ~2 Mins</span>
                </div>
                <h2 className="pf-service-name-od">ବହିଃ-ବିଭାଗ ରୋଗୀ</h2>
                <div className="pf-service-name-en">Outpatient Department Services</div>
                <div className="pf-service-desc">
                  Doctor consultation, prescription, OPD counter & laboratory diagnostics
                </div>
              </div>
              <div className="pf-service-action-arrow">
                <FaChevronRight size={14} />
              </div>
            </button>

            {/* IPD Choice Card */}
            <button
              className="pf-service-card ipd"
              type="button"
              id="pick-ipd"
              onClick={() => startForm('ipd')}
            >
              <div className="pf-service-card-icon">
                <FaProcedures />
              </div>
              <div className="pf-service-info">
                <div className="pf-service-top-row">
                  <span className="pf-service-tag">IPD</span>
                  <span className="pf-service-time">⏱️ 20 Questions · ~4 Mins</span>
                </div>
                <h2 className="pf-service-name-od">ଅନ୍ତଃ-ବିଭାଗ ରୋଗୀ</h2>
                <div className="pf-service-name-en">Inpatient & Ward Services</div>
                <div className="pf-service-desc">
                  Ward admission, doctor rounds, nursing care, hygiene & hospital meals
                </div>
              </div>
              <div className="pf-service-action-arrow">
                <FaChevronRight size={14} />
              </div>
            </button>
          </section>
        )}

        {/* STEP 2: FEEDBACK QUESTIONNAIRE FORM */}
        {step === 'form' && (
          <form onSubmit={handleSubmit} noValidate>
            {/* Sticky Real-Time Progress Bar */}
            <div className="pf-sticky-bar">
              <div className="pf-sticky-top-row">
                <button
                  type="button"
                  className="pf-btn-change-service"
                  onClick={handleBackToChoose}
                >
                  <FaArrowLeft size={12} />
                  <span>ବଦଳାନ୍ତୁ · Change</span>
                </button>
                <div className="pf-progress-badge">
                  {answeredCount} / {totalQuestions} Answered · {progressPct}%
                </div>
              </div>
              <div className="pf-progress-track">
                <div
                  className={`pf-progress-fill ${svc}`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Intro Card */}
            <div className={`pf-intro-card ${svc}`}>
              <div className="pf-intro-header">
                <FaClipboardCheck className="pf-intro-icon" />
                <h2 className="pf-intro-title">{currentForm.title}</h2>
              </div>
              <p className="pf-intro-od">{currentForm.intro}</p>
              <p className="pf-intro-en">{currentForm.introEn}</p>
            </div>

            {/* Patient & Visit Details Card */}
            <div className="pf-details-card">
              <div className="pf-details-header">
                <FaUser style={{ color: 'var(--pf-opd)' }} />
                <span>ରୋଗୀ ଓ ପରିଦର୍ଶନ ବିବରଣୀ · Patient & Visit Details</span>
              </div>

              {/* Date */}
              <div className="pf-field">
                <label className="pf-field-label" htmlFor="f-date">
                  <div className="pf-field-label-left">
                    <FaCalendarAlt className="pf-field-icon" />
                    <span>ତାରିଖ · Date</span>
                  </div>
                </label>
                <input
                  type="date"
                  id="f-date"
                  className="pf-input"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                />
              </div>

              {/* Patient Name */}
              <div className="pf-field">
                <label className="pf-field-label" htmlFor="f-name">
                  <div className="pf-field-label-left">
                    <FaUser className="pf-field-icon" />
                    <span>ରୋଗୀର ନାମ · Patient name</span>
                  </div>
                  <span className="pf-field-optional">ଇଚ୍ଛାଧୀନ · Optional</span>
                </label>
                <input
                  type="text"
                  id="f-name"
                  className="pf-input"
                  autoComplete="off"
                  placeholder="e.g. Ramesh Sahoo"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                />
              </div>

              {/* Ticket Number */}
              <div className="pf-field">
                <label className="pf-field-label" htmlFor="f-ticket">
                  <div className="pf-field-label-left">
                    <FaIdCard className="pf-field-icon" />
                    <span>{currentForm.ticketOd} · {currentForm.ticketEn}</span>
                  </div>
                  <span className="pf-field-optional">ଇଚ୍ଛାଧୀନ · Optional</span>
                </label>
                <input
                  type="text"
                  id="f-ticket"
                  className="pf-input"
                  autoComplete="off"
                  placeholder={svc === 'opd' ? 'e.g. OPD-12345' : 'e.g. IPD-98765'}
                  value={ticketNumber}
                  onChange={(e) => setTicketNumber(e.target.value)}
                />
              </div>

              {/* Ward (for IPD) */}
              {currentForm.ward && (
                <div className="pf-field">
                  <label className="pf-field-label" htmlFor="f-ward">
                    <div className="pf-field-label-left">
                      <FaBed className="pf-field-icon" />
                      <span>ୱାର୍ଡ / ବେଡ୍ ନଂ · Ward / Bed no.</span>
                    </div>
                    <span className="pf-field-optional">ଇଚ୍ଛାଧୀନ · Optional</span>
                  </label>
                  <input
                    type="text"
                    id="f-ward"
                    className="pf-input"
                    autoComplete="off"
                    placeholder="e.g. Male Medical Ward, Bed 12"
                    value={wardName}
                    onChange={(e) => setWardName(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Questions List */}
            <ol className="pf-questions-list">
              {currentForm.qs.map((q, idx) => {
                const qNum = idx + 1;
                const isMissing = missing.includes(qNum);
                const selectedVal = answers[qNum];

                return (
                  <li
                    key={qNum}
                    className={`pf-question-card ${isMissing ? 'missing' : ''}`}
                    id={`q${qNum}`}
                  >
                    <div className="pf-q-top">
                      <div className="pf-q-left">
                        <span className="pf-q-num">
                          {qNum < 10 ? `0${qNum}` : qNum}
                        </span>
                        <div className="pf-q-text">
                          <div className="pf-q-od">{q.o}</div>
                          <div className="pf-q-en">{q.e}</div>
                        </div>
                      </div>

                      {selectedVal ? (
                        <span className="pf-q-status-badge answered">
                          <FaCheck size={9} style={{ marginRight: '3px' }} />
                          Answered
                        </span>
                      ) : (
                        <span className="pf-q-status-badge pending">
                          Pending
                        </span>
                      )}
                    </div>

                    {/* 5-Point Segmented Rating Scale */}
                    <div className="pf-scale-grid">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <label key={n} className="pf-rate-opt">
                          <input
                            type="radio"
                            name={`q${qNum}`}
                            value={String(n)}
                            checked={selectedVal === n}
                            onChange={() => handleSelectRating(qNum, n)}
                          />
                          <div className={`pf-rate-btn rate-${n}`}>
                            <div className="pf-rate-icon">
                              {getScaleIcon(n, q.time, selectedVal === n)}
                            </div>
                            <div className="pf-rate-num">{n}</div>
                            <div className="pf-rate-od">
                              {(q.time ? TIME_OD : SCALE_OD)[n - 1]}
                            </div>
                            <div className="pf-rate-en">
                              {(q.time ? TIME_EN : SCALE_EN)[n - 1]}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>

                    {/* Dynamic feedback indicator when selected */}
                    {selectedVal && (
                      <div className={`pf-selected-callout rate-${selectedVal}`}>
                        <FaCheck size={10} />
                        <span>
                          ଆପଣ ବାଛିଛନ୍ତି: {selectedVal} · {(q.time ? TIME_OD : SCALE_OD)[selectedVal - 1]} ({ (q.time ? TIME_EN : SCALE_EN)[selectedVal - 1] })
                        </span>
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>

            {/* Suggestions & Quick Chips Card */}
            <div className="pf-suggestions-card">
              <label className="pf-field-label" htmlFor="comment">
                <div className="pf-field-label-left">
                  <FaCommentDots className="pf-field-icon" />
                  <span>ଆପଣଙ୍କ ପରାମର୍ଶ · Suggestions</span>
                </div>
                <span className="pf-field-optional">ଇଚ୍ଛାଧୀନ · Optional</span>
              </label>

              {/* Quick suggestion chips */}
              <div className="pf-chips-list">
                {QUICK_CHIPS.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="pf-chip"
                    onClick={() => handleAddChip(chip)}
                  >
                    {chip}
                  </button>
                ))}
              </div>

              <textarea
                id="comment"
                className="pf-textarea"
                maxLength={500}
                placeholder="ଆପଣଙ୍କ କିଛି ପରାମର୍ଶ ଥିଲେ ଏଠାରେ ଲେଖନ୍ତୁ... Share any suggestions or thoughts to improve patient care..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            {/* Actions & Submit Button */}
            <div className="pf-actions-wrap">
              {isError && (
                <div className="pf-error-banner" role="alert">
                  <FaExclamationCircle size={16} />
                  <span>{statusMsg}</span>
                </div>
              )}

              <button
                className="pf-btn-submit"
                type="submit"
                id="submit"
                disabled={submitting}
              >
                <FaPaperPlane />
                <span>
                  {submitting ? 'ପଠାଯାଉଛି... Submitting...' : 'ଦାଖଲ କରନ୍ତୁ · Submit Feedback'}
                </span>
              </button>

              <button
                type="button"
                className="pf-btn-change-service"
                onClick={handleBackToChoose}
                style={{ alignSelf: 'center', marginTop: '4px' }}
              >
                <FaArrowLeft size={12} />
                <span>ସେବା ବଦଳାନ୍ତୁ · Change Service</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: DONE CONFIRMATION / DIGITAL RECEIPT */}
        {step === 'done' && (
          <section className="pf-done-card">
            <div className="pf-done-shield">
              <FaCheckCircle />
            </div>

            <h2 className="pf-done-title">ଧନ୍ୟବାଦ · Thank You!</h2>

            <p style={{ color: 'var(--pf-text-muted)', margin: 0 }}>
              ଆପଣଙ୍କ ମତାମତ ସଫଳତାର ସହ ଗୃହୀତ ହୋଇଛି ।
              <br />
              <span style={{ fontSize: '0.9rem', color: 'var(--pf-text-light)' }}>
                Your feedback has been securely recorded to enhance patient care quality.
              </span>
            </p>

            {/* Official Digital Acknowledgment Receipt */}
            <div className="pf-done-receipt">
              <div className="pf-receipt-row">
                <span className="pf-receipt-label">Hospital:</span>
                <span className="pf-receipt-val">DHH KATAKA (Cuttack)</span>
              </div>
              <div className="pf-receipt-row">
                <span className="pf-receipt-label">Service:</span>
                <span className="pf-receipt-val">{submittedReceipt?.service || currentForm.abbr}</span>
              </div>
              <div className="pf-receipt-row">
                <span className="pf-receipt-label">Reference ID:</span>
                <span className="pf-receipt-val" style={{ color: 'var(--pf-opd-dark)' }}>
                  {submittedReceipt?.ticketId || 'FB-2026-CONFIRMED'}
                </span>
              </div>
              <div className="pf-receipt-row">
                <span className="pf-receipt-label">Date:</span>
                <span className="pf-receipt-val">{submittedReceipt?.date || formDate}</span>
              </div>
              <div className="pf-receipt-row">
                <span className="pf-receipt-label">Status:</span>
                <span className="pf-receipt-val" style={{ color: '#16a34a' }}>
                  ✓ Verified & Synced
                </span>
              </div>
            </div>

            {/* Restart Actions */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                type="button"
                className="pf-btn-again"
                onClick={() => startForm(otherSvc)}
              >
                <FaRedo size={13} />
                <span>
                  {FORMS[otherSvc].abbr} ପାଇଁ ମଧ୍ୟ ମତାମତ ଦିଅନ୍ତୁ · Also Rate {FORMS[otherSvc].abbr}
                </span>
              </button>

              <button
                type="button"
                className="pf-btn-again"
                onClick={handleBackToChoose}
              >
                <span>ପ୍ରାରମ୍ଭିକ ପୃଷ୍ଠା · Back to Home</span>
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
