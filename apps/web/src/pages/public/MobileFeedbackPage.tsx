import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiClient } from '../../api/client';
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

  const handleBackToChoose = () => {
    setStep('choose');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const f = FORMS[svc];
    const missingIds: number[] = [];

    f.qs.forEach((_, idx) => {
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
      const answersList = f.qs.map((_, idx) => answers[idx + 1]);

      const payload = {
        hospitalId: hospitalId || undefined,
        departmentId: departmentId || undefined,
        locationId: locationId || undefined,
        qrToken: qrToken || undefined,
        language: 'or',
        patientName: patientName.trim() || undefined,
        crNumber: ticketNumber.trim() || undefined,
        patientType: svc === 'opd' ? 'OPD' : 'IPD',
        service: FORMS[svc].abbr,
        hospital: 'DHH Kataka',
        date: formDate,
        patient: patientName.trim(),
        ticket: ticketNumber.trim(),
        ward: FORMS[svc].ward ? wardName.trim() : undefined,
        answers: answersList,
        comments: comment.trim() || undefined,
        submittedAt: new Date().toISOString(),
      };

      await apiClient.post('/feedback/submit', payload);
      setSubmitting(false);
      setStep('done');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setSubmitting(false);
      setIsError(true);
      setStatusMsg('ପଠାଯାଇପାରିଲା ନାହିଁ । ଇଣ୍ଟରନେଟ୍ ଯାଞ୍ଚ କରି ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ. Could not send. Check your connection and try again.');
    }
  };

  const currentForm = FORMS[svc];
  const otherSvc = svc === 'opd' ? 'ipd' : 'opd';

  return (
    <div className="patient-feedback-page">
      <main>
        {/* Official Header */}
        <header>
          <span className="eyebrow">DHH Kataka · ଜିଲ୍ଲା ମୁଖ୍ୟ ଚିକିତ୍ସାଳୟ, କଟକ</span>
          <h1 id="title">
            {step === 'choose' && 'ଆପଣଙ୍କ ମତାମତ'}
            {step === 'form' && `${currentForm.abbr} ମତାମତ`}
            {step === 'done' && 'ଆପଣଙ୍କ ମତାମତ'}
          </h1>
          <p className="en" id="sub">
            {step === 'choose' && 'Your feedback. Please choose the service you used.'}
            {step === 'form' && `${currentForm.abbr} feedback. Tap one box for each question.`}
            {step === 'done' && 'Feedback received.'}
          </p>
        </header>

        {/* STEP 1: CHOOSE SERVICE (OPD / IPD) */}
        {step === 'choose' && (
          <section id="step-choose" className="choices" aria-label="Choose a service">
            <button
              className="choice"
              type="button"
              data-svc="opd"
              id="pick-opd"
              onClick={() => startForm('opd')}
            >
              <span className="abbr">OPD</span>
              <span className="name">ବହିଃ-ବିଭାଗ ରୋଗୀ</span>
              <span className="en">Outpatient (10 questions)</span>
            </button>

            <button
              className="choice"
              type="button"
              data-svc="ipd"
              id="pick-ipd"
              onClick={() => startForm('ipd')}
            >
              <span className="abbr">IPD</span>
              <span className="name">ଅନ୍ତଃ-ବିଭାଗ ରୋଗୀ</span>
              <span className="en">Inpatient (20 questions)</span>
            </button>
          </section>
        )}

        {/* STEP 2: FEEDBACK FORM */}
        {step === 'form' && (
          <form id="step-form" data-svc={svc} onSubmit={handleSubmit} noValidate>
            {/* Intro Card */}
            <div className="intro">
              <h2 id="form-title">{currentForm.title}</h2>
              <p id="form-intro">{currentForm.intro}</p>
              <p className="en" id="form-intro-en">
                {currentForm.introEn}
              </p>
            </div>

            {/* Patient & Visit Details */}
            <fieldset className="details" id="details">
              <div className="field">
                <label htmlFor="f-date">
                  ତାରିଖ <span className="en">Date</span>
                </label>
                <input
                  type="date"
                  id="f-date"
                  name="f-date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="f-name">
                  ରୋଗୀର ନାମ <span className="en">Patient name (optional)</span>
                </label>
                <input
                  type="text"
                  id="f-name"
                  name="f-name"
                  autoComplete="off"
                  placeholder=""
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="f-ticket">
                  {currentForm.ticketOd} <span className="en">{currentForm.ticketEn} (optional)</span>
                </label>
                <input
                  type="text"
                  id="f-ticket"
                  name="f-ticket"
                  autoComplete="off"
                  placeholder=""
                  value={ticketNumber}
                  onChange={(e) => setTicketNumber(e.target.value)}
                />
              </div>

              {currentForm.ward && (
                <div className="field">
                  <label htmlFor="f-ward">
                    ୱାର୍ଡ / ବେଡ୍ ନଂ <span className="en">Ward / Bed no. (optional)</span>
                  </label>
                  <input
                    type="text"
                    id="f-ward"
                    name="f-ward"
                    autoComplete="off"
                    placeholder=""
                    value={wardName}
                    onChange={(e) => setWardName(e.target.value)}
                  />
                </div>
              )}
            </fieldset>

            {/* Questions List */}
            <ol className="qlist" id="qlist">
              {currentForm.qs.map((q, idx) => {
                const qNum = idx + 1;
                const isMissing = missing.includes(qNum);
                const selectedVal = answers[qNum];

                return (
                  <li key={qNum} className={`q ${isMissing ? 'missing' : ''}`} id={`q${qNum}`}>
                    <div className="qhead">
                      <span className="qnum">{qNum}</span>
                      <div className="qtext">
                        <span>{q.o}</span>
                        <span className="en">{q.e}</span>
                      </div>
                    </div>

                    <div className="scale">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <label key={n} className="opt">
                          <input
                            type="radio"
                            name={`q${qNum}`}
                            value={String(n)}
                            checked={selectedVal === n}
                            onChange={() => handleSelectRating(qNum, n)}
                          />
                          <span>
                            <b>{n}</b>
                            <span style={{ border: 0, padding: 0, background: 'none', height: 'auto' }}>
                              {(q.time ? TIME_OD : SCALE_OD)[n - 1]}
                            </span>
                            <span
                              style={{
                                border: 0,
                                padding: 0,
                                background: 'none',
                                height: 'auto',
                                opacity: 0.8,
                              }}
                            >
                              {(q.time ? TIME_EN : SCALE_EN)[n - 1]}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ol>

            {/* Suggestions / Comment Field */}
            <div className="field">
              <label htmlFor="comment">
                ଆପଣଙ୍କ ପରାମର୍ଶ (ଇଚ୍ଛା ଥିଲେ) <span className="en">Suggestions (optional)</span>
              </label>
              <textarea
                id="comment"
                maxLength={500}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            {/* Actions & Status */}
            <div className="actions">
              <div
                className={`status ${isError ? 'err' : ''}`}
                id="status"
                role="status"
                aria-live="polite"
              >
                {statusMsg}
              </div>

              <button className="primary" type="submit" id="submit" disabled={submitting}>
                {submitting ? 'ପଠାଯାଉଛି... Submitting...' : 'ଦାଖଲ କରନ୍ତୁ · Submit'}
              </button>

              <button className="link" type="button" id="back" onClick={handleBackToChoose}>
                ସେବା ବଦଳାନ୍ତୁ · Change service
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: DONE CONFIRMATION */}
        {step === 'done' && (
          <section id="step-done" className="done" data-svc={svc}>
            <h2>ଧନ୍ୟବାଦ</h2>
            <p className="en">Thank you. Your feedback helps improve the hospital.</p>
            <button
              className="link"
              type="button"
              id="again"
              onClick={() => startForm(otherSvc)}
            >
              {FORMS[otherSvc].abbr} ପାଇଁ ମଧ୍ୟ ମତାମତ ଦିଅନ୍ତୁ · Also rate {FORMS[otherSvc].abbr}
            </button>
          </section>
        )}
      </main>
    </div>
  );
};
