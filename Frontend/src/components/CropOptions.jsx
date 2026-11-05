// import React from "react";
// import {
//   Button,
//   Typography,
//   Grid,
//   ToggleButtonGroup,
//   ToggleButton,
// } from "@mui/material";

// const CropOptions = ({
//   aspectRatio,
//   setAspectRatio,
//   isCropping,
//   startCrop,
//   applyCrop,
//   cancelCrop,
// }) => {
//   return (
//     <div style={{ padding: 16 }}>
//       <Typography variant="subtitle1" gutterBottom>
//         Crop Options
//       </Typography>
//       <Grid container spacing={2}>
//         <Grid item xs={12}>
//           <ToggleButtonGroup
//             value={aspectRatio}
//             exclusive
//             onChange={(e, newRatio) => setAspectRatio(newRatio)}
//             fullWidth
//           >
//             <ToggleButton value="free">Free</ToggleButton>
//             <ToggleButton value="1:1">1:1</ToggleButton>
//             <ToggleButton value="16:9">16:9</ToggleButton>
//             <ToggleButton value="4:3">4:3</ToggleButton>
//           </ToggleButtonGroup>
//         </Grid>
//         <Grid item xs={12}>
//           {!isCropping ? (
//             <Button variant="contained" onClick={startCrop} fullWidth>
//               Start Crop
//             </Button>
//           ) : (
//             <Grid container spacing={1}>
//               <Grid item xs={6}>
//                 <Button
//                   variant="contained"
//                   color="primary"
//                   onClick={applyCrop}
//                   fullWidth
//                 >
//                   Apply
//                 </Button>
//               </Grid>
//               <Grid item xs={6}>
//                 <Button
//                   variant="outlined"
//                   color="secondary"
//                   onClick={cancelCrop}
//                   fullWidth
//                 >
//                   Cancel
//                 </Button>
//               </Grid>
//             </Grid>
//           )}
//         </Grid>
//       </Grid>
//     </div>
//   );
// };

// export default CropOptions;
