import React from "react";
import { Box, IconButton, Tooltip } from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";

/**
 * ActionButtons Component
 * Renders Edit and Delete buttons with tooltips and consistent styling
 *
 * @param {Function} onEdit - Callback function for edit action
 * @param {Function} onDelete - Callback function for delete action
 * @param {boolean} disabled - Disable buttons during API calls (default: false)
 * @param {string} editTooltip - Tooltip text for edit button (default: "Edit")
 * @param {string} deleteTooltip - Tooltip text for delete button (default: "Delete")
 * @param {string} editColor - Color for edit button (default: "primary")
 * @param {string} deleteColor - Color for delete button (default: "error")
 */
const ActionButtons = ({
  onEdit,
  onDelete,
  disabled = false,
  editTooltip = "Edit Details",
  deleteTooltip = "Delete",
  editColor = "primary",
  deleteColor = "error",
}) => {
  return (
    <Box sx={{ display: "flex", gap: 0.5 }}>
      {/* Edit Button */}
      <Tooltip title={editTooltip}>
        <span>
          <IconButton
            onClick={onEdit}
            color={editColor}
            size="small"
            disabled={disabled}
            sx={{
              transition: "all 0.2s ease",
              "&:hover:not(:disabled)": {
                transform: "scale(1.1)",
                backgroundColor: "rgba(25, 118, 210, 0.08)",
              },
              "&:disabled": {
                opacity: 0.5,
              },
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>

      {/* Delete Button */}
      <Tooltip title={deleteTooltip}>
        <span>
          <IconButton
            onClick={onDelete}
            color={deleteColor}
            size="small"
            disabled={disabled}
            sx={{
              transition: "all 0.2s ease",
              "&:hover:not(:disabled)": {
                transform: "scale(1.1)",
                backgroundColor: "rgba(211, 47, 47, 0.08)",
              },
              "&:disabled": {
                opacity: 0.5,
              },
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );
};

export default ActionButtons;
