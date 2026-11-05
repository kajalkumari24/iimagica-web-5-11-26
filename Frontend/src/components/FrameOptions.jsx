// import React from "react";
// import { Typography, Grid, Paper } from "@mui/material";

// const frames = [
//   null,
//   "/frame1.png",
//   "frame2.jpg",
//   "frame3.jpg",
//   "frame4.jpg",
//   "frame5.jpg",
//   "frame6.jpg",
// ];

// const FrameOptions = ({ selectedFrame, applyFrame }) => {
//   return (
//     <div style={{ padding: 16 }}>
//       <Typography variant="subtitle1" gutterBottom>
//         Frame Options
//       </Typography>
//       <Grid container spacing={2}>
//         {frames.map((frame, index) => (
//           <Grid item xs={6} key={index}>
//             <Paper
//               onClick={() => applyFrame(frame)}
//               sx={{
//                 border:
//                   selectedFrame === frame ? "2px solid #673ab7" : "2px solid transparent",
//                 cursor: "pointer",
//               }}
//             >
//               {frame ? (
//                 <img
//                   src={frame}
//                   alt={`Frame ${index}`}
//                   style={{ width: "100%", display: "block" }}
//                 />
//               ) : (
//                 <div
//                   style={{
//                     height: 100,
//                     display: "flex",
//                     alignItems: "center",
//                     justifyContent: "center",
//                   }}
//                 >
//                   No Frame
//                 </div>
//               )}
//             </Paper>
//           </Grid>
//         ))}
//       </Grid>
//     </div>
//   );
// };

// export default FrameOptions;
