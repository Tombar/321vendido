import * as migration_20250128_031842 from './20250128_031842';

export const migrations = [
  {
    up: migration_20250128_031842.up,
    down: migration_20250128_031842.down,
    name: '20250128_031842'
  },
];
