import React from 'react';
import { TextField } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

/**
 * Standardized Date Picker Component
 * 
 * A reusable, professional calendar UI component using MUI X Date Pickers.
 * Ensures consistent date selection experience across the entire application.
 * 
 * @param {Object} props
 * @param {string|Date|dayjs.Dayjs} props.value - Current date value
 * @param {Function} props.onChange - Callback when date changes (receives dayjs object)
 * @param {string} props.label - Label for the date picker
 * @param {boolean} props.disabled - Disable the date picker
 * @param {boolean} props.required - Mark field as required
 * @param {string|Date|dayjs.Dayjs} props.minDate - Minimum selectable date
 * @param {string|Date|dayjs.Dayjs} props.maxDate - Maximum selectable date
 * @param {Function} props.shouldDisableDate - Function to disable specific dates
 * @param {string} props.format - Date format (default: "YYYY-MM-DD")
 * @param {boolean} props.fullWidth - Make the picker full width
 * @param {string} props.margin - Margin (none|dense|normal)
 * @param {string} props.error - Error message
 * @param {string} props.helperText - Helper text below the field
 * @param {string} props.name - Input name attribute
 * @param {Object} props.slotProps - Additional props for internal slots
 */
const AppDatePicker = ({
  value,
  onChange,
  label = 'Select Date',
  disabled = false,
  required = false,
  minDate,
  maxDate,
  shouldDisableDate,
  format = 'YYYY-MM-DD',
  fullWidth = true,
  margin = 'normal',
  error,
  helperText,
  name,
  slotProps = {},
  ...otherProps
}) => {
  // Convert value to dayjs if it's a string or Date
  const dayjsValue = value ? dayjs(value) : null;

  // Handle date change
  const handleDateChange = (newValue) => {
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        label={label}
        value={dayjsValue}
        onChange={handleDateChange}
        disabled={disabled}
        minDate={minDate ? dayjs(minDate) : undefined}
        maxDate={maxDate ? dayjs(maxDate) : undefined}
        shouldDisableDate={shouldDisableDate}
        format={format}
        slotProps={{
          textField: {
            fullWidth,
            margin,
            required,
            error: !!error,
            helperText: error || helperText,
            name,
            InputLabelProps: { shrink: true },
            ...slotProps.textField,
          },
          ...slotProps,
        }}
        {...otherProps}
      />
    </LocalizationProvider>
  );
};

export default AppDatePicker;
