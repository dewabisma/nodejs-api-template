import * as yup from 'yup';
import { validBigIntTest, validDateTest } from './helpers.js';

export const userValidation = yup.object({
  username: yup.string().min(1).max(255),
  dateOfBirth: validDateTest,
});

export const verifyUserValidation = yup.object({
  token: yup.string().required().length(64),
  userId: validBigIntTest.required(),
});

export const userResetPasswordValidation = yup.object({
  userId: validBigIntTest.required(),
  token: yup.string().required().length(64),
  password: yup.string().required().min(4),
});
