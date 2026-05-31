import { Card, CardContent, Skeleton, Stack } from "@mui/material";

const LoadingCardSkeleton = ({ lines = 3, height = 190 }) => (
  <Card sx={{ borderRadius: "1.25rem", height }}>
    <CardContent>
      <Stack spacing={1.5}>
        <Skeleton variant="text" width="40%" height={24} />
        <Skeleton variant="text" width="65%" height={42} />
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton key={index} variant="text" width={`${90 - index * 12}%`} />
        ))}
      </Stack>
    </CardContent>
  </Card>
);

export default LoadingCardSkeleton;
