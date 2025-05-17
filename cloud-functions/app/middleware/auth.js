import jwt from 'jsonwebtoken';
import { StatusCodes, ReasonPhrases } from 'http-status-codes';

import { environment } from '../private/enviroment.js';

export const verifyToken = (req, res, next) => {
  const bearerHeader = req.headers['authorization'];
  
  if (!bearerHeader) {
    return res.status(StatusCodes.UNAUTHORIZED).send({
      error: ReasonPhrases.UNAUTHORIZED,
      errorMessage: 'Access denied. No token provided.'
    });
  }
  
  try {
    const bearer = bearerHeader.split(' ');
    const token = bearer[1];
    const decoded = jwt.verify(token, environment.jwtKey);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(StatusCodes.UNAUTHORIZED).send({
      error: ReasonPhrases.UNAUTHORIZED,
      errorMessage: 'Invalid token'
    });
  }
};