const webpush = require('web-push');
const logger = require('./logger');

// Initialize web-push with VAPID keys (generate your own)
webpush.setVapidDetails(
  'mailto:admin@faculty.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const sendNotification = (subscription, data) => {
  webpush.sendNotification(subscription, JSON.stringify(data))
    .catch(err => logger.error('Push notification failed:', err));
};

module.exports = {
  sendNotification
};