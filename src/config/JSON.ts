import JSONbig from 'json-bigint';

const _oldJSONParse = JSON.parse;
JSON.parse = JSONbig({ useNativeBigInt: true }).parse;
