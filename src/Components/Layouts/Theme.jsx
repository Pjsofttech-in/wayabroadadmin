// import React from "react";
// import { ConfigProvider } from "antd";
// import "@fontsource/poppins"; // Import Poppins font

// const theme = {
//   token: {
//     fontFamily: "Poppins, Helvetica, sans-serif", // Set Poppins as the default font
//     fontSize: 12, // Default font size
//   },
// };

// const ThemeProvider = ({ children }) => {
//   return <ConfigProvider theme={theme}>{children}</ConfigProvider>;
// };

// export default ThemeProvider;

// src/theme.js
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  typography: {
    fontFamily: 'Poppins, Helvetica, sans-serif', // Set Poppins as the default font
    fontSize: 12, 
  },
  // Add other custom styles or overrides here if needed
});

export default theme;
