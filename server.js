import 'dotenv/config';
import app from './app.js';
import logger from './lib/logger.js';
import { runAutoReminder } from './server/services/reminder.js';

const PORT = process.env.PORT || 3001;

function runAutoReminderSafely() {
    runAutoReminder().catch((err) => {
        logger.error({ err }, 'auto reminder job failed');
    });
}

// Midnight auto-reminder job
function scheduleMidnightJob() {
    const now = new Date();
    const nextMidnight = new Date();
    nextMidnight.setHours(24, 0, 0, 0);
    const msUntilMidnight = nextMidnight - now;
    setTimeout(function () {
        runAutoReminderSafely();
        setInterval(runAutoReminderSafely, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);
}

scheduleMidnightJob();

app.listen(PORT, () => {
    logger.info({ port: PORT }, 'server started');
});
