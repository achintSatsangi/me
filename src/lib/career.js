export const careerStart = new Date('2007-09-01');

export function careerYears(now = new Date()) {
  const anniversaryPassed =
    now.getUTCMonth() > careerStart.getUTCMonth() ||
    (now.getUTCMonth() === careerStart.getUTCMonth() && now.getUTCDate() >= careerStart.getUTCDate());
  return now.getUTCFullYear() - careerStart.getUTCFullYear() - (anniversaryPassed ? 0 : 1);
}

const ones = ['Zero','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty'];

export function careerYearsInWords(now = new Date()) {
  const n = careerYears(now);
  if (n < 20) return ones[n];
  const [t, o] = [Math.floor(n / 10), n % 10];
  return o === 0 ? tens[t] : `${tens[t]}-${ones[o].toLowerCase()}`;
}
