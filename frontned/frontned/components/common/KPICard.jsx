import React from 'react';
import { Card, CardContent, Typography, Box, Skeleton } from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

const KPICard = ({ 
  title, 
  value, 
  subtitle, 
  color = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  icon: Icon,
  trend,
  loading = false
}) => {
  if (loading) {
    return (
      <Card sx={{ 
        borderRadius: 2, 
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        border: '1px solid #e2e8f0',
        height: '100%'
      }}>
        <CardContent sx={{ py: 2.5 }}>
          <Skeleton variant="text" width="60%" height={24} sx={{ mb: 1 }} />
          <Skeleton variant="text" width="80%" height={40} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      sx={{ 
        borderRadius: 2, 
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        background: color,
        border: '1px solid rgba(0,0,0,0.06)',
        transition: 'all 0.3s ease',
        height: '100%',
        '&:hover': {
          boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          transform: 'translateY(-4px)'
        }
      }}
    >
      <CardContent sx={{ py: 2.5, position: 'relative', overflow: 'hidden' }}>
        {Icon && (
          <Box 
            sx={{ 
              position: 'absolute', 
              right: 16, 
              top: 16, 
              opacity: 0.2,
              fontSize: 48
            }}
          >
            <Icon sx={{ fontSize: 48 }} />
          </Box>
        )}
        
        <Typography 
          variant="subtitle2" 
          sx={{ 
            color: 'rgba(0,0,0,0.7)', 
            fontSize: '0.875rem', 
            fontWeight: 600,
            mb: 0.5,
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}
        >
          {title}
        </Typography>
        
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 700, 
            color: '#1e293b',
            mb: subtitle || trend ? 1 : 0
          }}
        >
          {value}
        </Typography>

        {subtitle && (
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'rgba(0,0,0,0.6)',
              display: 'block'
            }}
          >
            {subtitle}
          </Typography>
        )}

        {trend && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
            {trend.direction === 'up' ? (
              <TrendingUp sx={{ fontSize: 16, color: '#059669' }} />
            ) : (
              <TrendingDown sx={{ fontSize: 16, color: '#dc2626' }} />
            )}
            <Typography 
              variant="caption" 
              sx={{ 
                color: trend.direction === 'up' ? '#059669' : '#dc2626',
                fontWeight: 600
              }}
            >
              {trend.value}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(0,0,0,0.5)' }}>
              {trend.label}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default KPICard;
