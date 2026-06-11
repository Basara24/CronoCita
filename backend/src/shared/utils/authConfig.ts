export const authConfig = {
  get jwtSecret(): string {
    return process.env.JWT_SECRET ?? 'cronocita-dev-secret';
  },
  get jwtRefreshSecret(): string {
    return process.env.JWT_REFRESH_SECRET ?? 'cronocita-dev-refresh-secret';
  },
  get jwtExpiresIn(): string {
    return process.env.JWT_EXPIRES_IN ?? '15m';
  },
  get refreshExpiresInDays(): number {
    return Number(process.env.JWT_REFRESH_EXPIRES_IN_DAYS ?? 7);
  },
};
