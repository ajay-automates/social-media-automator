const express = require('express');
const router = express.Router();
const { handleWebhook } = require('../services/billing');

// Stripe Webhook
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
        const signature = req.headers['stripe-signature'];
        const result = await handleWebhook(req.body, signature);

        if (result.success) {
            res.json({ received: true });
        } else {
            res.status(400).send(`Webhook Error: ${result.error}`);
        }
    } catch (error) {
        console.error('Stripe webhook error:', error);
        res.status(400).send(`Webhook Error: ${error.message}`);
    }
});

module.exports = router;
