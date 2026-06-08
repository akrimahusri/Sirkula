import React from 'react';

const StatusBadge = ({ status }) => {
  let bgColor = 'bg-gray-100';
  let textColor = 'text-gray-700';

  switch (status?.toLowerCase()) {
    case 'pending':
      bgColor = 'bg-yellow-100';
      textColor = 'text-yellow-700';
      break;
    case 'diterima':
      bgColor = 'bg-blue-100';
      textColor = 'text-blue-700';
      break;
    case 'dijemput':
      bgColor = 'bg-purple-100';
      textColor = 'text-purple-700';
      break;
    case 'selesai':
      bgColor = 'bg-brand-light';
      textColor = 'text-brand-green';
      break;
    case 'dibatalkan':
      bgColor = 'bg-red-100';
      textColor = 'text-red-700';
      break;
  }

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${bgColor} ${textColor}`}>
      {status || 'Unknown'}
    </span>
  );
};

export default StatusBadge;
