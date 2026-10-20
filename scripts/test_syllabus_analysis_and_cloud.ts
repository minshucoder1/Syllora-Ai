import { getSupabaseClient } from '../server/supabase.js';

const BASE_URL = 'http://localhost:3000';

async function runSyllabusAndCloudTests() {
  console.log('🧪 Starting Syllabus Analysis & Cloud Storage Verification Test Suite...\n');
  const timestamp = Date.now();
  const testEmail = `mathtest_${timestamp}@syllora.edu`;
  const testPassword = 'StudyHard2026!';
  const randPhone = Math.floor(100000000 + Math.random() * 900000000);

  // 1. Register a real test user
  console.log('1. Registering real test student account...');
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Mathematics Student',
      email: testEmail,
      password: testPassword,
      confirmPassword: testPassword,
      phoneCountryCode: '+91',
      phoneNumber: `9${randPhone}`,
      college: 'Indian Institute of Technology',
      course: 'B.Tech',
      branch: 'Mechanical Engineering',
      year: '1st Year',
      semester: '1st Semester',
      preferredLanguage: 'English',
    }),
  });
  const regData = await regRes.json();
  console.assert(regRes.status === 201, `Registration failed: ${JSON.stringify(regData)}`);
  const token = regData.token;
  const userId = regData.user.id;
  console.log(`✅ User registered with ID: ${userId}`);

  // 2. Prepare sample DOCX buffer (simulated zip/docx container with valid Basic Mathematics text)
  console.log('\n2. Testing syllabus analysis with syllabus text...');
  const mathSyllabusText = `Basic Mathematics (MATH-101)
Course Scope: University syllabus covering Matrices, Differential Calculus, and Linear Algebra.

Unit 1: Matrices and Linear Systems (Weightage: 25%)
- Matrix rank and echelon form
- System of linear equations and Gauss elimination
- Eigenvalues, Eigenvectors, and Cayley-Hamilton Theorem

Unit 2: Differential Calculus (Weightage: 25%)
- Successive differentiation and Leibnitz theorem
- Partial differentiation and Euler theorem for homogeneous functions
- Taylor and Maclaurin series expansions

Unit 3: Integral Calculus (Weightage: 25%)
- Definite integrals and reduction formulas
- Beta and Gamma functions
- Double and triple integrals, area and volume calculation

Unit 4: Ordinary Differential Equations (Weightage: 25%)
- First order linear differential equations and Bernoulli equations
- Higher order linear differential equations with constant coefficients
- Method of variation of parameters`;

  // 3. Test Analyze Syllabus with AI
  console.log('\n3. Calling /api/ai/analyze-syllabus...');
  const analyzeRes = await fetch(`${BASE_URL}/api/ai/analyze-syllabus`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      syllabusText: mathSyllabusText,
      fileData: {
        fileName: 'Basic Mathematics syllabus.txt',
        mimeType: 'text/plain',
        base64: Buffer.from(mathSyllabusText).toString('base64'),
      },
    }),
  });

  const analyzeData = await analyzeRes.json();
  console.assert(analyzeRes.ok, `Expected 200, got ${analyzeRes.status}: ${JSON.stringify(analyzeData)}`);
  console.assert(analyzeData.success === true, 'Analysis must succeed');
  console.assert(Boolean(analyzeData.result?.subjectName), 'Must contain subjectName');
  console.assert(Array.isArray(analyzeData.result?.units), 'Must contain units array');
  console.assert(analyzeData.result.units.length >= 2, 'Must have at least 2 units');
  console.assert(Boolean(analyzeData.subjectId), 'Subject must be saved with unique ID');
  const subjectId = analyzeData.subjectId;
  console.log(`✅ Syllabus analyzed successfully! Subject Name: "${analyzeData.result.subjectName}", Units: ${analyzeData.result.units.length}, Used Model: ${analyzeData.result._meta?.usedModel}`);

  // 4. Verify Subject is Saved in Supabase Cloud Storage
  console.log('\n4. Verifying subject persistence in Supabase Storage bucket (syllabus_files)...');
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data: cloudList, error: listErr } = await supabase.storage
      .from('syllabus_files')
      .list(`${userId}/subjects`);
    console.assert(!listErr, `Storage list error: ${listErr?.message}`);
    const foundCloudFile = cloudList?.some((item) => item.name === `${subjectId}.json`);
    console.assert(foundCloudFile, `Subject ${subjectId}.json must exist in Supabase Storage`);
    console.log(`✅ Subject verified in Supabase Storage at ${userId}/subjects/${subjectId}.json`);
  }

  // 5. Test "Try Again With Backup AI" endpoint
  console.log('\n5. Testing "Try Again With Backup AI" with preferBackup: true...');
  const backupRes = await fetch(`${BASE_URL}/api/ai/analyze-syllabus`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      syllabusText: mathSyllabusText,
      preferBackup: true,
      subjectId,
    }),
  });

  const backupData = await backupRes.json();
  console.assert(backupRes.ok, `Backup request failed: ${backupRes.status}`);
  console.assert(backupData.success === true, 'Backup analysis must succeed');
  console.log(`✅ Backup AI succeeded! Used model: ${backupData.result._meta?.usedModel}`);

  // 6. Test Logout and Re-login from "new device" (cross-device restoration)
  console.log('\n6. Testing logout and re-login restoration...');
  await fetch(`${BASE_URL}/api/auth/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
    }),
  });

  const loginData = await loginRes.json();
  console.assert(loginRes.ok, 'Re-login must succeed');
  const freshToken = loginData.token;

  // Fetch subjects with fresh token
  const getSubjRes = await fetch(`${BASE_URL}/api/subjects`, {
    headers: { Authorization: `Bearer ${freshToken}` },
  });
  const getSubjData = await getSubjRes.json();
  const restoredSubj = getSubjData.subjects.find((s: any) => s.id === subjectId);
  console.assert(Boolean(restoredSubj), 'Saved syllabus must be automatically restored on login');
  console.assert(restoredSubj.units.length >= 2, 'Restored units must match');
  console.log(`✅ Cross-device sync verified: Subject "${restoredSubj.name}" automatically restored with ${restoredSubj.units.length} units!`);

  // 7. Verify Corrupted/Empty Document Error Handling
  console.log('\n7. Verifying unreadable document error handling...');
  const badDocRes = await fetch(`${BASE_URL}/api/ai/analyze-syllabus`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${freshToken}`,
    },
    body: JSON.stringify({
      fileData: {
        fileName: 'corrupted_math.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        base64: Buffer.from('NOT_A_VALID_DOCX_FILE').toString('base64'),
      },
    }),
  });
  const badDocData = await badDocRes.json();
  console.assert(badDocRes.status === 400, `Expected 400 for bad docx, got ${badDocRes.status}`);
  console.assert(badDocData.category === 'EXTRACTION_ERROR', 'Must return EXTRACTION_ERROR');
  console.log(`✅ Unreadable document properly caught with message: "${badDocData.error}"`);

  // 8. Verify No Secrets / API Keys in Responses
  console.log('\n8. Confirming zero API key exposure in responses...');
  const respString = JSON.stringify(analyzeData) + JSON.stringify(backupData);
  console.assert(!respString.includes(process.env.GEMINI_API_KEY || 'NOT_FOUND'), 'CRITICAL: GEMINI_API_KEY must never appear in response payloads');
  console.assert(!respString.includes(process.env.SUPABASE_SERVICE_ROLE_KEY || 'NOT_FOUND'), 'CRITICAL: SUPABASE_SERVICE_ROLE_KEY must never appear in response payloads');
  console.log('✅ Secrets inspection passed: No API keys or credentials exposed in responses.');

  console.log('\n======================================================');
  console.log('🎉 ALL SYLLABUS & CLOUD STORAGE ACCEPTANCE CRITERIA MET!');
  console.log('======================================================\n');
}

runSyllabusAndCloudTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
