// components/PageHeader.jsx
import { Stack, IconButton, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";

export function PageHeader({ title }) {
  const navigate = useNavigate();
  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
      <IconButton onClick={() => navigate(-1)}>
        <ArrowBackIcon />
      </IconButton>
      <Typography variant="h6" fontWeight={800}>{title}</Typography>
    </Stack>
  );
}
