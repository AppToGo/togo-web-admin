#!/usr/bin/env node

/**
 * Tailwind CSS v4 Configuration Checker
 * 
 * Este script verifica que la configuración de Tailwind CSS v4 esté correcta
 * y reporta posibles problemas con los estilos.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

function checkFile(filePath, description) {
  const fullPath = path.join(ROOT_DIR, filePath);
  const exists = fs.existsSync(fullPath);
  
  if (exists) {
    log(`✓ ${description}: ${filePath}`, 'green');
  } else {
    log(`✗ ${description}: ${filePath} NO ENCONTRADO`, 'red');
  }
  
  return exists;
}

function checkGlobalsCSS() {
  const globalsPath = path.join(ROOT_DIR, 'app', 'globals.css');
  
  if (!fs.existsSync(globalsPath)) {
    log('✗ No se encontró app/globals.css', 'red');
    return false;
  }
  
  const content = fs.readFileSync(globalsPath, 'utf-8');
  const checks = [
    { name: '@import "tailwindcss"', pattern: /@import\s+["']tailwindcss["']/ },
    { name: '@theme', pattern: /@theme\s*\{/ },
    { name: '@layer utilities', pattern: /@layer\s+utilities\s*\{/ },
    { name: '@layer base', pattern: /@layer\s+base\s*\{/ },
    { name: '@source', pattern: /@source\s+/ },
  ];
  
  log('\n📄 Verificando app/globals.css:', 'cyan');
  
  let allPassed = true;
  for (const check of checks) {
    const passed = check.pattern.test(content);
    if (passed) {
      log(`  ✓ ${check.name}`, 'green');
    } else {
      log(`  ✗ ${check.name} no encontrado`, 'red');
      allPassed = false;
    }
  }
  
  // Verificar utilidades personalizadas
  log('\n🎨 Utilidades personalizadas:', 'cyan');
  const utilities = [
    '.shadow-card',
    '.glass',
    '.rounded-card',
    '.bg-gradient-soft',
    '.animate-cardEnter',
  ];
  
  for (const utility of utilities) {
    const escaped = utility.replace(/\./g, '\\.');
    const pattern = new RegExp(escaped + '\\s*\\{');
    const exists = pattern.test(content);
    
    if (exists) {
      log(`  ✓ ${utility}`, 'green');
    } else {
      log(`  ✗ ${utility} no encontrado`, 'yellow');
    }
  }
  
  return allPassed;
}

function checkCVAVariants() {
  const variantsPath = path.join(ROOT_DIR, 'features', 'orders', 'styles', 'kanban.variants.ts');
  
  if (!fs.existsSync(variantsPath)) {
    log('✗ No se encontró features/orders/styles/kanban.variants.ts', 'red');
    return false;
  }
  
  const content = fs.readFileSync(variantsPath, 'utf-8');
  
  log('\n🧩 Verificando CVA Variants:', 'cyan');
  
  const variants = [
    'kanbanCardVariants',
    'categoryBadgeVariants',
    'kanbanColumnVariants',
    'columnHeaderColorVariants',
    'progressBarVariants',
    'activityIconVariants',
    'avatarVariants',
    'metricsCardVariants',
    'mainContainerVariants',
  ];
  
  for (const variant of variants) {
    const exists = content.includes(`export const ${variant}`);
    if (exists) {
      log(`  ✓ ${variant}`, 'green');
    } else {
      log(`  ✗ ${variant} no exportado`, 'red');
    }
  }
  
  return true;
}

function checkNodeModules() {
  log('\n📦 Dependencias:', 'cyan');
  
  const packageJsonPath = path.join(ROOT_DIR, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  
  const deps = ['tailwindcss', 'class-variance-authority', 'tailwind-merge', 'clsx'];
  
  for (const dep of deps) {
    const version = packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep];
    if (version) {
      log(`  ✓ ${dep}@${version}`, 'green');
    } else {
      log(`  ✗ ${dep} no encontrado en package.json`, 'red');
    }
  }
  
  // Verificar versión de Tailwind
  const tailwindVersion = packageJson.dependencies?.tailwindcss || packageJson.devDependencies?.tailwindcss;
  if (tailwindVersion) {
    const majorVersion = parseInt(tailwindVersion.match(/\d+/)?.[0] || '0');
    if (majorVersion >= 4) {
      log(`  ✓ Tailwind CSS v${majorVersion} detectado`, 'green');
    } else {
      log(`  ⚠ Tailwind CSS v${majorVersion} (Se recomienda v4)`, 'yellow');
    }
  }
}

function checkPostcssConfig() {
  log('\n⚙️  Configuración PostCSS:', 'cyan');
  
  const postcssPath = path.join(ROOT_DIR, 'postcss.config.mjs');
  const postcssJsPath = path.join(ROOT_DIR, 'postcss.config.js');
  
  if (fs.existsSync(postcssPath) || fs.existsSync(postcssJsPath)) {
    log('  ✓ postcss.config encontrado', 'green');
  } else {
    log('  ⚠ No se encontró postcss.config (Next.js usa configuración por defecto)', 'yellow');
  }
}

function main() {
  log('╔══════════════════════════════════════════════════════════╗', 'magenta');
  log('║     Tailwind CSS v4 Configuration Checker                 ║', 'magenta');
  log('╚══════════════════════════════════════════════════════════╝', 'magenta');
  
  log('\n📁 Verificando archivos esenciales:', 'cyan');
  
  const files = [
    ['app/globals.css', 'Configuración Tailwind CSS'],
    ['features/orders/styles/kanban.variants.ts', 'Variantes CVA'],
    ['features/orders/styles/index.ts', 'Exportaciones de estilos'],
    ['lib/utils.ts', 'Utilidades (cn function)'],
  ];
  
  let allFilesExist = true;
  for (const [file, desc] of files) {
    const exists = checkFile(file, desc);
    if (!exists) allFilesExist = false;
  }
  
  checkNodeModules();
  checkPostcssConfig();
  const globalsOk = checkGlobalsCSS();
  const variantsOk = checkCVAVariants();
  
  log('\n' + '═'.repeat(60), 'magenta');
  
  if (allFilesExist && globalsOk && variantsOk) {
    log('✅ Todo está configurado correctamente', 'green');
    log('\n💡 Para limpiar caché y hacer build:', 'cyan');
    log('   npm run clean:build', 'yellow');
    log('\n💡 Para iniciar en modo debug:', 'cyan');
    log('   npm run styles:debug', 'yellow');
  } else {
    log('⚠️  Se encontraron problemas en la configuración', 'yellow');
    process.exit(1);
  }
  
  log('═'.repeat(60), 'magenta');
}

main();
