import React from "react";
import {
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  ToggleButtonGroup,
  ToggleButton,
  Grid,
  Typography,
} from "@mui/material";
import { FormatBold, FormatItalic } from "@mui/icons-material";

const TextOptions = ({
  textOptions,
  updateText,
  deleteText,
  selectedText,
}) => {
  if (!selectedText) {
    return <Typography sx={{p: 2}}>Select a text box to edit, or add a new one.</Typography>;
  }

  return (
    <div style={{ padding: 16 }}>
      <Typography variant="subtitle1" gutterBottom>
        Text Options
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            label="Font Size"
            type="number"
            value={textOptions.fontSize}
            onChange={(e) => updateText("fontSize", parseInt(e.target.value))}
            fullWidth
          />
        </Grid>
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Font Family</InputLabel>
            <Select
              value={textOptions.fontFamily}
              label="Font Family"
              onChange={(e) => updateText("fontFamily", e.target.value)}
            >
              <MenuItem value="Arial">Arial</MenuItem>
              <MenuItem value="Verdana">Verdana</MenuItem>
              <MenuItem value="Times New Roman">Times New Roman</MenuItem>
              <MenuItem value="Courier New">Courier New</MenuItem>
              <MenuItem value="Georgia">Georgia</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={6}>
            <Typography gutterBottom>Color</Typography>
            <input
                type="color"
                value={textOptions.fill}
                onChange={(e) => updateText("fill", e.target.value)}
                style={{ width: '100%', height: 40 }}
            />
        </Grid>
        <Grid item xs={6}>
            <Typography gutterBottom>Background</Typography>
            <input
                type="color"
                value={textOptions.backgroundColor}
                onChange={(e) => updateText("backgroundColor", e.target.value)}
                style={{ width: '100%', height: 40 }}
            />
        </Grid>
        <Grid item xs={12}>
          <ToggleButtonGroup
            value={[
              textOptions.fontWeight,
              textOptions.fontStyle,
            ]}
            aria-label="text formatting"
          >
            <ToggleButton
              value="bold"
              onClick={() =>
                updateText(
                  "fontWeight",
                  textOptions.fontWeight === "bold" ? "normal" : "bold"
                )
              }
            >
              <FormatBold />
            </ToggleButton>
            <ToggleButton
              value="italic"
              onClick={() =>
                updateText(
                  "fontStyle",
                  textOptions.fontStyle === "italic" ? "normal" : "italic"
                )
              }
            >
              <FormatItalic />
            </ToggleButton>
          </ToggleButtonGroup>
        </Grid>
        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Alignment</InputLabel>
            <Select
              value={textOptions.textAlign}
              label="Alignment"
              onChange={(e) => updateText("textAlign", e.target.value)}
            >
              <MenuItem value="left">Left</MenuItem>
              <MenuItem value="center">Center</MenuItem>
              <MenuItem value="right">Right</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <Button variant="contained" color="error" onClick={deleteText} fullWidth>
            Delete Text
          </Button>
        </Grid>
      </Grid>
    </div>
  );
};

export default TextOptions;
