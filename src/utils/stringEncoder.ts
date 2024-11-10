const encodeStringToBase64 = (text: string) => {
  const data = Buffer.from(text);
  const encoded = data.toString('base64');

  return encoded;
};

const decodeBase64ToString = (text: string) => {
  const data = Buffer.from(text, 'base64');
  const decoded = data.toString('utf-8');

  return decoded;
};

export { decodeBase64ToString, encodeStringToBase64 };
