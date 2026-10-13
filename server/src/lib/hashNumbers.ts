import crypto from 'node:crypto';

export function hashNumbers(numbers: string[]): string {
  const sorted = [...numbers].sort();
  return crypto.createHash('sha256').update(JSON.stringify(sorted)).digest('hex');
}
