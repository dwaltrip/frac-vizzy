
const formatDate = dateString => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
  }).format(date);
};

function DateTime({ string }) {
  return string ? formatDate(string) : '';
}

export { DateTime };
