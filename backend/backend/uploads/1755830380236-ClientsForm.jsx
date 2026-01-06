import React, { useState } from "react";
import {
  Box,
  Grid,
  TextField,
  Button,
  Typography,
  Paper,
  Divider,
} from "@mui/material";

const ClientForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
    addressProofFile: null,
    idCardFile: null,
    aadharFile: null,
    panCardFile: null,
  });

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (files) {
      setFormData((prev) => ({
        ...prev,
        [name]: files[0],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Paper
      elevation={6}
      sx={{
        p: 4,
        maxWidth: 700,
        margin: "auto",
        borderRadius: 3,
        boxShadow: "0 8px 16px rgba(0,0,0,0.15)",
        background: "linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)",
      }}
    >
      <Typography
        variant="h5"
        sx={{ mb: 3, fontWeight: "700", letterSpacing: 1, color: "#3f51b5" }}
      >
        Add New Client
      </Typography>

      <Divider sx={{ mb: 3 }} />

      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <Grid container spacing={3}>
          {/* Name */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              name="name"
              label="Client Name"
              value={formData.name}
              onChange={handleChange}
              required
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 3,
                  boxShadow: "0 2px 6px rgba(63, 81, 181, 0.2)",
                  transition: "0.3s",
                },
                "& .MuiOutlinedInput-root.Mui-focused": {
                  boxShadow: "0 4px 10px rgba(63, 81, 181, 0.5)",
                },
                "& label.Mui-focused": {
                  color: "#3f51b5",
                },
              }}
            />
          </Grid>

          {/* Phone */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              name="phone"
              label="Phone Number"
              value={formData.phone}
              onChange={handleChange}
              type="tel"
              required
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 3,
                  boxShadow: "0 2px 6px rgba(63, 81, 181, 0.2)",
                  transition: "0.3s",
                },
                "& .MuiOutlinedInput-root.Mui-focused": {
                  boxShadow: "0 4px 10px rgba(63, 81, 181, 0.5)",
                },
                "& label.Mui-focused": {
                  color: "#3f51b5",
                },
              }}
            />
          </Grid>

          {/* Address */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              name="address"
              label="Address"
              value={formData.address}
              onChange={handleChange}
              multiline
              rows={3}
              required
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 3,
                  boxShadow: "0 2px 6px rgba(63, 81, 181, 0.2)",
                  transition: "0.3s",
                },
                "& .MuiOutlinedInput-root.Mui-focused": {
                  boxShadow: "0 4px 10px rgba(63, 81, 181, 0.5)",
                },
                "& label.Mui-focused": {
                  color: "#3f51b5",
                },
              }}
            />
          </Grid>

          {/* File Uploads */}
          {[
            { label: "Address Proof", name: "addressProofFile" },
            { label: "ID Card", name: "idCardFile" },
            { label: "Aadhar Card", name: "aadharFile" },
            { label: "PAN Card", name: "panCardFile" },
          ].map(({ label, name }) => (
            <Grid item xs={12} sm={6} key={name}>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                sx={{
                  borderRadius: 3,
                  textTransform: "none",
                  color: "#3f51b5",
                  borderColor: "#3f51b5",
                  fontWeight: "600",
                  boxShadow: "0 2px 6px rgba(63, 81, 181, 0.2)",
                  "&:hover": {
                    borderColor: "#283593",
                    boxShadow: "0 4px 10px rgba(40, 53, 147, 0.4)",
                    backgroundColor: "rgba(63,81,181,0.1)",
                  },
                }}
              >
                Upload {label}
                <input
                  type="file"
                  name={name}
                  hidden
                  onChange={handleChange}
                  accept="image/*,application/pdf"
                />
              </Button>
              {formData[name] && (
                <Typography
                  variant="body2"
                  sx={{ mt: 0.5, fontStyle: "italic", color: "#555" }}
                >
                  Selected: {formData[name].name}
                </Typography>
              )}
            </Grid>
          ))}

          {/* Submit Button */}
          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{
                backgroundColor: "#3f51b5",
                fontWeight: "700",
                padding: "12px",
                fontSize: "1.1rem",
                borderRadius: 3,
                boxShadow: "0 5px 15px rgba(63, 81, 181, 0.4)",
                transition: "0.3s",
                "&:hover": {
                  backgroundColor: "#283593",
                  boxShadow: "0 7px 20px rgba(40, 53, 147, 0.6)",
                },
              }}
            >
              Save Client
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default ClientForm;
