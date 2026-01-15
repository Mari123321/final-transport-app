import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
} from "@mui/material";
import { Warning as WarningIcon } from "@mui/icons-material";

/**
 * ConfirmDeleteDialog Component
 * Displays a confirmation dialog before deleting a record
 *
 * @param {boolean} open - Controls dialog visibility
 * @param {string} title - Dialog title (default: "Confirm Delete")
 * @param {string} message - Confirmation message
 * @param {string} itemName - Name/identifier of item being deleted
 * @param {Function} onConfirm - Callback when user confirms delete
 * @param {Function} onCancel - Callback when user cancels
 * @param {boolean} loading - Show loading spinner on confirm button (default: false)
 */
const ConfirmDeleteDialog = ({
  open,
  title = "Confirm Delete",
  message = "Are you sure you want to delete this item?",
  itemName = "",
  onConfirm,
  onCancel,
  loading = false,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle id="alert-dialog-title" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <WarningIcon sx={{ color: "#d32f2f" }} />
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description" sx={{ mt: 2 }}>
          {message}
          {itemName && (
            <>
              <br />
              <strong sx={{ color: "#1e293b" }}>"{itemName}"</strong>
            </>
          )}
          <br />
          <br />
          This action cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onCancel} disabled={loading} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          disabled={loading}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          {loading && <CircularProgress size={16} color="inherit" />}
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDeleteDialog;
