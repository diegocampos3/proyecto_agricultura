const express = require('express');
const router = express.Router();
const registerController = require('../controllers/registerController')
const gptController = require('../controllers/gptController'); 

module.exports = function() {
   
    router.post('/register', registerController.newRegister);

    router.get('/register/:idRegister', registerController.showRegister);
 
    /* Recommendations */
    router.post('/generate-content', gptController.generateContent);

    return router;
}
