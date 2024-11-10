import * as yup from 'yup';

export const loginValidation = yup.object({
  username: yup.string().required().min(4),
  password: yup.string().required().min(4),
});

export const registerValidation = yup.object({
  username: yup.string().required().min(4),
  email: yup.string().required().email(),
  password: yup
    .string()
    .required()
    .min(8)
    .matches(/^(?=.*[a-zA-Z])(?=.*[0-9]).+$/, {
      message: 'password must be a combination of letter and number',
    }),
});

export const requestPasswordResetValidation = yup.object({
  email: yup.string().required().email(),
});

export const requestAccountVerificationValidation = yup.object({
  email: yup.string().required().email(),
});

export const oauthValidation = yup.object({
  token: yup.string().required().length(64),
});
