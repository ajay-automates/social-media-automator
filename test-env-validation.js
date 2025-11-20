require('dotenv').config();
const { validateEnv } = require('./utilities/env-validator');

console.log("Testing environment validation...");
try {
    validateEnv();
    console.log("Validation function executed successfully.");
} catch (error) {
    console.error("Validation threw an error:", error);
}
