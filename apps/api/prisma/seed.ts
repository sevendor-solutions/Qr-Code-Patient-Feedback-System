import { PrismaClient, UserRole, PatientType, ComplaintStatus, ComplaintPriority, RatingCategory } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createQrSignature, formatTicketId } from '@esushrut/shared';

const prisma = new PrismaClient();

const QR_SECRET = process.env.QR_HMAC_SECRET || 'esushrut-cdac-secure-hmac-sha256-key-salt';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

async function main() {
  console.log('--- Starting eSushrut G5 Database Seeding ---');

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.complaintHistory.deleteMany();
  await prisma.complaintTicket.deleteMany();
  await prisma.feedbackRating.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.qrMaster.deleteMany();
  await prisma.escalationMatrix.deleteMany();
  await prisma.user.deleteMany();
  await prisma.qrLocation.deleteMany();
  await prisma.question.deleteMany();
  await prisma.serviceCategory.deleteMany();
  await prisma.department.deleteMany();
  await prisma.hospital.deleteMany();

  // 1. Create Hospital
  const hospital = await prisma.hospital.create({
    data: {
      code: 'ESUSHRUT-CENTRAL',
      name: 'eSushrut Model Civil & Teaching Hospital',
      address: 'Central Medical Enclave, Health City, New Delhi - 110001',
      contactEmail: 'nodal.grievance@esushrut-cdac.in',
      contactPhone: '011-26598700',
      logoUrl: '/cdac-logo.svg',
      isActive: true,
      createdBy: 'SYSTEM_INSTALLER',
    },
  });
  console.log(`Created Hospital: ${hospital.name} (${hospital.id})`);

  // 2. Create Departments
  const deptData = [
    { code: 'OPD', name: 'Outpatient Department (OPD)', headName: 'Dr. Rajesh Sharma', headEmail: 'rajesh.sharma@hospital.gov.in', headPhone: '9811223344' },
    { code: 'EMG', name: 'Emergency & Trauma Care', headName: 'Dr. Anita Desai', headEmail: 'anita.desai@hospital.gov.in', headPhone: '9822334455' },
    { code: 'IPD', name: 'Inpatient Department (IPD)', headName: 'Dr. K. S. Rao', headEmail: 'ks.rao@hospital.gov.in', headPhone: '9833445566' },
    { code: 'LAB', name: 'Central Pathology Laboratory', headName: 'Dr. Meena Iyer', headEmail: 'meena.iyer@hospital.gov.in', headPhone: '9844556677' },
    { code: 'PHARM', name: 'Hospital Pharmacy & Dispensing', headName: 'Shri Manoj Kumar', headEmail: 'manoj.pharm@hospital.gov.in', headPhone: '9855667788' },
    { code: 'RAD', name: 'Radiology & Imaging', headName: 'Dr. P. Venkatesh', headEmail: 'venkatesh.rad@hospital.gov.in', headPhone: '9866778899' },
    { code: 'BILL', name: 'Billing & Cashier Counter', headName: 'Smt. Sunita Verma', headEmail: 'sunita.billing@hospital.gov.in', headPhone: '9877889900' },
  ];

  const departments: Record<string, any> = {};
  for (const d of deptData) {
    departments[d.code] = await prisma.department.create({
      data: {
        hospitalId: hospital.id,
        ...d,
        createdBy: 'SYSTEM_INSTALLER',
      },
    });
  }
  console.log(`Created ${Object.keys(departments).length} Departments`);

  // 3. Create Locations
  const locationData = [
    { deptCode: 'OPD', name: 'OPD Main Registration Counter 1-4', floor: 'Ground Floor', ward: 'General OPD', counter: 'Counters 1 to 4' },
    { deptCode: 'OPD', name: 'OPD Consultation Room 104', floor: '1st Floor', ward: 'Internal Medicine', counter: 'Room 104' },
    { deptCode: 'EMG', name: 'Emergency Triage & Casualty Desk', floor: 'Ground Floor', ward: 'Casualty Trauma', counter: 'Triage Desk 1' },
    { deptCode: 'LAB', name: 'Blood Sample Collection Counter', floor: 'Ground Floor', ward: 'Diagnostics Wing', counter: 'Counter 3' },
    { deptCode: 'PHARM', name: 'Generic Medicine Dispensing Counter 2', floor: 'Ground Floor', ward: 'Pharmacy Wing', counter: 'Counter 2' },
    { deptCode: 'BILL', name: 'OPD/IPD Central Billing Counter', floor: 'Ground Floor', ward: 'Main Lobby', counter: 'Counter 6' },
  ];

  const locations: any[] = [];
  for (const loc of locationData) {
    const createdLoc = await prisma.qrLocation.create({
      data: {
        hospitalId: hospital.id,
        departmentId: departments[loc.deptCode].id,
        name: loc.name,
        floor: loc.floor,
        ward: loc.ward,
        counter: loc.counter,
        createdBy: 'SYSTEM_INSTALLER',
      },
    });
    locations.push(createdLoc);
  }
  console.log(`Created ${locations.length} Locations`);

  // 4. Create Service Categories for Complaints
  const categories = [
    { code: 'OPD', nameEn: 'OPD Services & Wait Time', nameTe: 'ఓపీడీ సేవలు & వేచి ఉండే సమయం', nameHi: 'ओपीडी सेवाएं और प्रतीक्षा समय', description: 'Consultation delay, doctor availability, queue management' },
    { code: 'IPD', nameEn: 'Inpatient Ward & Nursing', nameTe: 'ఇన్‌పేషెంట్ వార్డ్ & నర్సింగ్', nameHi: 'आईपीडी वार्ड और नर्सिंग देखभाल', description: 'Bed cleanliness, nurse response, doctor rounds' },
    { code: 'EMERGENCY', nameEn: 'Emergency & Casualty', nameTe: 'ఎమర్జెన్సీ & ప్రమాద విభాగం', nameHi: 'आपातकालीन और दुर्घटना विभाग', description: 'Immediate triage care, stretcher availability, trauma response' },
    { code: 'LAB', nameEn: 'Pathology & Lab Diagnostics', nameTe: 'పాథాలజీ & ల్యాబ్ పరీక్షలు', nameHi: 'पैथोलॉजी एवं प्रयोगशाला परीक्षण', description: 'Report delays, sample collection hygiene, missing reports' },
    { code: 'PHARMACY', nameEn: 'Pharmacy & Drug Availability', nameTe: 'ఫార్మసీ & ఔషధాల లభ్యత', nameHi: 'फार्मेसी और दवाओं की उपलब्धता', description: 'Stock availability of prescribed medicines, queue at counter' },
    { code: 'BILLING', nameEn: 'Billing & Cash Counter', nameTe: 'బిల్లింగ్ & నగదు కౌంటర్', nameHi: 'बिलिंग और कैश काउंटर', description: 'Billing errors, payment gateway/card issues, refund delay' },
    { code: 'RADIOLOGY', nameEn: 'Radiology (X-Ray/CT/MRI)', nameTe: 'రేడియాలజీ (ఎక్స్-రే/సిటీ/ఎంఆర్ఐ)', nameHi: 'रेडियोलॉजी (एक्स-रे/सीटी/एमआरआई)', description: 'Machine uptime, appointment schedule, film report delay' },
    { code: 'BLOOD_BANK', nameEn: 'Blood Bank', nameTe: 'బ్లడ్ బ్యాంక్', nameHi: 'ब्लड बैंक', description: 'Donor reception, blood unit availability' },
    { code: 'CANTEEN', nameEn: 'Hospital Canteen & Diet', nameTe: 'హాస్పిటల్ క్యాంటీన్ & ఆహారం', nameHi: 'अस्पताल कैंटीन और रोगी आहार', description: 'Food quality, hygiene, price adherence' },
    { code: 'SANITATION', nameEn: 'Sanitation & Washrooms', nameTe: 'పరిశుభ్రత & వాష్‌రూమ్‌లు', nameHi: 'स्वच्छता और शौचालय', description: 'Toilets cleanliness, water supply, garbage disposal' },
    { code: 'PARKING', nameEn: 'Parking & Security', nameTe: 'పార్కింగ్ & భద్రతా సిబ్బంది', nameHi: 'पार्किंग और सुरक्षा कर्मी', description: 'Security behaviour, vehicle parking convenience' },
  ];

  const createdCategories: Record<string, any> = {};
  for (const cat of categories) {
    createdCategories[cat.code] = await prisma.serviceCategory.create({
      data: {
        ...cat,
        createdBy: 'SYSTEM_INSTALLER',
      },
    });
  }
  console.log(`Created ${categories.length} Service Categories`);

  // 5. Create Feedback Questions
  const questions = [
    { category: RatingCategory.REGISTRATION, questionEn: 'How was your registration & counter experience?', questionTe: 'నమోదు మరియు కౌంటర్ సేవలు ఎలా ఉన్నాయి?', questionHi: 'पंजीकरण और काउंटर का अनुभव कैसा रहा?', displayOrder: 1 },
    { category: RatingCategory.WAITING_TIME, questionEn: 'Was your waiting time reasonable?', questionTe: 'మీ వేచి ఉండే సమయం సముచితంగా ఉందా?', questionHi: 'क्या प्रतीक्षा समय उचित था?', displayOrder: 2 },
    { category: RatingCategory.DOCTOR, questionEn: 'How satisfied are you with doctor consultation & care?', questionTe: 'వైద్యుల సంప్రదింపు మరియు చికిత్సపై మీ సంతృప్తి ఎంత?', questionHi: 'डॉक्टर के परामर्श और देखभाल से आप कितने संतुष्ट हैं?', displayOrder: 3 },
    { category: RatingCategory.NURSING, questionEn: 'How attentive and caring were the nursing staff?', questionTe: 'నర్సింగ్ సిబ్బంది ఎంత శ్రద్ధగా చూసుకున్నారు?', questionHi: 'नर्सिंग स्टाफ कितना सजग और सहयोगी था?', displayOrder: 4 },
    { category: RatingCategory.CLEANLINESS, questionEn: 'How clean were the hospital premises and washrooms?', questionTe: 'ఆసుపత్రి ఆవరణ మరియు వాష్‌రూమ్‌ల పరిశుభ్రత ఎలా ఉంది?', questionHi: 'अस्पताल परिसर और शौचालयों की स्वच्छता कैसी थी?', displayOrder: 5 },
    { category: RatingCategory.LAB, questionEn: 'How was the laboratory & blood test service?', questionTe: 'ల్యాబ్ మరియు రక్త పరీక్షల సేవలు ఎలా ఉన్నాయి?', questionHi: 'प्रयोगशाला और रक्त परीक्षण सेवाएं कैसी थीं?', displayOrder: 6 },
    { category: RatingCategory.PHARMACY, questionEn: 'Were prescribed medicines available at pharmacy?', questionTe: 'ఫార్మసీలో సూచించిన మందులు అందుబాటులో ఉన్నాయా?', questionHi: 'क्या फार्मेसी में निर्धारित दवाएं उपलब्ध थीं?', displayOrder: 7 },
    { category: RatingCategory.BILLING, questionEn: 'How clear and transparent was the billing process?', questionTe: 'బిల్లింగ్ ప్రక్రియ ఎంత స్పష్టంగా మరియు పారదర్శకంగా ఉంది?', questionHi: 'बिलिंग प्रक्रिया कितनी स्पष्ट और पारदर्शी थी?', displayOrder: 8 },
    { category: RatingCategory.STAFF_BEHAVIOUR, questionEn: 'Overall behaviour and courtesy of hospital staff?', questionTe: 'ఆసుపత్రి సిబ్బంది యొక్క సమగ్ర ప్రవర్తన మరియు మర్యాద?', questionHi: 'अस्पताल कर्मचारियों का समग्र व्यवहार और शिष्टाचार?', displayOrder: 9 },
  ];

  for (const q of questions) {
    await prisma.question.create({
      data: {
        ...q,
        createdBy: 'SYSTEM_INSTALLER',
      },
    });
  }
  console.log(`Created ${questions.length} Feedback Questions`);

  // 6. Create Users (Super Admin, Dept Heads, Feedback Officer)
  const salt = await bcrypt.genSalt(10);
  const adminPassHash = await bcrypt.hash('Admin@12345', salt);
  const headPassHash = await bcrypt.hash('Head@12345', salt);
  const officerPassHash = await bcrypt.hash('Officer@12345', salt);

  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      passwordHash: adminPassHash,
      email: 'superadmin@esushrut-cdac.in',
      fullName: 'Dr. B. K. Murthy (Director General)',
      mobile: '9810010010',
      role: UserRole.SUPER_ADMIN,
      hospitalId: hospital.id,
      createdBy: 'SYSTEM_INSTALLER',
    },
  });

  const headOpdUser = await prisma.user.create({
    data: {
      username: 'head_opd',
      passwordHash: headPassHash,
      email: 'head.opd@hospital.gov.in',
      fullName: 'Dr. Rajesh Sharma (Head - OPD)',
      mobile: '9811223344',
      role: UserRole.DEPT_HEAD,
      hospitalId: hospital.id,
      departmentId: departments['OPD'].id,
      createdBy: 'SYSTEM_INSTALLER',
    },
  });

  const headEmgUser = await prisma.user.create({
    data: {
      username: 'head_emergency',
      passwordHash: headPassHash,
      email: 'head.emg@hospital.gov.in',
      fullName: 'Dr. Anita Desai (Head - Emergency)',
      mobile: '9822334455',
      role: UserRole.DEPT_HEAD,
      hospitalId: hospital.id,
      departmentId: departments['EMG'].id,
      createdBy: 'SYSTEM_INSTALLER',
    },
  });

  const officerUser = await prisma.user.create({
    data: {
      username: 'officer_nodal',
      passwordHash: officerPassHash,
      email: 'nodal.feedback@hospital.gov.in',
      fullName: 'Shri Vikram Rathore (Nodal Grievance Officer)',
      mobile: '9899887766',
      role: UserRole.FEEDBACK_OFFICER,
      hospitalId: hospital.id,
      createdBy: 'SYSTEM_INSTALLER',
    },
  });
  console.log('Created Users: admin, head_opd, head_emergency, officer_nodal');

  // 7. Create Escalation Matrix
  await prisma.escalationMatrix.create({
    data: {
      departmentId: departments['OPD'].id,
      level: 1,
      slaHours: 24,
      escalateToUserId: officerUser.id,
      createdBy: 'SYSTEM_INSTALLER',
    },
  });
  await prisma.escalationMatrix.create({
    data: {
      departmentId: departments['OPD'].id,
      level: 2,
      slaHours: 48,
      escalateToUserId: headOpdUser.id,
      createdBy: 'SYSTEM_INSTALLER',
    },
  });
  await prisma.escalationMatrix.create({
    data: {
      departmentId: departments['OPD'].id,
      level: 3,
      slaHours: 72,
      escalateToUserId: adminUser.id,
      createdBy: 'SYSTEM_INSTALLER',
    },
  });

  await prisma.escalationMatrix.create({
    data: {
      departmentId: departments['EMG'].id,
      level: 1,
      slaHours: 4, // urgent SLA for emergency
      escalateToUserId: headEmgUser.id,
      createdBy: 'SYSTEM_INSTALLER',
    },
  });
  console.log('Created Escalation Matrices for OPD and Emergency');

  // 8. Generate QR Codes for departments
  const sampleQrs: any[] = [];
  for (const deptCode of ['OPD', 'EMG', 'IPD', 'LAB', 'PHARM', 'BILL']) {
    const dept = departments[deptCode];
    const loc = locations.find((l) => l.departmentId === dept.id);
    const token = createQrSignature(hospital.id, dept.id, loc ? loc.id : undefined, QR_SECRET);
    const targetUrl = `${FRONTEND_URL}/feedback?h=${hospital.id}&d=${dept.id}${loc ? `&loc=${loc.id}` : ''}&t=${token}`;

    const qr = await prisma.qrMaster.create({
      data: {
        hospitalId: hospital.id,
        departmentId: dept.id,
        locationId: loc ? loc.id : null,
        code: `QR-${dept.code}-${loc ? loc.counter.replace(/\s+/g, '') : 'MAIN'}`,
        token,
        targetUrl,
        scanCount: 142,
        createdBy: adminUser.id,
      },
    });
    sampleQrs.push(qr);
  }
  console.log(`Created ${sampleQrs.length} QR Masters with verified HMAC tokens`);

  // 9. Create Sample Feedbacks (with realistic rating profiles)
  const feedbackPresets = [
    {
      name: 'Ramesh Chander',
      mobile: '9810123456',
      crNo: 'CR-2026-004512',
      deptCode: 'OPD',
      lang: 'en',
      pt: PatientType.OPD,
      emoji: 4,
      nps: 9,
      ratings: [4, 3, 5, 4, 4, 4, 3, 4, 5],
      comment: 'Doctor consultation was very thorough and attentive. Waiting time at counter can be improved.',
    },
    {
      name: 'సుబ్బారావు నాయుడు (Subba Rao)',
      mobile: '9848022334',
      crNo: 'CR-2026-005621',
      deptCode: 'OPD',
      lang: 'te',
      pt: PatientType.OPD,
      emoji: 5,
      nps: 10,
      ratings: [5, 4, 5, 5, 5, 5, 4, 5, 5],
      comment: 'వైద్యుల చికిత్స మరియు సిబ్బంది ప్రవర్తన చాలా బాగుంది. ధన్యవాదాలు.',
    },
    {
      name: 'सुरेश कुमार वर्मा (Suresh Verma)',
      mobile: '9818833445',
      crNo: 'CR-2026-006198',
      deptCode: 'EMG',
      lang: 'hi',
      pt: PatientType.EMERGENCY,
      emoji: 5,
      nps: 9,
      ratings: [5, 5, 5, 5, 4, 5, 4, 5, 5],
      comment: 'इमरजेंसी में त्वरित इलाज मिला। स्टाफ बहुत सहयोगी था।',
    },
    {
      name: 'Priya Sundaram',
      mobile: '9876543210',
      crNo: 'CR-2026-007823',
      deptCode: 'LAB',
      lang: 'en',
      pt: PatientType.OPD,
      emoji: 2,
      nps: 3,
      ratings: [2, 1, 3, 2, 2, 2, 2, 2, 2],
      comment: 'High delay in blood collection counter. Only one technician was working at peak hours.',
    },
    {
      name: 'Mohammed Ali',
      mobile: '9949112233',
      crNo: 'CR-2026-008341',
      deptCode: 'PHARM',
      lang: 'en',
      pt: PatientType.ATTENDANT,
      emoji: 3,
      nps: 6,
      ratings: [3, 2, 4, 3, 3, 3, 2, 3, 3],
      comment: 'Out of 4 prescribed medicines, only 2 were available in dispensary.',
    },
  ];

  const ratingCategories = [
    RatingCategory.REGISTRATION,
    RatingCategory.WAITING_TIME,
    RatingCategory.DOCTOR,
    RatingCategory.NURSING,
    RatingCategory.CLEANLINESS,
    RatingCategory.LAB,
    RatingCategory.PHARMACY,
    RatingCategory.BILLING,
    RatingCategory.STAFF_BEHAVIOUR,
  ];

  for (const fp of feedbackPresets) {
    const dept = departments[fp.deptCode];
    await prisma.feedback.create({
      data: {
        hospitalId: hospital.id,
        departmentId: dept.id,
        language: fp.lang,
        patientName: fp.name,
        mobile: fp.mobile,
        crNumber: fp.crNo,
        patientType: fp.pt,
        overallEmoji: fp.emoji,
        npsScore: fp.nps,
        comments: fp.comment,
        ratings: {
          create: ratingCategories.map((cat, idx) => ({
            category: cat,
            rating: fp.ratings[idx] || 4,
          })),
        },
      },
    });
  }
  console.log(`Created ${feedbackPresets.length} Sample Feedback records`);

  // 10. Create Sample Complaints with Ticket IDs & Histories
  const complaint1 = await prisma.complaintTicket.create({
    data: {
      ticketId: 'FB-2026-000001',
      hospitalId: hospital.id,
      departmentId: departments['OPD'].id,
      categoryId: createdCategories['OPD'].id,
      language: 'en',
      patientName: 'Kishore Kumar',
      mobile: '9811998877',
      crNumber: 'CR-2026-009112',
      patientType: PatientType.OPD,
      description: 'Waited for 2.5 hours for Dr. consultation in room 104 even though token was issued at 9:30 AM.',
      priority: ComplaintPriority.NORMAL,
      status: ComplaintStatus.IN_PROGRESS,
      assignedToId: officerUser.id,
      currentEscalationLevel: 1,
      slaDeadline: new Date(Date.now() + 24 * 3600 * 1000),
    },
  });

  await prisma.complaintHistory.create({
    data: {
      ticketId: complaint1.id,
      fromStatus: null,
      toStatus: ComplaintStatus.OPEN,
      actionByUserId: null,
      actionRemarks: 'Complaint registered by patient via QR Code scan',
    },
  });

  await prisma.complaintHistory.create({
    data: {
      ticketId: complaint1.id,
      fromStatus: ComplaintStatus.OPEN,
      toStatus: ComplaintStatus.IN_PROGRESS,
      actionByUserId: officerUser.id,
      actionRemarks: 'Assigned to Nodal Grievance Officer. Inquired with Room 104 staff on token delays.',
    },
  });

  const complaint2 = await prisma.complaintTicket.create({
    data: {
      ticketId: 'FB-2026-000002',
      hospitalId: hospital.id,
      departmentId: departments['PHARM'].id,
      categoryId: createdCategories['PHARMACY'].id,
      language: 'hi',
      patientName: 'दीपक कुमार (Deepak Kumar)',
      mobile: '9822114433',
      crNumber: 'CR-2026-009230',
      patientType: PatientType.OPD,
      description: 'दवा काउंटर पर केवल एक कर्मचारी उपस्थित था, कतार 50 मीटर लंबी थी।',
      priority: ComplaintPriority.URGENT,
      status: ComplaintStatus.RESOLVED,
      assignedToId: officerUser.id,
      resolvedAt: new Date(),
      currentEscalationLevel: 1,
    },
  });

  await prisma.complaintHistory.create({
    data: {
      ticketId: complaint2.id,
      fromStatus: null,
      toStatus: ComplaintStatus.OPEN,
      actionRemarks: 'Complaint registered by patient',
    },
  });

  await prisma.complaintHistory.create({
    data: {
      ticketId: complaint2.id,
      fromStatus: ComplaintStatus.OPEN,
      toStatus: ComplaintStatus.RESOLVED,
      actionByUserId: officerUser.id,
      actionRemarks: 'Additional pharmacist deployed to Counter 3 during rush hours. Issue resolved.',
    },
  });

  const complaint3 = await prisma.complaintTicket.create({
    data: {
      ticketId: 'FB-2026-000003',
      hospitalId: hospital.id,
      departmentId: departments['EMG'].id,
      categoryId: createdCategories['EMERGENCY'].id,
      language: 'en',
      patientName: 'Anand Mohan',
      mobile: '9833441122',
      crNumber: 'CR-2026-009388',
      patientType: PatientType.EMERGENCY,
      description: 'Wheelchair was broken at triage entrance and stretcher boy was unavailable.',
      priority: ComplaintPriority.URGENT,
      status: ComplaintStatus.ESCALATED,
      assignedToId: headEmgUser.id,
      currentEscalationLevel: 2,
      escalatedAt: new Date(),
      slaDeadline: new Date(Date.now() - 2 * 3600 * 1000), // breached SLA
    },
  });

  await prisma.complaintHistory.create({
    data: {
      ticketId: complaint3.id,
      fromStatus: null,
      toStatus: ComplaintStatus.OPEN,
      actionRemarks: 'Complaint raised',
    },
  });
  await prisma.complaintHistory.create({
    data: {
      ticketId: complaint3.id,
      fromStatus: ComplaintStatus.OPEN,
      toStatus: ComplaintStatus.ESCALATED,
      actionRemarks: 'System SLA auto-escalation cron: breached 4-hour SLA. Escalated to Department Head Dr. Anita Desai.',
    },
  });

  console.log('Created Sample Complaints with complete audit histories');
  console.log('--- eSushrut G5 Database Seeding Complete ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
