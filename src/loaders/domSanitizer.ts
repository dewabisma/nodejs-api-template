import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';

export default () => {
  const window = new JSDOM('').window;
  const purify = DOMPurify(window);

  return purify;
};
