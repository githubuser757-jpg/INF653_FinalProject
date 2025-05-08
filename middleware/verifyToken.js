const jwt = require('jsonwebtoken');

function verifyToken(req, res, next){
    //Get the token from the "Authorization" header
    const authHeader = req.headers.authorization;

    if(!authHeader){
        return res.status(401).json({error: 'Access Denied. No token provided.'});
    }

    const token = authHeader.split(' ')[1];

    if(!token){
        return res.status(401).json({error: 'Access Denied. No token provided.'})
    }

    try{
        //Verify the token using the secret
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verified; //Attach the payload to the request
        next();
    } catch(e){
        res.status(401).json({error: 'Invalid Token'});
    }
}

module.exports = verifyToken;