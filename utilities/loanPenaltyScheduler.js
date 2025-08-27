const cron = require('node-cron');
const { processAllOverdueLoans } = require('./loanPenaltyCalculator');

/**
 * Loan Penalty Scheduler
 * Automatically processes overdue loans every day at 2 AM
 */

// Schedule penalty processing to run daily at 2 AM
const startPenaltyScheduler = () => {
  console.log('⏰ Starting loan penalty scheduler...');
  
  // Run every day at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('🕐 Running scheduled loan penalty processing...');
    try {
      const result = await processAllOverdueLoans();
      console.log('✅ Scheduled penalty processing completed:', result);
    } catch (error) {
      console.error('❌ Scheduled penalty processing failed:', error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata" // Indian timezone
  });
  
  console.log('✅ Loan penalty scheduler started successfully');
  console.log('📅 Will run daily at 2:00 AM IST');
};

// Manual trigger for testing
const triggerManualProcessing = async () => {
  console.log('🔧 Manually triggering penalty processing...');
  try {
    const result = await processAllOverdueLoans();
    console.log('✅ Manual penalty processing completed:', result);
    return result;
  } catch (error) {
    console.error('❌ Manual penalty processing failed:', error);
    throw error;
  }
};

// Start scheduler immediately if called directly
if (require.main === module) {
  startPenaltyScheduler();
}

module.exports = {
  startPenaltyScheduler,
  triggerManualProcessing
};
