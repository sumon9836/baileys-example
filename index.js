
const { connectToWA } = require('./lib/client');

// Start the WhatsApp connection
connectToWA().catch(err => {
    console.error('Failed to connect to WhatsApp:', err);
    process.exit(1);
});
