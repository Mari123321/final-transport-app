import React from 'react';
import { Box, Skeleton, Paper, Grid } from '@mui/material';

const LoadingSkeleton = ({ variant = 'table', rows = 5 }) => {
  const cardStyle = {
    p: 3,
    mb: 3,
    borderRadius: 2,
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
    border: "1px solid #e2e8f0",
    background: "white",
  };

  if (variant === 'cards') {
    return (
      <Grid container spacing={3}>
        {Array.from({ length: 3 }).map((_, idx) => (
          <Grid item xs={12} md={4} key={idx}>
            <Paper sx={{ ...cardStyle, mb: 0 }}>
              <Skeleton variant="text" width="40%" height={24} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="60%" height={40} />
            </Paper>
          </Grid>
        ))}
      </Grid>
    );
  }

  if (variant === 'filters') {
    return (
      <Paper sx={cardStyle}>
        <Grid container spacing={2}>
          {Array.from({ length: 4 }).map((_, idx) => (
            <Grid item xs={12} sm={6} md={3} key={idx}>
              <Skeleton variant="rectangular" height={40} sx={{ borderRadius: 1 }} />
            </Grid>
          ))}
        </Grid>
      </Paper>
    );
  }

  // Default: table variant
  return (
    <Paper sx={cardStyle}>
      {/* Table Header */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, pb: 2, borderBottom: '2px solid #e2e8f0' }}>
        <Skeleton variant="rectangular" width="5%" height={40} sx={{ borderRadius: 1 }} />
        <Skeleton variant="rectangular" width="25%" height={40} sx={{ borderRadius: 1 }} />
        <Skeleton variant="rectangular" width="20%" height={40} sx={{ borderRadius: 1 }} />
        <Skeleton variant="rectangular" width="20%" height={40} sx={{ borderRadius: 1 }} />
        <Skeleton variant="rectangular" width="15%" height={40} sx={{ borderRadius: 1 }} />
        <Skeleton variant="rectangular" width="15%" height={40} sx={{ borderRadius: 1 }} />
      </Box>

      {/* Table Rows */}
      {Array.from({ length: rows }).map((_, idx) => (
        <Box 
          key={idx} 
          sx={{ 
            display: 'flex', 
            gap: 2, 
            mb: 1.5, 
            py: 1,
            '&:hover': { backgroundColor: '#f8fafc' }
          }}
        >
          <Skeleton variant="text" width="5%" height={32} />
          <Skeleton variant="text" width="25%" height={32} />
          <Skeleton variant="text" width="20%" height={32} />
          <Skeleton variant="text" width="20%" height={32} />
          <Skeleton variant="text" width="15%" height={32} />
          <Skeleton variant="circular" width={32} height={32} />
        </Box>
      ))}
    </Paper>
  );
};

export default LoadingSkeleton;
