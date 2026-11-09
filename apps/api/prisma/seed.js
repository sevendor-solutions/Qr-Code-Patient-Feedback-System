const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const prisma = new PrismaClient();

const QR_SECRET = process.env.QR_HMAC_SECRET || 'esushrut-cdac-secure-hmac-sha256-key-salt';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

function createQrSignature(hospitalId, departmentId, locationId, secret) {
  const payload = [hospitalId, departmentId, locationId || ''].join(':');
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

async function main() {
  console.log('--- Checking eSushrut G5 Database State ---');

  // Check if database is already seeded
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    console.log(`==> Database already has ${existingUsers} active user(s). Skipping automatic seed.`);
    return;
  }

  console.log('==> Empty database detected. Running automatic first-time initialization and seed...');

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
  console.log(`Created Hospital: ${hospital.name}`);

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

  const departments = {};
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

  const locations = [];
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

  const createdCategories = {};
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
    { category: 'REGISTRATION', questionEn: 'How was your registration & counter experience?', questionTe: 'నమోదు మరియు కౌంటర్ సేవలు ఎలా ఉన్నాయి?', questionHi: 'पंजीकरण और काउंटर का अनुभव कैसा रहा?', displayOrder: 1 },
    { category: 'WAITING_TIME', questionEn: 'Was your waiting time reasonable?', questionTe: 'మీ వేచి ఉండే సమయం సముచితంగా ఉందా?', questionHi: 'क्या प्रतीक्षा समय उचित था?', displayOrder: 2 },
    { category: 'DOCTOR', questionEn: 'How satisfied are you with doctor consultation & care?', questionTe: 'వైద్యుల సంప్రదింపు మరియు చికిత్సపై మీ సంతృప్తి ఎంత?', questionHi: 'डॉक्टर के परामर्श और देखभाल से आप कितने संतुष्ट हैं?', displayOrder: 3 },
    { category: 'NURSING', questionEn: 'How attentive and caring were the nursing staff?', questionTe: 'నర్సింగ్ సిబ్బంది ఎంత శ్రద్ధగా చూసుకున్నారు?', questionHi: 'नर्सिंग स्टाफ कितना सजग और सहयोगी था?', displayOrder: 4 },
    { category: 'CLEANLINESS', questionEn: 'How clean were the hospital premises and washrooms?', questionTe: 'ఆసుపత్రి ఆవరణ మరియు వాష్‌రూమ్‌ల పరిశుభ్రత ఎలా ఉంది?', questionHi: 'अस्पताल परिसर और शौचालयों की स्वच्छता कैसी थी?', displayOrder: 5 },
    { category: 'LAB', questionEn: 'How was the laboratory & blood test service?', questionTe: 'ల్యాబ్ మరియు రక్త పరీక్షల సేవలు ఎలా ఉన్నాయి?', questionHi: 'प्रयोगशाला और रक्त परीक्षण सेवाएं कैसी थीं?', displayOrder: 6 },
    { category: 'PHARMACY', questionEn: 'Were prescribed medicines available at pharmacy?', questionTe: 'ఫార్మసీలో సూచించిన మందులు అందుబాటులో ఉన్నాయా?', questionHi: 'क्या फार्मेसी में निर्धारित दवाएं उपलब्ध थीं?', displayOrder: 7 },
    { category: 'BILLING', questionEn: 'How clear and transparent was the billing process?', questionTe: 'బిల్లింగ్ ప్రక్రియ ఎంత స్పష్టంగా మరియు పారదర్శకంగా ఉంది?', questionHi: 'बिलिंग प्रक्रिया कितनी स्पष्ट और पारदर्शी थी?', displayOrder: 8 },
    { category: 'STAFF_BEHAVIOUR', questionEn: 'Overall behaviour and courtesy of hospital staff?', questionTe: 'ఆసుపత్రి సిబ్బంది యొక్క సమగ్ర ప్రవర్తన మరియు మర్యాద?', questionHi: 'अस्पताल कर्मचारियों का समग्र व्यवहार और शिष्टाचार?', displayOrder: 9 },
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

  // 6. Create Users
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
      role: 'SUPER_ADMIN',
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
      role: 'DEPT_HEAD',
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
      role: 'DEPT_HEAD',
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
      role: 'FEEDBACK_OFFICER',
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
      slaHours: 4,
      escalateToUserId: headEmgUser.id,
      createdBy: 'SYSTEM_INSTALLER',
    },
  });

  // 8. Generate QR Codes
  for (const deptCode of ['OPD', 'EMG', 'IPD', 'LAB', 'PHARM', 'BILL']) {
    const dept = departments[deptCode];
    const loc = locations.find((l) => l.departmentId === dept.id);
    const token = createQrSignature(hospital.id, dept.id, loc ? loc.id : undefined, QR_SECRET);
    const targetUrl = `${FRONTEND_URL}/feedback?h=${hospital.id}&d=${dept.id}${loc ? `&loc=${loc.id}` : ''}&t=${token}`;

    await prisma.qrMaster.create({
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
  }

  console.log('--- Database Seeding Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
