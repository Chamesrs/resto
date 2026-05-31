import { ContentCopyOutlined } from "@mui/icons-material";
import { Alert, Box, Button, Card, CardContent, Stack, Typography } from "@mui/material";
import { useState } from "react";

const ManualActionCard = ({
  title,
  description,
  command,
  severity = "warning",
  note = "",
  onCopy,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      onCopy?.();
      window.setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      onCopy?.(error);
    }
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={1.5}>
          <Typography variant="subtitle1" fontWeight={700}>
            {title}
          </Typography>
          <Typography variant="body2">{description}</Typography>
          <Alert severity={severity} sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {command}
          </Alert>
          {note ? <Typography variant="caption">{note}</Typography> : null}
          <Box>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ContentCopyOutlined />}
              onClick={handleCopy}
            >
              {copied ? "Commande copiee" : "Copier la commande"}
            </Button>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default ManualActionCard;
