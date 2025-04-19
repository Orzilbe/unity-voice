'use client';

import { useRouter } from 'next/navigation';

interface NavigationButtonProps {
  text: string;
  path: string;
}

export default function NavigationButton({ text, path }: NavigationButtonProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push(path)}
      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
    >
      {text}
    </button>
  );
} 