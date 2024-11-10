import * as yup from 'yup';

export const contactUsValidation = yup.object({
  email: yup.string().required().email(),
  message: yup.string().min(1).required(),
  name: yup.string().min(1).required(),
});
