import React from "react";
import { Breadcrumbs, Link, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

/**
 * Compact, reusable breadcrumb for the Courses entity-management routes.
 * Items are created from IDs/names resolved by CourseEntityRoute; this
 * component only renders the links and never assumes entity relationships.
 */
export default function CourseBreadcrumb({ items = [], currentLabel }) {
  const visibleItems = items.filter((item) => item?.label);

  return (
    <Breadcrumbs
      aria-label="Courses hierarchy breadcrumb"
      separator={<Typography component="span" variant="body2" color="text.disabled">&gt;</Typography>}
      sx={{
        minWidth: 0,
        maxWidth: "100%",
        mb: 1.5,
        "& .MuiBreadcrumbs-ol": {
          flexWrap: "wrap",
          rowGap: 0.5,
          minWidth: 0,
        },
        "& .MuiBreadcrumbs-li": {
          minWidth: 0,
          maxWidth: "100%",
        },
        "& .MuiBreadcrumbs-separator": {
          mx: { xs: 0.5, sm: 0.75 },
        },
      }}
    >
      {visibleItems.map((item) => (
        item.to ? (
          <Link
            key={`${item.type}-${item.id}`}
            component={RouterLink}
            to={item.to}
            underline="hover"
            color="primary.main"
            title={item.label}
            sx={{
              display: "inline-block",
              minWidth: 0,
              maxWidth: { xs: 105, sm: 180, md: 240 },
              fontSize: "0.875rem",
              overflowWrap: "anywhere",
              verticalAlign: "bottom",
            }}
          >
            {item.label}
          </Link>
        ) : (
          <Typography
            key={`${item.type}-${item.id}`}
            component="span"
            variant="body2"
            color="text.secondary"
            title={item.label}
            sx={{
              maxWidth: { xs: 105, sm: 180, md: 240 },
              fontSize: "0.875rem",
              overflowWrap: "anywhere",
            }}
          >
            {item.label}
          </Typography>
        )
      ))}
      <Typography
        key="current-page"
        component="span"
        variant="body2"
        color="text.primary"
        aria-current="page"
        title={currentLabel}
        sx={{
          fontWeight: 600,
          maxWidth: { xs: 140, sm: 220, md: 300 },
          overflowWrap: "anywhere",
        }}
      >
        {currentLabel}
      </Typography>
    </Breadcrumbs>
  );
}
