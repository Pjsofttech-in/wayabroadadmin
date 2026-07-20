import React from "react";
import { Box } from "@mui/material";
import { Trefoil } from "ldrs/react";
import "ldrs/react/Trefoil.css";

const LoadingOverlay = ({ loading }) => {
  if (!loading) return null;

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(255, 255, 255, 0.133)",
        zIndex: 9999,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backdropFilter: "blur(1px)", // Apply blur effect
        filter: "blur 1px" /* Apply blur effect */,
        pointerEvents: "none" /* Disable interactions */,
        userSelect: "none" /* Prevent text selection */,
      
      }}
    >
      <Trefoil
        size="80"
        stroke="8"
        strokeLength="0.15"
        bgOpacity="0.35"
        speed="1.4"
        color="#2980B9"
      />
    </Box>
  );
};

export default LoadingOverlay;
