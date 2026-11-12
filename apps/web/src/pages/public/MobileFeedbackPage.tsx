import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { PatientType } from '@esushrut/shared';
import {
  FaHospital,
  FaUserMd,
  FaProcedures,
  FaCheckCircle,
  FaArrowRight,
  FaArrowLeft,
  FaCalendarAlt,
  FaUser,
  FaIdCard,
  FaBed,
  FaCommentDots,
  FaShieldAlt,
  FaClock,
  FaCheck,
  FaPaperPlane,
} from 'react-icons/fa';
import './PatientFeedback.css';

const SCALE_OD = ['ନ୍ୟୂନ', 'ଚଳଣୀୟ', 'ଭଲ', 'ବହୁତ ଭଲ', 'ଉତ୍କୃଷ୍ଟ'];
const SCALE_EN = ['Poor', 'Fair', 'Good', 'Very good', 'Excellent'];
const TIME_OD = ['୩୦ ମିନିଟ୍ ଅଧିକ', '୧୦-୩୦ ମିନିଟ୍', '୫-୧୦ ମିନିଟ୍', '୫ ମିନିଟରୁ କମ୍', 'ସଙ୍ଗେ ସଙ୍ଗେ'];
const TIME_EN = ['Over 30 min', '10-30 min', '5-10 min', 'Under 5 min', 'Immediately'];

const RATING_EMOJIS = ['😞', '🙁', '😐', '🙂', '🌟'];
const TIME_EMOJIS = ['⏳', '⏱️', '⚡', '🚀', '✨'];

const QUICK_SUGGESTIONS = [
  'ଡାକ୍ତର ଉତ୍ତମ ଚିକିତ୍ସା କଲେ',
  'ଔଷଧ ସମସ୍ତ ମିଳିଲା',
  'ସଫାସୁତୁରା ବହୁତ ଭଲ ଥିଲା',
  'କର୍ମଚାରୀଙ୍କ ସହଯୋଗ ଭଲ',
  'ଲ୍ୟାବ୍ ଓ ଏକ୍ସ-ରେ ସେବା ଶୀଘ୍ର ହେଲା',
];

interface QuestionItem {
  o: string;
  e: string;
  time?: boolean;
}

interface FormConfig {
  abbr: 'OPD' | 'IPD';
  title: string;
  titleEn: string;
  intro: string;
  introEn: string;
  ticketOd: string;
  ticketEn: string;
  ward: boolean;
  qs: QuestionItem[];
}

