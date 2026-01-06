import React from 'react';
import { Box, Card, CardContent, Typography, Chip } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

const StatsCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color = 'primary',
  trend,
  trendValue 
}) => {
  return (
    <Card 
      elevation={2}
      sx={{ 
        height: '100%',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4
        }
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight="bold" color={`${color}.main`}>
              {value}
            </Typography>
          </Box>
          
          {Icon && (
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: `${color}.lighter` || `${color}.light`,
                color: `${color}.main`
              }}
            >
              <Icon fontSize="medium" />
            </Box>
          )}
        </Box>

        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}

        {trend && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <Chip
              size="small"
              icon={trend === 'up' ? <TrendingUp /> : <TrendingDown />}
              label={trendValue}
              color={trend === 'up' ? 'success' : 'error'}
              variant="outlined"
              sx={{ fontSize: '0.75rem' }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard;