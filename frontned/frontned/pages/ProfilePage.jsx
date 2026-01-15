import React, { useState, useEffect } from "react";
import { Box, Container, Card, CardContent, Typography, Avatar, Grid, CircularProgress, Alert } from "@mui/material";
import axios from "axios";

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Try to get token from localStorage
        const token = localStorage.getItem("token");
        
        // For demo, if no token, use demo data
        if (!token) {
          setUser({
            username: "Admin User",
            email: "admin@transport.com",
            role: "admin",
            createdAt: "2024-04-01T00:00:00.000Z",
          });
          setLoading(false);
          return;
        }

        const response = await axios.get("http://localhost:5000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          setUser(response.data.user);
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
        // Fallback to demo data if API fails
        setUser({
          username: "Admin User",
          email: "admin@transport.com",
          role: "admin",
          createdAt: "2024-04-01T00:00:00.000Z",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Box sx={{ backgroundColor: "#f5f7fa", minHeight: "100vh", py: 4 }}>
      <Container maxWidth="md">
        <Card sx={{ boxShadow: 3 }}>
          <CardContent sx={{ p: 4 }}>
            {/* Header with Avatar */}
            <Box sx={{ display: "flex", alignItems: "center", mb: 4, gap: 3 }}>
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  bgcolor: "#1976d2",
                  fontSize: "2rem",
                  fontWeight: "bold",
                }}
              >
                {getInitials(user?.username)}
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {user?.username || "User"}
                </Typography>
                <Typography color="textSecondary" sx={{ mb: 0.5 }}>
                  {user?.email || "No email"}
                </Typography>
                <Typography
                  sx={{
                    display: "inline-block",
                    px: 2,
                    py: 0.5,
                    borderRadius: 2,
                    bgcolor: "#e3f2fd",
                    color: "#1976d2",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                  }}
                >
                  {user?.role?.toUpperCase() || "USER"}
                </Typography>
              </Box>
            </Box>

            {/* Account Information */}
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Account Information
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  Username
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {user?.username || "N/A"}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  Email Address
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {user?.email || "N/A"}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  Role
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || "N/A"}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="textSecondary">
                  Member Since
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {formatDate(user?.createdAt)}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default ProfilePage;