const FORMS: Record<'opd' | 'ipd', FormConfig> = {
  opd: {
    abbr: 'OPD',
    title: 'ବହିଃ-ବିଭାଗ ରୋଗୀଙ୍କ ମତାମତ ଫର୍ମ',
    titleEn: 'Outpatient Feedback Form (OPD)',
    intro:
      'ପ୍ରିୟ ବନ୍ଧୁ, ଆପଣ ନିଜର ବହୁମୂଲ୍ୟ ସମୟ ଖର୍ଚ୍ଚ କରି ଚିକିତ୍ସା ନିମନ୍ତେ ଚିକିତ୍ସାଳୟକୁ ଆସିଛନ୍ତି । ଆପଣଙ୍କର ସୁବିଧା ଓ ସନ୍ତୁଷ୍ଟି ଆମର ପ୍ରାଥମିକତା । ଦୟାକରି ଆପଣଙ୍କର ନିରପେକ୍ଷ ମତାମତ ଜଣାଇ ସେବା ଉନ୍ନତିରେ ସହଯୋଗ କରନ୍ତୁ ।',
    introEn:
      'Outpatient feedback form. Please share your genuine views across 10 touchpoints to help improve hospital services. Rate each item from 1 (Poor) to 5 (Excellent).',
    ticketOd: 'ବହିଃ-ବିଭାଗ ଟିକେଟ ନଂ',
    ticketEn: 'OPD ticket no.',
    ward: false,
    qs: [
      { o: 'ଡାକ୍ତରଖାନାରେ ପର୍ଯ୍ୟାପ୍ତ ସୂଚନା ଉପଲବ୍ଧ ଅଛି କି ?', e: 'Is enough information available at the hospital?' },
      { o: 'ପଞ୍ଜିକରଣ କେନ୍ଦ୍ରରେ କେତେ ସମୟ ଅପେକ୍ଷା କରିବାକୁ ପଡେ ?', e: 'How long do you wait at the registration counter?', time: true },
      { o: 'ହସ୍ପିଟାଲର କର୍ମଚାରୀଙ୍କ ବ୍ୟବହାର ଓ ଶୈଳୀ କିପରି ଅଟେ ?', e: 'How are the behaviour and manner of the hospital staff?' },
      { o: 'ବହିଃ ବିଭାଗ, ଗାଧୁଆଘର, ପାଇଖାନାର ସଫାସୁତୁରା କିପରି ଅଟେ ?', e: 'How is the cleanliness of the OPD, bathrooms and toilets?' },
      { o: 'ଆପଣଙ୍କ ପ୍ରତି ଡାକ୍ତରଙ୍କ ବ୍ୟବହାର ଓ ଯୋଗାଯୋଗ କିପରି ଅଟେ ?', e: "How are the doctor's behaviour and communication with you?" },
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
    titleEn: 'Inpatient Ward Feedback Form (IPD)',
    intro:
      'ପ୍ରିୟ ବନ୍ଧୁ, ଆପଣ ଏହି ଚିକିତ୍ସାଳୟରେ ନିଜର ବା ସମ୍ପର୍କୀୟଙ୍କ ଚିକିତ୍ସା ନିମନ୍ତେ ୱାର୍ଡରେ ରହିଥିଲେ । ଅନ୍ତଃ-ବିଭାଗ ରୋଗୀମାନଙ୍କୁ ଦିଆଯାଉଥିବା ସୁବିଧା, ସୁଯୋଗ, ଡାକ୍ତର ଓ ନର୍ସିଂ ସେବା ଉପରେ ଆପଣଙ୍କର ଅଭିଜ୍ଞତା ଜଣାଇବାକୁ ଅନୁରୋଧ ।',
    introEn:
      'Inpatient feedback form. Please share your experience regarding ward facilities, bed hygiene, doctor rounds, and nursing care. Rate each item from 1 (Poor) to 5 (Excellent).',
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
      { o: 'ଡାକ୍ତରଙ୍କ ରୋଗୀ ପ୍ରତି ସମ୍ପର୍କ ଓ ଯୋଗାଯୋଗ କିପରି ଥାଏ ?', e: "How are the doctors' relationship and communication with patients?" },
      { o: 'ରୋଗୀର ଚିକିତ୍ସା କରିବା ପାଇଁ ଡାକ୍ତର କେତେ ସମୟ ନିଅନ୍ତି ?', e: 'How do you rate the time doctors take to treat the patient?' },
      { o: 'ୱାର୍ଡଗୁଡ଼ିକରେ ସେମାନଙ୍କର କାର୍ଯ୍ୟ ଚଞ୍ଚଳତା କିପରି ?', e: 'How prompt is their work in the wards?' },
      { o: 'ଦିବାରାତ୍ର ୱାର୍ଡଗୁଡ଼ିକରେ ସେମାନେ ଉପଲବ୍ଧ ଥାଆନ୍ତି କି ?', e: 'Are they available in the wards day and night?' },
      { o: 'ନର୍ସମାନଙ୍କ ରୋଗୀପ୍ରତି ସମ୍ପର୍କ ଓ ସ୍ନେହ କିପରି ଥାଏ ?', e: "How are the nurses' relationship and care towards patients?" },
      { o: 'ୱାର୍ଡଗୁଡ଼ିକରେ ଥିବା ସହାୟକ ଓ ସହାୟିକାମାନଙ୍କର ଆପଣଙ୍କ ପ୍ରତି ବ୍ୟବହାର କିପରି ?', e: 'How is the behaviour of ward attendants towards you?' },
      { o: 'ଡାକ୍ତର ଲେଖୁଥିବା ସମସ୍ତ ଔଷଧ ହସ୍ପିଟାଲ୍ ରୁ ମିଳେ କି ?', e: 'Do you get all the medicines the doctor prescribes from the hospital?' },
      { o: 'ଡାକ୍ତରଙ୍କ ଚିକିତ୍ସା ଜ୍ଞାନ ଓ କୁଶଳତା ଉପରେ ଆପଣଙ୍କର ବିଚାର କିପରି ?', e: "What is your opinion of the doctors' medical knowledge and skill?" },
      { o: 'ଡାକ୍ତରଖାନାରେ ହେଉଥିବା ଚିକିତ୍ସା ପ୍ରଣାଳୀ କିପରି ?', e: 'How is the treatment procedure followed at the hospital?' },
      { o: 'ଡାକ୍ତରଖାନାରେ ସମୟ ଅନୁସାରେ ରୋଗୀକୁ ଖାଦ୍ୟ ମିଳେ କି ?', e: 'Do patients get food on time?' },
      { o: 'ଆପଣଙ୍କ ସାମଗ୍ରିକ ରୋଗୀ ସେବା ଉପରେ କିପରି ସନ୍ତୁଷ୍ଟ ଅଟନ୍ତି ?', e: 'How satisfied are you with the overall patient service?' },
    ],
  },
};

