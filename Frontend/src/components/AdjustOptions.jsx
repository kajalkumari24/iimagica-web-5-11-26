import React from "react";
import { Slider, Typography, Grid } from "@mui/material";

const AdjustOptions = ({ adjustments, updateAdjustment }) => {
  return (
    <div style={{ padding: 16 }}>
      <Typography variant="subtitle1" gutterBottom>
        Adjustments
      </Typography>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12}>
          <Typography gutterBottom>Brightness</Typography>
          <Slider
            value={adjustments.brightness}
            min={-1}
            max={1}
            step={0.01}
            onChange={(e, value) => updateAdjustment("brightness", value)}
          />
        </Grid>
        <Grid item xs={12}>
          <Typography gutterBottom>Contrast</Typography>
          <Slider
            value={adjustments.contrast}
            min={-1}
            max={1}
            step={0.01}
            onChange={(e, value) => updateAdjustment("contrast", value)}
          />
        </Grid>
        <Grid item xs={12}>
          <Typography gutterBottom>Saturation</Typography>
          <Slider
            value={adjustments.saturation}
            min={-1}
            max={1}
            step={0.01}
            onChange={(e, value) => updateAdjustment("saturation", value)}
          />
        </Grid>
        <Grid item xs={12}>
          <Typography gutterBottom>Vibrance</Typography>
          <Slider
            value={adjustments.vibrance}
            min={-1}
            max={1}
            step={0.01}
            onChange={(e, value) => updateAdjustment("vibrance", value)}
          />
        </Grid>
        <Grid item xs={12}>
          <Typography gutterBottom>Blur</Typography>
          <Slider
            value={adjustments.blur}
            min={0}
            max={1}
            step={0.01}
            onChange={(e, value) => updateAdjustment("blur", value)}
          />
        </Grid>
      </Grid>
    </div>
  );
};

export default AdjustOptions;
