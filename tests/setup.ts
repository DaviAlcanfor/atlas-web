import { configure } from '@testing-library/react';

// The country panel is a big DOM and role queries in jsdom are slow; under CPU load (parallel workers, another
// suite running) the 1 s default made findByRole time out before the 150 ms mock delay even mattered.
configure({ asyncUtilTimeout: 5000 });
