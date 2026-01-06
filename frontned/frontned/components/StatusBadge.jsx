import React from 'react';
import { Chip } from '@mui/material';
import {
  CheckCircle,
  HourglassEmpty,
  LocalShipping,
  Cancel,
  Warning,
  Payment as PaymentIcon
} from '@mui/icons-material';

const StatusBadge = ({ status, type = 'trip' }) => {
  const getConfig = () => {
    if (type === 'trip') {
      switch (status?.toLowerCase()) {
        case 'completed':
          return { color: 'success', icon: <CheckCircle />, label: 'Completed' };
        case 'running':
          return { color: 'info', icon: <LocalShipping />, label: 'Running' };
        case 'pending':
          return { color: 'warning', icon: <HourglassEmpty />, label: 'Pending' };
        case 'cancelled':
          return { color: 'error', icon: <Cancel />, label: 'Cancelled' };
        default:
          return { color: 'default', icon: <HourglassEmpty />, label: status || 'Unknown' };
      }
    }

    if (type === 'payment') {
      switch (status?.toLowerCase()) {
        case 'paid':
          return { color: 'success', icon: <CheckCircle />, label: 'Paid' };
        case 'partial':
          return { color: 'warning', icon: <PaymentIcon />, label: 'Partial' };
        case 'pending':
          return { color: 'error', icon: <HourglassEmpty />, label: 'Pending' };
        default:
          return { color: 'default', icon: <Warning />, label: status || 'Unknown' };
      }
    }

    return { color: 'default', label: status || 'Unknown' };
  };

  const config = getConfig();

  return (
    <Chip
      icon={config.icon}
      label={config.label}
      color={config.color}
      size="small"
      sx={{ fontWeight: 500 }}
    />
  );
};

export default StatusBadge;