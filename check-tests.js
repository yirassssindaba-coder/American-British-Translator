'use strict';

const { exec } = require('child_process');

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

exec(`${npmCmd} run test`, { windowsHide: true, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
  const output = `${stdout}\n${stderr}`;

  // tampilkan output test seperti biasa
  process.stdout.write(stdout);
  process.stderr.write(stderr);

  // Crash sebelum test jalan
  if (/Uncaught error outside test suite/i.test(output)) {
    console.error('\n❌ Checker: Mocha crash ("Uncaught error outside test suite").');
    process.exit(1);
  }

  // Port conflict
  if (/EADDRINUSE/i.test(output)) {
    console.error('\n❌ Checker: Port sedang dipakai (EADDRINUSE). Matikan server/kill PID port 3000 lalu coba lagi.');
    process.exit(1);
  }

  // Ambil passing/failing
  const passingMatch = output.match(/(\d+)\s+passing/i);
  const failingMatch = output.match(/(\d+)\s+failing/i);

  const passing = passingMatch ? Number(passingMatch[1]) : 0;
  const failing = failingMatch ? Number(failingMatch[1]) : 0;

  const targetPassing = 30; // 24 unit + 6 functional

  if (!err && failing === 0 && passing >= targetPassing) {
    console.log(`\n✅ Checker: PASS (passing=${passing}, failing=${failing})`);
    process.exit(0);
  } else {
    console.error(`\n❌ Checker: FAIL (passing=${passing}, failing=${failing})`);
    console.error('   Target minimal: 30 passing dan 0 failing.');
    process.exit(1);
  }
});
