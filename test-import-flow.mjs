#!/usr/bin/env node
/**
 * MC-Studio-macOS E2E Test: Import → PreCheck → AutoFix → Package
 * 
 * This script simulates what the Electron app does when importing a mod zip,
 * running prechecks, auto-fixing issues, and packaging.
 * 
 * Usage: node test-import-flow.mjs <path-to-mod.zip>
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ZIP_PATH = process.argv[2] || path.join(__dirname, 'sample-mods', 'Waystones.zip');
const PROJECTS_DIR = path.join(__dirname, 'test-projects');
const RESULTS = [];
let PROJECT_PATH;

function log(emoji, msg) {
  console.log(`${emoji}  ${msg}`);
}

function pass(name, detail) {
  RESULTS.push({ name, pass: true, detail });
  log('✅', `PASS: ${name}${detail ? ` (${detail})` : ''}`);
}

function fail(name, detail) {
  RESULTS.push({ name, pass: false, detail });
  log('❌', `FAIL: ${name} — ${detail}`);
}

// =========================================
// STEP 1: Import (Unzip) the mod
// =========================================
async function step1_ImportMod() {
  log('📦', '=== STEP 1: Import Waystones.zip ===');
  
  // Clean test directory
  if (fs.existsSync(PROJECTS_DIR)) {
    fs.rmSync(PROJECTS_DIR, { recursive: true });
  }
  fs.mkdirSync(PROJECTS_DIR, { recursive: true });
  
  const baseName = path.basename(ZIP_PATH, '.zip');
  PROJECT_PATH = path.join(PROJECTS_DIR, baseName);
  fs.mkdirSync(PROJECT_PATH, { recursive: true });
  
  try {
    execSync(`unzip -o "${ZIP_PATH}" -d "${PROJECT_PATH}"`, { timeout: 60000 });
    pass('Import/Unzip', `Extracted to ${PROJECT_PATH}`);
  } catch (err) {
    fail('Import/Unzip', err.message);
    process.exit(1);
  }
  
  // Verify extraction
  const bpExists = fs.existsSync(path.join(PROJECT_PATH, 'behavior_pack'));
  const rpExists = fs.existsSync(path.join(PROJECT_PATH, 'resource_pack'));
  
  if (bpExists && rpExists) {
    pass('Directory Structure', 'behavior_pack/ and resource_pack/ both exist');
  } else {
    fail('Directory Structure', `BP: ${bpExists}, RP: ${rpExists}`);
  }
  
  // Create project.json (like the real Electron app would)
  let projectName = baseName;
  for (const manifestName of ['pack_manifest.json', 'manifest.json']) {
    const mp = path.join(PROJECT_PATH, 'behavior_pack', manifestName);
    if (fs.existsSync(mp)) {
      const manifest = JSON.parse(fs.readFileSync(mp, 'utf-8'));
      if (manifest.header?.name) {
        projectName = manifest.header.name.replace(/ (BP|netease_suffix)/g, '').trim();
      }
      break;
    }
  }
  
  const config = {
    id: uuidv4(),
    name: projectName,
    type: 'addon',
    template: 'imported',
    importedFrom: path.basename(ZIP_PATH),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: '1.0.0',
  };
  
  fs.writeFileSync(path.join(PROJECT_PATH, 'project.json'), JSON.stringify(config, null, 2));
  pass('Project Config', `Name: "${projectName}", ID: ${config.id}`);
  
  log('📋', `Contents after import:`);
  execSync(`find "${PROJECT_PATH}" -type f`, { stdio: 'inherit' });
}

// =========================================
// STEP 2: Run PreCheck (simulate all rules)
// =========================================
function findManifestFile(packDir) {
  for (const name of ['pack_manifest.json', 'manifest.json']) {
    const fullPath = path.join(packDir, name);
    if (fs.existsSync(fullPath)) return { path: fullPath, name };
  }
  return null;
}

function readManifest(packDir) {
  const found = findManifestFile(packDir);
  if (!found) return null;
  try {
    return { ...JSON.parse(fs.readFileSync(found.path, 'utf-8')), _path: found.path, _name: found.name };
  } catch { return null; }
}

function step2_PreCheck() {
  log('🔍', '=== STEP 2: Run PreCheck (9 Rules) ===');
  
  // Rule 1: BP Manifest exists
  const bpManifest = findManifestFile(path.join(PROJECT_PATH, 'behavior_pack'));
  if (bpManifest) {
    pass('BP Manifest Exists', `Found ${bpManifest.name}`);
  } else {
    fail('BP Manifest Exists', 'No manifest found');
  }
  
  // Rule 2: RP Manifest exists
  const rpManifest = findManifestFile(path.join(PROJECT_PATH, 'resource_pack'));
  if (rpManifest) {
    pass('RP Manifest Exists', `Found ${rpManifest.name}`);
  } else {
    fail('RP Manifest Exists', 'No manifest found');
  }
  
  // Rule 3: textures/ dir
  const texExists = fs.existsSync(path.join(PROJECT_PATH, 'resource_pack/textures'));
  if (texExists) pass('Textures Directory', 'Exists'); else fail('Textures Directory', 'Missing');
  
  // Rule 4: entities/ dir
  const entExists = fs.existsSync(path.join(PROJECT_PATH, 'behavior_pack/entities'));
  if (entExists) pass('Entities Directory', 'Exists'); else fail('Entities Directory', 'Missing');
  
  // Rule 5: No Chinese paths  
  const allFiles = execSync(`find "${PROJECT_PATH}" -type f`, { encoding: 'utf-8' }).trim().split('\n');
  const chineseFiles = allFiles.filter(f => /[\u4e00-\u9fa5]/.test(f));
  if (chineseFiles.length === 0) {
    pass('No Chinese Paths', 'All paths are ASCII');
  } else {
    fail('No Chinese Paths', `${chineseFiles.length} files with Chinese paths`);
  }
  
  // Rule 6: No ghost files
  const ghostFiles = allFiles.filter(f => {
    const name = path.basename(f);
    return name === '.DS_Store' || name.startsWith('._') || f.includes('__MACOSX') || f.includes('__pycache__');
  });
  if (ghostFiles.length === 0) {
    pass('No Ghost Files', 'Clean');
  } else {
    fail('No Ghost Files', `${ghostFiles.length} ghost files found`);
  }
  
  // Rule 7: format_version & min_engine_version
  const issues7 = [];
  for (const pack of ['behavior_pack', 'resource_pack']) {
    const manifest = readManifest(path.join(PROJECT_PATH, pack));
    if (!manifest) { issues7.push(`${pack}: no manifest`); continue; }
    if (manifest.format_version !== 1) issues7.push(`${pack}: format_version=${manifest.format_version} (need 1)`);
    if (manifest.header?.min_engine_version) issues7.push(`${pack}: has min_engine_version (forbidden by NetEase)`);
  }
  if (issues7.length === 0) {
    pass('Format Version Compliance', 'All OK');
  } else {
    fail('Format Version Compliance', issues7.join('; '));
  }
  
  // Rule 8: Manifest naming (should be pack_manifest.json)
  const issues8 = [];
  for (const pack of ['behavior_pack', 'resource_pack']) {
    const hasOld = fs.existsSync(path.join(PROJECT_PATH, pack, 'manifest.json'));
    const hasNew = fs.existsSync(path.join(PROJECT_PATH, pack, 'pack_manifest.json'));
    if (hasOld && !hasNew) issues8.push(`${pack}: uses manifest.json (should be pack_manifest.json)`);
  }
  if (issues8.length === 0) {
    pass('Manifest Naming', 'Using pack_manifest.json');
  } else {
    fail('Manifest Naming', issues8.join('; '));
  }
  
  // Rule 9: mod.info
  const modInfoExists = fs.existsSync(path.join(PROJECT_PATH, 'behavior_pack/mod.info'));
  if (modInfoExists) {
    pass('mod.info Config', 'Exists');
  } else {
    fail('mod.info Config', 'Missing behavior_pack/mod.info');
  }
}

// =========================================
// STEP 3: Auto-Fix (simulate all fixable rules)
// =========================================
function step3_AutoFix() {
  log('🔧', '=== STEP 3: Auto-Fix All Issues ===');
  let fixCount = 0;
  
  // Fix format_version & remove min_engine_version for both packs
  for (const pack of ['behavior_pack', 'resource_pack']) {
    const manifest = readManifest(path.join(PROJECT_PATH, pack));
    if (!manifest) continue;
    
    let needsFix = false;
    if (manifest.format_version !== 1) { needsFix = true; }
    if (manifest.header?.min_engine_version) { needsFix = true; }
    
    if (needsFix) {
      const fixed = { ...manifest };
      delete fixed._path;
      delete fixed._name;
      fixed.format_version = 1;
      if (fixed.header) delete fixed.header.min_engine_version;
      fs.writeFileSync(manifest._path, JSON.stringify(fixed, null, 2));
      fixCount++;
      log('🔧', `  Fixed: ${pack} manifest (format_version → 1, removed min_engine_version)`);
    }
  }
  
  // Fix manifest naming: rename manifest.json → pack_manifest.json
  for (const pack of ['behavior_pack', 'resource_pack']) {
    const oldPath = path.join(PROJECT_PATH, pack, 'manifest.json');
    const newPath = path.join(PROJECT_PATH, pack, 'pack_manifest.json');
    if (fs.existsSync(oldPath) && !fs.existsSync(newPath)) {
      const content = fs.readFileSync(oldPath, 'utf-8');
      fs.writeFileSync(newPath, content);
      fs.unlinkSync(oldPath);
      fixCount++;
      log('🔧', `  Fixed: ${pack}/manifest.json → pack_manifest.json`);
    }
  }
  
  // Fix mod.info
  if (!fs.existsSync(path.join(PROJECT_PATH, 'behavior_pack/mod.info'))) {
    let projectName = 'Waystones';
    const manifest = readManifest(path.join(PROJECT_PATH, 'behavior_pack'));
    if (manifest?.header?.name) projectName = manifest.header.name.replace(/ (BP|netease_suffix)/g, '').trim();
    
    const modInfo = {
      netease_mod: {
        name: projectName,
        description: `${projectName} - 由 MC Studio macOS 创建`,
        author: 'MCStudio-macOS',
        version: '1.0.0',
        entry: 'scripts/modMain.py',
        min_engine_version: '2.0.0',
      },
    };
    fs.writeFileSync(path.join(PROJECT_PATH, 'behavior_pack/mod.info'), JSON.stringify(modInfo, null, 2));
    fixCount++;
    log('🔧', `  Fixed: Created behavior_pack/mod.info`);
  }
  
  pass('Auto-Fix', `Fixed ${fixCount} issues`);
}

// =========================================
// STEP 4: Re-run PreCheck (should all pass)
// =========================================
function step4_RePreCheck() {
  log('🔍', '=== STEP 4: Re-PreCheck (All Should PASS) ===');
  step2_PreCheck();
}

// =========================================
// STEP 5: Package as .mcaddon
// =========================================
async function step5_Package() {
  log('📦', '=== STEP 5: Package .mcaddon ===');
  
  const outputPath = path.join(PROJECTS_DIR, 'Waystones.mcaddon');
  
  try {
    // Use zip command (simulates archiver in Electron)
    execSync(`cd "${PROJECT_PATH}" && zip -r "${outputPath}" behavior_pack/ resource_pack/ -x '.*' '__MACOSX/*' '__pycache__/*' '*.pyc' '*/.DS_Store' '**/._*'`, {
      timeout: 30000,
    });
    
    const stat = fs.statSync(outputPath);
    pass('Package Creation', `${outputPath} (${(stat.size / 1024).toFixed(1)} KB)`);
    
    // Verify the mcaddon contents
    const contents = execSync(`unzip -l "${outputPath}"`, { encoding: 'utf-8' });
    log('📋', 'Package contents:');
    console.log(contents);
    
    // Verify key files exist in the package
    if (contents.includes('pack_manifest.json')) {
      pass('Package: pack_manifest.json', 'Present in archive');
    } else {
      fail('Package: pack_manifest.json', 'Missing from archive');
    }
    
    if (contents.includes('mod.info')) {
      pass('Package: mod.info', 'Present in archive');
    } else {
      fail('Package: mod.info', 'Missing from archive');
    }
    
    if (contents.includes('entities/')) {
      pass('Package: entities/', 'Present in archive');
    } else {
      fail('Package: entities/', 'Missing from archive');
    }
    
    if (contents.includes('textures/')) {
      pass('Package: textures/', 'Present in archive');
    } else {
      fail('Package: textures/', 'Missing from archive');
    }
    
    // Verify NO ghost files
    if (!contents.includes('.DS_Store') && !contents.includes('__MACOSX')) {
      pass('Package: No Ghost Files', 'Clean archive');
    } else {
      fail('Package: No Ghost Files', 'Ghost files found in archive');
    }
    
    // Verify fixed manifest contents
    const tmpDir = path.join(PROJECTS_DIR, '_verify');
    fs.mkdirSync(tmpDir, { recursive: true });
    execSync(`unzip -o "${outputPath}" -d "${tmpDir}"`, { timeout: 10000 });
    
    const bpManifest = JSON.parse(fs.readFileSync(path.join(tmpDir, 'behavior_pack/pack_manifest.json'), 'utf-8'));
    if (bpManifest.format_version === 1) {
      pass('Packaged BP: format_version', `Value: ${bpManifest.format_version} (correct)`);
    } else {
      fail('Packaged BP: format_version', `Value: ${bpManifest.format_version} (should be 1)`);
    }
    
    if (!bpManifest.header?.min_engine_version) {
      pass('Packaged BP: no min_engine_version', 'Correctly removed');
    } else {
      fail('Packaged BP: min_engine_version', 'Still present (should be removed)');
    }
    
    const modInfo = JSON.parse(fs.readFileSync(path.join(tmpDir, 'behavior_pack/mod.info'), 'utf-8'));
    if (modInfo.netease_mod?.name) {
      pass('Packaged mod.info', `name: "${modInfo.netease_mod.name}"`);
    } else {
      fail('Packaged mod.info', 'Missing netease_mod.name field');
    }
    
    // Cleanup
    fs.rmSync(tmpDir, { recursive: true });
    
  } catch (err) {
    fail('Package Creation', err.message);
  }
}

// =========================================
// Run all steps
// =========================================
async function main() {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  MC-Studio-macOS E2E Test: Waystones Mod Import Pipeline     ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log('');
  
  await step1_ImportMod();
  console.log('');
  
  step2_PreCheck();
  console.log('');
  
  step3_AutoFix();
  console.log('');
  
  step4_RePreCheck();
  console.log('');
  
  await step5_Package();
  console.log('');
  
  // Summary
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  TEST RESULTS SUMMARY                                        ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  
  const passed = RESULTS.filter(r => r.pass).length;
  const failed = RESULTS.filter(r => !r.pass).length;
  const total = RESULTS.length;
  
  console.log(`\n  Total: ${total}  |  Passed: ${passed}  |  Failed: ${failed}\n`);
  
  for (const r of RESULTS) {
    const icon = r.pass ? '✅' : '❌';
    console.log(`  ${icon} ${r.name}${r.detail ? ` — ${r.detail}` : ''}`);
  }
  
  console.log('');
  if (failed === 0) {
    console.log('  🎉 ALL TESTS PASSED! The Waystones mod import pipeline is fully functional.');
  } else {
    console.log(`  ⚠️  ${failed} test(s) failed. Review the output above.`);
  }
  console.log('');
}

main().catch(console.error);
