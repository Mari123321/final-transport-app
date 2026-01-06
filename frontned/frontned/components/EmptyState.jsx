import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { AddCircleOutline } from '@mui/icons-material';

const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction 
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        textAlign: 'center',
        py: 6
      }}
    >
      {Icon && (
        <Icon 
          sx={{ 
            fontSize: 80, 
            color: 'text.disabled',
            mb: 2 
          }} 
        />
      )}
      
      <Typography 
        variant="h5" 
        color="text.secondary" 
        gutterBottom
        fontWeight={600}
      >
        {title}
      </Typography>
      
      <Typography 
        variant="body1" 
        color="text.disabled"
        sx={{ maxWidth: 400, mb: 3 }}
      >
        {description}
      </Typography>

      {actionLabel && onAction && (
        <Button
          variant="contained"
          startIcon={<AddCircleOutline />}
          onClick={onAction}
          size="large"
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
};

export default EmptyState;