function getTodayString() {
  const d = new Date();
  const m = ('0' + (d.getMonth() + 1)).slice(-2);
  const day = ('0' + d.getDate()).slice(-2);
  return `${d.getFullYear()}-${m}-${day}`;
}

export const MobileFeedbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();

  const hospitalId = searchParams.get('h') || '';
  const departmentId = searchParams.get('d') || '';
  const locationId = searchParams.get('loc') || '';
  const qrToken = searchParams.get('t') || '';

  const [hospital, setHospital] = useState<any>(null);
  const [department, setDepartment] = useState<any>(null);

  // App step: 'choose' | 'form' | 'done'
  const [step, setStep] = useState<'choose' | 'form' | 'done'>('choose');
  const [svc, setSvc] = useState<'opd' | 'ipd'>('opd');

  // Form Fields
  const [date, setDate] = useState<string>(getTodayString());
  const [patientName, setPatientName] = useState<string>('');
  const [ticket, setTicket] = useState<string>('');
  const [ward, setWard] = useState<string>('');
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [comment, setComment] = useState<string>('');

  // Missing questions tracking
  const [missing, setMissing] = useState<number[]>([]);
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [statusErr, setStatusErr] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [ticketId, setTicketId] = useState<string | null>(null);

  // Load hospital / dept info if parameters are available
  useEffect(() => {
    const t = searchParams.get('type')?.toLowerCase();
    if (t === 'opd' || t === 'ipd') {
      setSvc(t as 'opd' | 'ipd');
      setStep('form');
    }
  }, [searchParams]);

  useEffect(() => {
    async function loadMeta() {
      if (!departmentId) return;
      try {
        const res = await apiClient.get(`/departments/${departmentId}`);
        setDepartment(res.data);
        if (res.data?.hospital) {
          setHospital(res.data.hospital);
        }
      } catch (e) {
        // Silently continue with defaults
      }
    }
    loadMeta();
  }, [departmentId]);

  const handleSelectService = (selectedSvc: 'opd' | 'ipd') => {
    setSvc(selectedSvc);
    setAnswers({});
    setMissing([]);
    setStatusMsg('');
    setStatusErr(false);
    setComment('');
    setStep('form');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOptionSelect = (qIndex: number, val: number) => {
    setAnswers((prev) => ({ ...prev, [qIndex]: val }));
    setMissing((prev) => prev.filter((n) => n !== qIndex + 1));
    setStatusMsg('');
    setStatusErr(false);
  };

  const handleBackToChoose = () => {
    setStatusMsg('');
    setStatusErr(false);
    setStep('choose');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddChip = (text: string) => {
    setComment((prev) => (prev ? `${prev}, ${text}` : text));
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();

    const f = FORMS[svc];
    const missingIndices: number[] = [];
    const answersList: number[] = [];

    f.qs.forEach((_, i) => {
      const val = answers[i];
      if (val !== undefined && val !== null) {
        answersList.push(val);
      } else {
        missingIndices.push(i + 1);
      }
    });

    if (missingIndices.length > 0) {
      setMissing(missingIndices);
      setStatusErr(true);
      setStatusMsg(
        `ଦୟାକରି ସମସ୍ତ ପ୍ରଶ୍ନର ଉତ୍ତର ଦିଅନ୍ତୁ (${missingIndices.length} ଟି ବାକି ଅଛି). Please answer all questions before submitting.`,
      );
      const firstMissingEl = document.getElementById(`q${missingIndices[0]}`);
      if (firstMissingEl) {
        firstMissingEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);
    setStatusErr(false);
    setStatusMsg('ଦାଖଲ ହେଉଛି... Submitting your feedback...');

    const payload = {
      hospitalId: hospitalId || undefined,
      departmentId: departmentId || undefined,
      locationId: locationId || undefined,
      qrToken: qrToken || undefined,
      service: f.abbr,
      hospital: hospital?.name || 'DHH KATAKA',
      date,
      patient: patientName.trim(),
      ticket: ticket.trim(),
      ward: ward.trim(),
      answers: answersList,
      comment: comment.trim(),
      patientType: f.abbr === 'IPD' ? PatientType.IPD : PatientType.OPD,
      language: 'or' as const,
      submittedAt: new Date().toISOString(),
    };

    try {
      const res = await apiClient.post('/feedback/submit', payload);
      setTicketId(res.data?.ticketId || 'DHH-FB-' + Date.now().toString().slice(-6));
      setIsSubmitting(false);
      setStep('done');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setIsSubmitting(false);
      setStatusErr(true);
      const serverMsg = err.response?.data?.message;
      setStatusMsg(
        serverMsg ||
          'ପଠାଯାଇପାରିଲା ନାହିଁ । ଇଣ୍ଟରନେଟ୍ ଯାଞ୍ଚ କରି ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ. Could not submit. Please check your connection and try again.',
      );
    }
  };

  const f = FORMS[svc];
  const otherSvc: 'opd' | 'ipd' = svc === 'opd' ? 'ipd' : 'opd';

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = f?.qs?.length || 10;
  const progressPct = Math.round((answeredCount / totalQuestions) * 100);

  return (
    <div className="patient-feedback-app">
      <main>
        {/* Official Hospital Top Header */}
        <header className="pf-header">
          <div className="pf-header-brand">
            <div className="pf-emblem">
              <FaHospital />
            </div>
            <div className="pf-header-titles">
              <div className="pf-hospital-name">
                {hospital?.name || 'DHH KATAKA'}
              </div>
              <div className="pf-hospital-sub">District Head Hospital · Cuttack</div>
              <div className="pf-hospital-odia">ଜିଲ୍ଲା ମୁଖ୍ୟ ଚିକିତ୍ସାଳୟ, କଟକ</div>
            </div>
            <div className="pf-gov-tag">
              <span>Odisha</span>
            </div>
          </div>

          {step === 'choose' && (
            <div className="pf-intro-heading">
              <h1 className="pf-intro-title">ଆପଣଙ୍କ ମତାମତ</h1>
              <p className="pf-intro-desc">
                Patient Experience Survey · Please choose the hospital service you used today.
              </p>
            </div>
          )}
        </header>

        {/* STEP 1: CHOOSE SERVICE SCREEN (OPD vs IPD) */}
        {step === 'choose' && (
          <section className="pf-choices-container" aria-label="Choose Hospital Service">
            {/* OPD Option Card */}
            <button
              className="pf-choice-card opd-card"
              type="button"
              id="pick-opd"
              onClick={() => handleSelectService('opd')}
            >
              <div className="pf-choice-top">
                <div className="pf-choice-badge-wrap">
                  <div className="pf-choice-icon">
                    <FaUserMd />
                  </div>
                  <div className="pf-choice-title-area">
                    <span className="pf-choice-abbr">OPD</span>
                    <span className="pf-choice-name-od">ବହିଃ-ବିଭାଗ ରୋଗୀ</span>
                  </div>
                </div>
                <div className="pf-choice-pills">
                  <span className="pf-pill pf-pill-teal">
                    <FaClock size={11} /> 2 Mins
                  </span>
                  <span className="pf-pill pf-pill-neutral">10 Questions</span>
                </div>
              </div>

              <p className="pf-choice-desc">
                Outpatient clinic consultation, registration counters, Niramaya pharmacy, diagnostic lab & X-ray services.
              </p>

              <div className="pf-choice-action">
                <span>Start OPD Survey · ମତାମତ ଦିଅନ୍ତୁ</span>
                <FaArrowRight />
              </div>
            </button>

            {/* IPD Option Card */}
            <button
              className="pf-choice-card ipd-card"
              type="button"
              id="pick-ipd"
              onClick={() => handleSelectService('ipd')}
            >
              <div className="pf-choice-top">
                <div className="pf-choice-badge-wrap">
                  <div className="pf-choice-icon">
                    <FaProcedures />
                  </div>
                  <div className="pf-choice-title-area">
                    <span className="pf-choice-abbr">IPD</span>
                    <span className="pf-choice-name-od">ଅନ୍ତଃ-ବିଭାଗ ରୋଗୀ</span>
                  </div>
                </div>
                <div className="pf-choice-pills">
                  <span className="pf-pill pf-pill-indigo">
                    <FaClock size={11} /> 4 Mins
                  </span>
                  <span className="pf-pill pf-pill-neutral">20 Questions</span>
                </div>
              </div>

              <p className="pf-choice-desc">
                Inpatient ward admission, bedsheets & hygiene, doctor visits, nursing care, meals on time & discharge.
              </p>

              <div className="pf-choice-action">
                <span>Start IPD Survey · ମତାମତ ଦିଅନ୍ତୁ</span>
                <FaArrowRight />
              </div>
            </button>

            {/* Privacy & Quality Commitment Box */}
            <div className="pf-trust-box">
              <FaShieldAlt className="pf-trust-icon" />
              <div>
                <strong>100% Confidential & Secure</strong>
                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                  Your honest feedback is directly monitored by the DHH Kataka Quality Assurance Team to improve citizen healthcare services.
                </div>
              </div>
            </div>
          </section>
        )}

        {/* STEP 2: FEEDBACK QUESTIONS FORM */}
        {step === 'form' && (
          <form data-svc={svc} onSubmit={handleSubmit} noValidate>
            {/* Sticky Top Navigation & Progress */}
            <div className="pf-sticky-nav">
              <div className="pf-sticky-content">
                <button
                  type="button"
                  className="pf-btn-back"
                  onClick={handleBackToChoose}
                >
                  <FaArrowLeft size={12} />
                  <span>ବଦଳାନ୍ତୁ · Change</span>
                </button>

                <div className="pf-progress-wrap">
                  <div className="pf-progress-meta">
                    <span>
                      {f.abbr} · {answeredCount} / {totalQuestions}
                    </span>
                    <span>{progressPct}%</span>
                  </div>
                  <div className="pf-progress-track">
                    <div
                      className="pf-progress-bar"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pf-form-body">
              {/* Form Intro Card */}
              <div className="pf-form-intro-card">
                <h2 className="pf-form-intro-title">
                  {f.abbr} · {f.title}
                </h2>
                <p className="pf-form-intro-od">{f.intro}</p>
                <p className="pf-form-intro-en">{f.introEn}</p>
              </div>

              {/* Patient Details Card */}
              <div className="pf-details-card">
                <h3 className="pf-card-title">
                  <FaUser className="text-muted" size={14} />
                  <span>ରୋଗୀ ବିବରଣୀ · Patient Details</span>
                </h3>

                {/* Date */}
                <div className="pf-input-group">
                  <label htmlFor="f-date" className="pf-input-label">
                    <span>ତାରିଖ · Date</span>
                  </label>
                  <div className="pf-input-wrapper">
                    <FaCalendarAlt className="pf-input-icon" />
                    <input
                      type="date"
                      id="f-date"
                      name="f-date"
                      className="pf-input-field"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                </div>

                {/* Patient Name */}
                <div className="pf-input-group">
                  <label htmlFor="f-name" className="pf-input-label">
                    <span>ରୋଗୀର ନାମ · Patient Name</span>
                    <span className="pf-input-optional">(ଇଚ୍ଛାଧୀନ · Optional)</span>
                  </label>
                  <div className="pf-input-wrapper">
                    <FaUser className="pf-input-icon" />
                    <input
                      type="text"
                      id="f-name"
                      name="f-name"
                      placeholder="e.g. Ramesh Kumar"
                      className="pf-input-field"
                      autoComplete="off"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                    />
                  </div>
                </div>

                {/* Ticket Number */}
                <div className="pf-input-group">
                  <label htmlFor="f-ticket" className="pf-input-label">
                    <span>{f.ticketOd} · {f.ticketEn}</span>
                    <span className="pf-input-optional">(ଇଚ୍ଛାଧୀନ · Optional)</span>
                  </label>
                  <div className="pf-input-wrapper">
                    <FaIdCard className="pf-input-icon" />
                    <input
                      type="text"
                      id="f-ticket"
                      name="f-ticket"
                      placeholder={svc === 'opd' ? 'e.g. OPD-12345' : 'e.g. IPD-8942'}
                      className="pf-input-field"
                      autoComplete="off"
                      value={ticket}
                      onChange={(e) => setTicket(e.target.value)}
                    />
                  </div>
                </div>

                {/* Ward (IPD Only) */}
                {f.ward && (
                  <div className="pf-input-group">
                    <label htmlFor="f-ward" className="pf-input-label">
                      <span>ୱାର୍ଡ · Ward Name / Bed No.</span>
                      <span className="pf-input-optional">(ଇଚ୍ଛାଧୀନ · Optional)</span>
                    </label>
                    <div className="pf-input-wrapper">
                      <FaBed className="pf-input-icon" />
                      <input
                        type="text"
                        id="f-ward"
                        name="f-ward"
                        placeholder="e.g. Female Medical Ward - Bed 14"
                        className="pf-input-field"
                        autoComplete="off"
                        value={ward}
                        onChange={(e) => setWard(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Questions List */}
              <ol className="pf-qlist">
                {f.qs.map((q, i) => {
                  const isAnswered = answers[i] !== undefined && answers[i] !== null;
                  const isMissing = missing.includes(i + 1);

                  return (
                    <li
                      key={i}
                      className={`pf-qcard ${isAnswered ? 'answered' : ''} ${
                        isMissing ? 'missing' : ''
                      }`}
                      id={`q${i + 1}`}
                    >
                      <div className="pf-qheader">
                        <div className="pf-qnum-badge">
                          {isAnswered ? <FaCheck size={12} /> : i + 1}
                        </div>
                        <div className="pf-qtext-wrap">
                          <span className="pf-qtext-od">{q.o}</span>
                          <span className="pf-qtext-en">{q.e}</span>
                        </div>
                      </div>

                      {/* 5-Point Rating Buttons Grid */}
                      <div className="pf-scale-grid">
                        {[1, 2, 3, 4, 5].map((n) => {
                          const isSelected = answers[i] === n;
                          const emoji = (q.time ? TIME_EMOJIS : RATING_EMOJIS)[n - 1];
                          const labelOd = (q.time ? TIME_OD : SCALE_OD)[n - 1];
                          const labelEn = (q.time ? TIME_EN : SCALE_EN)[n - 1];

                          return (
                            <label
                              className={`pf-rating-btn val-${n} ${isSelected ? 'selected' : ''}`}
                              key={n}
                            >
                              <input
                                type="radio"
                                name={`q${i + 1}`}
                                value={String(n)}
                                checked={isSelected}
                                onChange={() => handleOptionSelect(i, n)}
                              />
                              <div className="pf-rating-tile">
                                <span className="pf-rating-emoji">{emoji}</span>
                                <span className="pf-rating-number">{n}</span>
                                <span className="pf-rating-od">{labelOd}</span>
                                <span className="pf-rating-en">{labelEn}</span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </li>
                  );
                })}
              </ol>

              {/* Suggestions / Remarks Card */}
              <div className="pf-comment-card">
                <h3 className="pf-card-title">
                  <FaCommentDots className="text-muted" size={14} />
                  <span>ଆପଣଙ୍କ ପରାମର୍ଶ · Suggestions (Optional)</span>
                </h3>

                <textarea
                  id="comment"
                  className="pf-textarea"
                  maxLength={500}
                  placeholder="ଆପଣଙ୍କର କୌଣସି ଅଭିଜ୍ଞତା, ସନ୍ତୁଷ୍ଟି କିମ୍ବା ଉନ୍ନତି ପାଇଁ ପରାମର୍ଶ ଥିଲେ ଏଠାରେ ଲେଖନ୍ତୁ... Share any compliments, issues or suggestions for hospital improvement..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />

                <div className="small text-muted fw-semibold">
                  Quick tags (ଟ୍ୟାପ୍ କରି ଯୋଡ଼ନ୍ତୁ):
                </div>
                <div className="pf-chip-wrap">
                  {QUICK_SUGGESTIONS.map((tag) => (
                    <button
                      type="button"
                      key={tag}
                      className="pf-chip"
                      onClick={() => handleAddChip(tag)}
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sticky Bottom Submission Bar */}
            <div className="pf-sticky-footer">
              {statusMsg && (
                <div className={`pf-alert-banner ${statusErr ? 'err' : ''}`}>
                  <span>{statusMsg}</span>
                </div>
              )}

              <button
                className="pf-btn-submit"
                type="submit"
                id="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span>ଦାଖଲ ହେଉଛି... Submitting...</span>
                ) : (
                  <>
                    <FaPaperPlane size={16} />
                    <span>
                      ମତାମତ ଦାଖଲ କରନ୍ତୁ · Submit Feedback ({answeredCount}/{totalQuestions})
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: DONE / CONFIRMATION SCREEN */}
        {step === 'done' && (
          <section className="pf-done-screen">
            <div className="pf-done-shield">
              <FaCheckCircle />
            </div>

            <h2 className="pf-done-title">ଧନ୍ୟବାଦ · Thank You!</h2>
            <p className="pf-done-sub">
              ଆପଣଙ୍କ ବହୁମୂଲ୍ୟ ମତାମତ ସଫଳତାର ସହିତ ଗ୍ରହଣ କରାଗଲା । Your valuable feedback has been submitted successfully to DHH KATAKA.
            </p>

            {/* Receipt Summary Card */}
            <div className="pf-receipt-card">
              <div className="pf-receipt-row">
                <span className="pf-receipt-label">Hospital</span>
                <span className="pf-receipt-value">DHH KATAKA</span>
              </div>
              <div className="pf-receipt-row">
                <span className="pf-receipt-label">Service Stream</span>
                <span className="pf-receipt-value" style={{ color: 'var(--accent)' }}>
                  {svc.toUpperCase()} ({svc === 'opd' ? 'Outpatient' : 'Inpatient'})
                </span>
              </div>
              <div className="pf-receipt-row">
                <span className="pf-receipt-label">Submission Date</span>
                <span className="pf-receipt-value">{date}</span>
              </div>
              {ticketId && (
                <div className="pf-receipt-row">
                  <span className="pf-receipt-label">Reference ID</span>
                  <span className="pf-receipt-value text-success">{ticketId}</span>
                </div>
              )}
              {patientName && (
                <div className="pf-receipt-row">
                  <span className="pf-receipt-label">Patient Name</span>
                  <span className="pf-receipt-value">{patientName}</span>
                </div>
              )}
            </div>

            <div style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: 440 }}>
              District Head Hospital, Cuttack is committed to providing quality healthcare to every citizen. ଆପଣଙ୍କ ସୁସ୍ଥ ଜୀବନ କାମନା କରୁଛୁ ।
            </div>

            <button
              className="pf-btn-restart"
              type="button"
              id="again"
              onClick={() => handleSelectService(otherSvc)}
            >
              {otherSvc === 'ipd'
                ? 'ଅନ୍ତଃ-ବିଭାଗ ପାଇଁ ମଧ୍ୟ ମତାମତ ଦିଅନ୍ତୁ · Also Rate IPD Wards'
                : 'ବହିଃ-ବିଭାଗ ପାଇଁ ମଧ୍ୟ ମତାମତ ଦିଅନ୍ତୁ · Also Rate OPD'}
              <FaArrowRight size={14} />
            </button>
          </section>
        )}
      </main>
    </div>
  );
};
