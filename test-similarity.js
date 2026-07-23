function calculateSimilarity(str1, str2) {
  const s1 = str1.toLowerCase().replace(/[^a-z0-9ğüşıöç]/g, '');
  const s2 = str2.toLowerCase().replace(/[^a-z0-9ğüşıöç]/g, '');
  if (s1 === s2) return 100;
  if (s1.includes(s2) || s2.includes(s1)) {
    return Math.round((Math.min(s1.length, s2.length) / Math.max(s1.length, s2.length)) * 100);
  }
  
  // simple levenshtein
  const matrix = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(null));
  for (let i = 0; i <= s1.length; i += 1) matrix[0][i] = i;
  for (let j = 0; j <= s2.length; j += 1) matrix[j][0] = j;
  for (let j = 1; j <= s2.length; j += 1) {
    for (let i = 1; i <= s1.length; i += 1) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  const distance = matrix[s2.length][s1.length];
  const maxLength = Math.max(s1.length, s2.length);
  return Math.round(((maxLength - distance) / maxLength) * 100);
}
console.log(calculateSimilarity("Çağrı İŞCEN", "Cagri Iscen"));
