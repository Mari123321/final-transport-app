import React from "react";
import { Box, Typography } from "@mui/material";
import { FolderOpen as FolderOpenIcon } from "@mui/icons-material";

/**
 * EmptyState Component
 * Displays a clean empty state message when no data exists
 *
 * @param {string} message - Main message to display
 * @param {string} submessage - Secondary/helper message
 * @param {React.ReactNode} icon - Optional icon to display
 */
const EmptyState = ({
  message = "No records found",
  submessage = "Try adjusting filters or add a new record.",
  icon: Icon = FolderOpenIcon,
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        py: 6,
        px: 3,
        color: "#94a3b8",
      }}
    >
      <Icon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
      <Typography variant="body1" sx={{ fontWeight: 500, color: "#64748b", mb: 0.5 }}>
        {message}
      </Typography>
      {submessage && (
        <Typography variant="body2" sx={{ color: "#94a3b8" }}>
          {submessage}
        </Typography>
      )}
    </Box>
  );
};

export default EmptyState;
