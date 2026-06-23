const text = "João Silva 11988887777";
const phoneRegexWithDDD = /(?:\+?55\s*)?\(?\b([1-9][0-9])\)?\s*(9?\s*[0-9]{4})\s*-?\s*([0-9]{4})\b/;
console.log("With DDD:", text.match(phoneRegexWithDDD));

const phoneShortRegex = /\b(9?\s*[0-9]{4})\s*-?\s*([0-9]{4})\b/;
console.log("Short:", text.match(phoneShortRegex));
