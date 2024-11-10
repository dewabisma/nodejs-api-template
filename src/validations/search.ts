import * as yup from 'yup';

export const omniSearchValidation = yup.object({
  keyword: yup.string().min(1).required(),
});
