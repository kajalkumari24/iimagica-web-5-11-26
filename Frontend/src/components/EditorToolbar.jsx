import React from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Button,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import {
  TextFields,
  Crop,
  Tune,
  FilterFrames,
  Undo,
  Redo,
  SaveAlt,
  Close,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";

const EditorToolbar = ({
  activeTool,
  setActiveTool,
  handleReplaceClick,
  fitToView,
  resetCanvas,
  toggleSidebar,
  sidebarOpen,
  navigate,
}) => {
  return (
    <AppBar position="static" color="default">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Editor
        </Typography>

        <ToggleButtonGroup
          value={activeTool}
          exclusive
          onChange={(e, newTool) => setActiveTool(newTool)}
          aria-label="text alignment"
        >
          <ToggleButton value="text" aria-label="text">
            <TextFields />
          </ToggleButton>
          <ToggleButton value="crop" aria-label="crop">
            <Crop />
          </ToggleButton>
          <ToggleButton value="adjust" aria-label="adjust">
            <Tune />
          </ToggleButton>
          <ToggleButton value="frames" aria-label="frames">
            <FilterFrames />
          </ToggleButton>
        </ToggleButtonGroup>

        <div style={{ flexGrow: 1 }} />

        <Button color="inherit" onClick={handleReplaceClick}>
          Replace
        </Button>
        <Button color="inherit" onClick={fitToView}>
          Fit
        </Button>
        <Button color="inherit" onClick={resetCanvas}>
          Reset
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setActiveTool("export")}
          startIcon={<SaveAlt />}
        >
          Export
        </Button>
        <IconButton onClick={toggleSidebar}>
          {sidebarOpen ? <VisibilityOff /> : <Visibility />}
        </IconButton>
        <IconButton onClick={() => navigate(-1)}>
          <Close />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};

export default EditorToolbar;
