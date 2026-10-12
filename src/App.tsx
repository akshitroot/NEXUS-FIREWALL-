/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FirewallProvider } from './hooks/useFirewall';
import { MainLayout } from './layouts/MainLayout';

export default function App() {
  return (
    <FirewallProvider>
      <MainLayout />
    </FirewallProvider>
  );
}

