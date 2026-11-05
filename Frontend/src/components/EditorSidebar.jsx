// import React from "react";
// import { Drawer, Box, Typography } from "@mui/material";
// import TextOptions from "./TextOptions";
// import AdjustOptions from "./AdjustOptions";
// import CropOptions from "./CropOptions";
// import FrameOptions from "./FrameOptions";
// import ExportOptions from "./ExportOptions";

// const EditorSidebar = ({
//   open,
//   onClose,
//   activeTool,
//   textOptions,
//   updateText,
//   deleteText,
//   selectedText,
//   adjustments,
//   updateAdjustment,
//   aspectRatio,
//   setAspectRatio,
//   isCropping,
//   startCrop,
//   applyCrop,
//   cancelCrop,
//   selectedFrame,
//   applyFrame,
//   download,
// }) => {
//   const renderSidebarContent = () => {
//     switch (activeTool) {
//       case "text":
//         return (
//           <TextOptions
//             textOptions={textOptions}
//             updateText={updateText}
//             deleteText={deleteText}
//             selectedText={selectedText}
//           />
//         );
//       case "adjust":
//         return (
//           <AdjustOptions
//             adjustments={adjustments}
//             updateAdjustment={updateAdjustment}
//           />
//         );
//       case "crop":
//         return (
//           <CropOptions
//             aspectRatio={aspectRatio}
//             setAspectRatio={setAspectRatio}
//             isCropping={isCropping}
//             startCrop={startCrop}
//             applyCrop={applyCrop}
//             cancelCrop={cancelCrop}
//           />
//         );
//       case "frames":
//         return (
//           <FrameOptions
//             selectedFrame={selectedFrame}
//             applyFrame={applyFrame}
//           />
//         );
//       case "export":
//         return <ExportOptions download={download} />;
//       default:
//         return (
//           <Box p={2}>
//             <Typography>Select a tool to see its options.</Typography>
//           </Box>
//         );
//     }
//   };

//   return (
//     <Drawer anchor="left" open={open} onClose={onClose}>
//       <Box sx={{ width: 300, mt: 8 }}>{renderSidebarContent()}</Box>
//     </Drawer>
//   );
// };

// export default EditorSidebar;
