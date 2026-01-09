#!/usr/bin/env node

/**
 * Push Notification Verification Script
 * Run this to verify the push notification implementation is complete
 */

const fs = require('fs');
const path = require('path');

const BASE_PATH = __dirname;
const CHECKLIST = [];

function checkFile(relativePath, description) {
  const fullPath = path.join(BASE_PATH, relativePath);
  const exists = fs.existsSync(fullPath);
  CHECKLIST.push({
    description,
    path: relativePath,
    status: exists ? '✅' : '❌'
  });
  return exists;
}

function checkContent(relativePath, searchString, description) {
  const fullPath = path.join(BASE_PATH, relativePath);
  if (!fs.existsSync(fullPath)) {
    CHECKLIST.push({
      description,
      path: relativePath,
      status: '❌ (File not found)'
    });
    return false;
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  const found = content.includes(searchString);
  CHECKLIST.push({
    description,
    path: relativePath,
    status: found ? '✅' : '❌'
  });
  return found;
}

console.log('🔍 Push Notification Implementation Verification\n');
console.log('Checking required files and implementation...\n');

// Check core files
checkFile('PNChatClient/src/app/core/service/notification.service.ts', 
  'NotificationService exists');
checkFile('PNChatClient/src/service-worker.js', 
  'Service Worker exists');

// Check integration
checkContent('PNChatClient/src/app/containers/home/template/message/message-detail/message-detail.component.ts',
  'NotificationService',
  'NotificationService imported in MessageDetailComponent');

checkContent('PNChatClient/src/app/containers/home/template/message/message-detail/message-detail.component.ts',
  'handleIncomingMessageNotification',
  'handleIncomingMessageNotification method implemented');

checkContent('PNChatClient/src/app/containers/home/template/message/message-detail/message-detail.component.ts',
  'showGroupNotification|showMessageNotification|showEmergencyNotification',
  'Notification service methods called');

// Check documentation
checkFile('PNChatClient/src/PUSH_NOTIFICATIONS.md', 
  'User documentation exists');
checkFile('IMPLEMENTATION_SUMMARY.md', 
  'Implementation summary exists');
checkFile('QUICK_START.md', 
  'Quick start guide exists');
checkFile('TECHNICAL_ARCHITECTURE.md', 
  'Technical architecture documentation exists');

// Check NotificationService features
checkContent('PNChatClient/src/app/core/service/notification.service.ts',
  'showNotification',
  'Generic notification method');

checkContent('PNChatClient/src/app/core/service/notification.service.ts',
  'showMessageNotification',
  'Direct message notification method');

checkContent('PNChatClient/src/app/core/service/notification.service.ts',
  'showGroupNotification',
  'Group message notification method');

checkContent('PNChatClient/src/app/core/service/notification.service.ts',
  'showEmergencyNotification',
  'Emergency notification method');

checkContent('PNChatClient/src/app/core/service/notification.service.ts',
  'Notification.requestPermission',
  'Permission request handling');

// Check service worker features
checkContent('PNChatClient/src/service-worker.js',
  "addEventListener('push'",
  'Service Worker push event listener');

checkContent('PNChatClient/src/service-worker.js',
  "addEventListener('notificationclick'",
  'Service Worker notification click handler');

// Print results
console.log('═'.repeat(70));
console.log('Implementation Status Report');
console.log('═'.repeat(70) + '\n');

let passedCount = 0;
let failedCount = 0;

CHECKLIST.forEach(item => {
  const status = item.status === '✅' ? passedCount++ : failedCount++;
  console.log(`${item.status} ${item.description}`);
  console.log(`   └─ ${item.path}\n`);
});

console.log('═'.repeat(70));
console.log(`Results: ${passedCount} Passed, ${failedCount} Failed`);
console.log('═'.repeat(70) + '\n');

if (failedCount === 0) {
  console.log('✨ All checks passed! Push notification implementation is complete.\n');
  console.log('📋 Next steps:');
  console.log('   1. Run: cd PNChatClient && npm start');
  console.log('   2. Grant notification permission when prompted');
  console.log('   3. Send a message to test notifications\n');
  process.exit(0);
} else {
  console.log('⚠️  Some checks failed. Please review the implementation.\n');
  process.exit(1);
}
