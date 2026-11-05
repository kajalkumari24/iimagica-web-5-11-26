import { body, validationResult } from 'express-validator';

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

export const validateEmail = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  handleValidationErrors
];

export const validateProfile = [
  body('name').optional().trim().escape().isLength({ min: 1, max: 100 }),
  body('mobile').optional().isMobilePhone().withMessage('Valid mobile number required'),
  body('email').isEmail().normalizeEmail(),
  body('website').optional().isURL().withMessage('Valid URL required'),
  handleValidationErrors
];

export const validateOTP = [
  body('email').isEmail().normalizeEmail(),
  body('otp').isLength({ min: 4, max: 6 }).isNumeric(),
  handleValidationErrors
];