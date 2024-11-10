const slugify = (title: string) => {
  const cleaned = title.replace(/[\W_]+/g, ' ');

  const splitAndLowerCase = cleaned.trim().toLowerCase().split(' ');
  const joinWithHyphen = splitAndLowerCase.join('-');

  return joinWithHyphen;
};

export const slugifyFile = (title: string) => {
  const cleaned = title.replace(/[\W_]+/g, ' ');

  const splitAndLowerCase = cleaned.trim().toLowerCase().split(' ');
  splitAndLowerCase.pop();

  const joinWithHyphen = splitAndLowerCase.join('-');

  return joinWithHyphen;
};

export default slugify;
