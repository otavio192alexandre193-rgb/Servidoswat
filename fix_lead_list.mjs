import fs from 'fs';
let content = fs.readFileSync('src/components/LeadList.tsx', 'utf-8');

// Replace isFictitiousPhone
const replaceFictitious = `export function isFictitiousPhone(phone: string | undefined | null): boolean {
  if (!phone) return true;
  const clean = phone.replace(/\\D/g, '');
  if (clean.length < 8) return true;
  if (/(\\d)\\1{5,}/.test(clean)) return true;
  if (clean.includes('1234567') || clean.includes('9876543')) return true;
  return false;
}`

const fictStartIndex = content.indexOf('export function isFictitiousPhone');
const fictEndIndex = content.indexOf('}', fictStartIndex) + 1;
content = content.slice(0, fictStartIndex) + replaceFictitious + content.slice(fictEndIndex);

const extractStartStr = `export function extractPhoneFromString`;
const extractStartIndex = content.indexOf(extractStartStr);
const nextExportIndex = content.indexOf('export ', extractStartIndex + 10);
const extractEndIndex = content.lastIndexOf('}', nextExportIndex === -1 ? content.length : nextExportIndex) + 1;

const newExtractFunc = `export function extractPhoneFromString(text: string | undefined | null): { extractedPhone: string | null; cleanedText: string } {
  if (!text) return { extractedPhone: null, cleanedText: '' };
  
  const phoneRegexWithDDD = /(?:\\+?55\\s*)?\\(?([1-9][0-9])\\)?\\s*(9?\\s*[0-9]{4})\\s*-?\\s*([0-9]{4})(?!\\d)/;
  const matchWithDDD = text.match(phoneRegexWithDDD);
  
  if (matchWithDDD) {
    const fullMatch = matchWithDDD[0];
    const ddd = matchWithDDD[1];
    const p1 = matchWithDDD[2];
    const p2 = matchWithDDD[3];
    
    // Clean to strict digits
    const rawDigits = (ddd + p1 + p2).replace(/\\D/g, '');
    let formatted = '';
    
    if (rawDigits.length >= 10 && rawDigits.length <= 11) {
       formatted = formatBRLPhone(rawDigits);
    } else {
       formatted = rawDigits;
    }
    
    let cleaned = text.replace(fullMatch, '').trim();
    cleaned = cleaned.replace(/^[-_\\s()]+|[-_\\s()]+$/g, '').trim();
    
    return {
      extractedPhone: formatted,
      cleanedText: cleaned
    };
  }

  // Fallback: look for 8 or 9 digits WITHOUT DDD
  const phoneShortRegex = /(?<!\\d)(9?\\s*[0-9]{4})\\s*-?\\s*([0-9]{4})(?!\\d)/;
  const matchShort = text.match(phoneShortRegex);
  
  if (matchShort) {
    const fullMatch = matchShort[0];
    const p1 = matchShort[1];
    const p2 = matchShort[2];
    const rawDigits = (p1 + p2).replace(/\\D/g, '');
    
    if (rawDigits.length >= 8 && !(rawDigits.length === 8 && (rawDigits.startsWith('19') || rawDigits.startsWith('20')))) {
      let formatted = formatBRLPhone('11' + rawDigits); // Default to SP DDD
      
      let cleaned = text.replace(fullMatch, '').trim();
      cleaned = cleaned.replace(/^[-_\\s()]+|[-_\\s()]+$/g, '').trim();
      
      return {
        extractedPhone: formatted,
        cleanedText: cleaned
      };
    }
  }

  return { extractedPhone: null, cleanedText: text.trim() };
}
`;

content = content.slice(0, extractStartIndex) + newExtractFunc + content.slice(extractEndIndex);

fs.writeFileSync('src/components/LeadList.tsx', content);
