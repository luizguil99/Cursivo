import React from 'react';
import { ThemeToggle } from './theme-toggle';

function TopNav() {
  return (
    <div className="absolute top-4 right-4 z-50">
      <ThemeToggle />
    </div>
  );
}

export default TopNav;
