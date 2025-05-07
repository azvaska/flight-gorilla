export function stringToDate(input: string): Date {
  const parts = input.split('-').map(Number);

  if (parts.length === 2 && parts[0] <= 12) {
    // mm-yyyy
    const [month, year] = parts;
    return new Date(year, month - 1);
  } else if (parts.length === 3 && parts[0] <= 31) {
    // dd-mm-yyyy
    const [day, month, year] = parts;
    return new Date(year, month - 1, day);
  } else {
    throw new Error('Unrecognized date format');
  }
}

export function dateToString(date: Date, dateType: 'specific' | 'flexible') {
  const dd = date.toLocaleString('en-GB', { day: '2-digit' });
  const mm = date.toLocaleString('en-GB', { month: '2-digit' });
  const yyyy = date.getFullYear();
  if (dateType === 'specific') {
    return `${dd}-${mm}-${yyyy}`;
  } else {
    //Only month and year
    return `${mm}-${yyyy}`;
  }
}

export function formatDate(date: Date, dateType: 'specific' | 'flexible') {
  if (dateType === 'specific') {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }
}
