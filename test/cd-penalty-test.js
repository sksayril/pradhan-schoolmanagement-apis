/**
 * CD Penalty System Test
 * This file demonstrates how the CD penalty system works
 */

const { calculateCDPenalty, getCDPenaltySummary } = require('../utilities/cdPenaltyCalculator');

// Test scenarios for CD penalties
console.log('🧪 Testing CD Penalty System\n');

// Test 1: Payment due on 10th, checking on 20th (should have penalty)
console.log('📅 Test 1: Payment due on 10th, checking on 20th');
const dueDate1 = new Date('2024-01-10');
const checkDate1 = new Date('2024-01-20');
const penalty1 = calculateCDPenalty(dueDate1, checkDate1);
console.log('Due Date:', dueDate1.toDateString());
console.log('Check Date:', checkDate1.toDateString());
console.log('Penalty Result:', penalty1);
console.log('');

// Test 2: Payment due on 20th, checking on 25th (should have penalty)
console.log('📅 Test 2: Payment due on 20th, checking on 25th');
const dueDate2 = new Date('2024-01-20');
const checkDate2 = new Date('2024-01-25');
const penalty2 = calculateCDPenalty(dueDate2, checkDate2);
console.log('Due Date:', dueDate2.toDateString());
console.log('Check Date:', checkDate2.toDateString());
console.log('Penalty Result:', penalty2);
console.log('');

// Test 3: Payment due on 10th, checking on 14th (no penalty - within grace period)
console.log('📅 Test 3: Payment due on 10th, checking on 14th (within grace period)');
const dueDate3 = new Date('2024-01-10');
const checkDate3 = new Date('2024-01-14');
const penalty3 = calculateCDPenalty(dueDate3, checkDate3);
console.log('Due Date:', dueDate3.toDateString());
console.log('Check Date:', checkDate3.toDateString());
console.log('Penalty Result:', penalty3);
console.log('');

// Test 4: Payment due on 25th, checking on 26th (penalty starts immediately)
console.log('📅 Test 4: Payment due on 25th, checking on 26th (penalty starts immediately)');
const dueDate4 = new Date('2024-01-25');
const checkDate4 = new Date('2024-01-26');
const penalty4 = calculateCDPenalty(dueDate4, checkDate4);
console.log('Due Date:', dueDate4.toDateString());
console.log('Check Date:', checkDate4.toDateString());
console.log('Penalty Result:', penalty4);
console.log('');

// Test 5: Payment due on 5th, checking on 30th (penalty from 16th)
console.log('📅 Test 5: Payment due on 5th, checking on 30th (penalty from 16th)');
const dueDate5 = new Date('2024-01-05');
const checkDate5 = new Date('2024-01-30');
const penalty5 = calculateCDPenalty(dueDate5, checkDate5);
console.log('Due Date:', dueDate5.toDateString());
console.log('Check Date:', checkDate5.toDateString());
console.log('Penalty Result:', penalty5);
console.log('');

// Test 6: Payment not overdue
console.log('📅 Test 6: Payment not overdue');
const dueDate6 = new Date('2024-01-30');
const checkDate6 = new Date('2024-01-25');
const penalty6 = calculateCDPenalty(dueDate6, checkDate6);
console.log('Due Date:', dueDate6.toDateString());
console.log('Check Date:', checkDate6.toDateString());
console.log('Penalty Result:', penalty6);
console.log('');

// Test 7: Multiple CD payments summary
console.log('📊 Test 7: Multiple CD payments summary');
const mockCDPayments = [
  {
    requestId: 'PR001',
    paymentType: 'CD',
    amount: 10000,
    dueDate: new Date('2024-01-10'),
    status: 'PENDING'
  },
  {
    requestId: 'PR002',
    paymentType: 'CD',
    amount: 15000,
    dueDate: new Date('2024-01-20'),
    status: 'PENDING'
  },
  {
    requestId: 'PR003',
    paymentType: 'CD',
    amount: 20000,
    dueDate: new Date('2024-01-05'),
    status: 'PENDING'
  }
];

const summary = getCDPenaltySummary(mockCDPayments);
console.log('CD Payments Summary:', summary);
console.log('');

// Test 8: Edge case - month boundary
console.log('📅 Test 8: Month boundary case');
const dueDate8 = new Date('2024-01-31');
const checkDate8 = new Date('2024-02-16');
const penalty8 = calculateCDPenalty(dueDate8, checkDate8);
console.log('Due Date:', dueDate8.toDateString());
console.log('Check Date:', checkDate8.toDateString());
console.log('Penalty Result:', penalty8);
console.log('');

console.log('✅ CD Penalty System Tests Completed!');
console.log('\n📋 Summary of Penalty Rules:');
console.log('- CD payments have a grace period of 15 days in a month');
console.log('- If due date is on or before 15th: penalty starts from 16th');
console.log('- If due date is after 15th: penalty starts from the day after due date');
console.log('- Penalty rate: ₹10 per day');
console.log('- Only applies to CD payment type');
console.log('- Only applies to PENDING payments');
