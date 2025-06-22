const Register = require('../models/Register')

exports.newRegister = async (req, res, next) => {
    const register = new Register(req.body);

    try {

        await register.save();
        res.json({message: 'A new crop has been added to the consultation'})

    } catch (error) {
        res.send(error);
        next();
    }
}

exports.showRegister = async(req, res, next) => {
    const register = await Register.findById(req.params.idRegister);

    if (!register) {
        res.json({message: 'The record does not exist'});
        next();
    }
    res.json(register);
}


