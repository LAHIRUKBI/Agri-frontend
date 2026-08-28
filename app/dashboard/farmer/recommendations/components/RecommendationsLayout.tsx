'use client';

import FarmerSidebar from '@/app/navigation/farmer/page';
import type { ReactNode } from 'react';

type SidebarUser = {
  name: string;
  email?: string;
  phoneNumber?: string;
  photoURL?: string;
};

type RecommendationsLayoutProps = {
  children: ReactNode;
};

const SIDEBAR_USER: SidebarUser = { name: 'Farmer' };

export default function RecommendationsLayout({
  children,
}: RecommendationsLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 lg:flex-row">
      <FarmerSidebar user={SIDEBAR_USER} />
      <main className="min-w-0 flex-1 overflow-y-auto bg-[radial-gradient(circle_at_92%_4%,rgba(254,243,199,0.4),transparent_24%),linear-gradient(145deg,#f8fcf9_0%,#f8fafc_62%,#ffffff_100%)] px-4 pb-10 pt-20 text-slate-950 sm:px-6 lg:px-8 lg:py-9">
        <div className="mx-auto w-full max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
