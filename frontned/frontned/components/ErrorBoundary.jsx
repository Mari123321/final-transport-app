import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { ErrorOutline, Refresh } from '@mui/icons-material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      // Example: logErrorToService(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            p: 3
          }}
        >
          <Paper
            elevation={8}
            sx={{
              maxWidth: 600,
              width: '100%',
              p: 5,
              textAlign: 'center',
              borderRadius: 3
            }}
          >
            <ErrorOutline 
              sx={{ 
                fontSize: 80, 
                color: '#dc2626', 
                mb: 2,
                animation: 'pulse 2s infinite'
              }} 
            />
            
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 700, 
                color: '#1e293b', 
                mb: 2 
              }}
            >
              Oops! Something Went Wrong
            </Typography>
            
            <Typography 
              variant="body1" 
              sx={{ 
                color: '#64748b', 
                mb: 4,
                lineHeight: 1.6
              }}
            >
              We encountered an unexpected error. This has been logged and our team will look into it.
              You can try refreshing the page or return to the dashboard.
            </Typography>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Box
                sx={{
                  textAlign: 'left',
                  backgroundColor: '#fee2e2',
                  border: '1px solid #dc2626',
                  borderRadius: 2,
                  p: 2,
                  mb: 3,
                  maxHeight: 200,
                  overflow: 'auto',
                  fontSize: '0.875rem',
                  fontFamily: 'monospace'
                }}
              >
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#991b1b', display: 'block', mb: 1 }}>
                  Error Details (Development Mode):
                </Typography>
                <Typography variant="caption" sx={{ color: '#7f1d1d', display: 'block', whiteSpace: 'pre-wrap' }}>
                  {this.state.error.toString()}
                </Typography>
                {this.state.errorInfo && (
                  <Typography variant="caption" sx={{ color: '#7f1d1d', display: 'block', whiteSpace: 'pre-wrap', mt: 1 }}>
                    {this.state.errorInfo.componentStack}
                  </Typography>
                )}
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<Refresh />}
                onClick={this.handleReset}
                sx={{ minWidth: 140 }}
              >
                Refresh Page
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={this.handleGoHome}
                sx={{ minWidth: 140 }}
              >
                Go to Dashboard
              </Button>
            </Box>

            <style>
              {`
                @keyframes pulse {
                  0%, 100% { opacity: 1; }
                  50% { opacity: 0.5; }
                }
              `}
            </style>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
