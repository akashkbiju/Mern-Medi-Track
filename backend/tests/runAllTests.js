import { spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testFiles = [
  'medicineModel.test.js',
  'scheduleLogic.test.js',
  'reminderEngine.test.js',
  'medicationLog.test.js',
  'adherence.test.js',
  'healthRecord.test.js',
  'healthAnalytics.test.js',
  'healthInsight.test.js',
  'notification.test.js',
  'doctor.test.js',
  'connection.test.js',
  'doctorHealthAccess.test.js',
  'doctorNote.test.js',
  'healthReport.test.js',
  'pdfReport.test.js',
  'dashboard.test.js',
  'securityHardening.test.js',
];

console.log('======================================================================');
console.log('MediTrack+ Comprehensive Verification Suite (Step 27)');
console.log(`Executing ${testFiles.length} Test Suites across all system modules`);
console.log('======================================================================\n');

let totalPassedSuites = 0;
let totalFailedSuites = 0;
const results = [];

for (const file of testFiles) {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) {
    console.warn(`[WARN] Skipping ${file} (file not found)`);
    continue;
  }

  process.stdout.write(`Running ${file.padEnd(30)} ... `);
  const result = spawnSync('node', [filePath], {
    cwd: path.resolve(__dirname, '..'),
    encoding: 'utf8',
    env: { ...process.env, NODE_ENV: 'test' },
  });

  if (result.status === 0) {
    console.log('✓ PASSED');
    totalPassedSuites++;
    results.push({ file, status: 'PASSED' });
  } else {
    console.log('✗ FAILED');
    totalFailedSuites++;
    results.push({ file, status: 'FAILED', output: result.stdout + '\n' + result.stderr });
  }
}

console.log('\n======================================================================');
console.log(`FINAL RESULT: ${totalPassedSuites}/${testFiles.length} Suites PASSED (${totalFailedSuites} failed)`);
console.log('======================================================================');

if (totalFailedSuites > 0) {
  console.error('\nFailures details:');
  for (const r of results.filter((r) => r.status === 'FAILED')) {
    console.error(`\n--- ${r.file} ---`);
    console.error(r.output);
  }
  process.exit(1);
} else {
  console.log('\nAll core MediTrack+ subsystems passed validation successfully!');
  process.exit(0);
}
